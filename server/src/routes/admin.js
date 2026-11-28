import { Router } from 'express'
import { z } from 'zod'
import mongoose from 'mongoose'
import { Product, Category, Order, Settings, ProductRequest, User, PageView, Presence, Notification, Review, OrderCost } from '../models/index.js'
import { splitCosts, saveCosts, withCosts, costMap, costOfItems } from '../utils/costs.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { asyncHandler, validate } from '../middleware/error.js'
import { notifyStatus } from '../utils/notify.js'
import { sendMail, mailProvider } from '../utils/mailer.js'
import { withImages } from '../utils/orderImages.js'

const router = Router()
router.use(authenticate, requireAdmin)

/* --------------------------------- Stats ---------------------------------- */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const start = new Date(); start.setHours(0, 0, 0, 0)
    const [todaysOrders, pendingVerification, products, revenueAgg] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: start } }),
      Order.countDocuments({ 'payment.status': 'pending_verification' }),
      Product.countDocuments({ isActive: true }),
      Order.aggregate([{ $match: { 'payment.status': 'paid' } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    ])
    res.json({ todaysOrders, pendingVerification, products, revenue: revenueAgg[0]?.total || 0 })
  })
)

/* ------------------------------- Analytics -------------------------------- */
const DAY = 24 * 60 * 60 * 1000
const LIVE_MS = 2 * 60 * 1000
const IST = 5.5 * 60 * 60 * 1000
// Midnight in India (server runs in UTC)
const startOfDay = (t = Date.now()) => { const x = new Date(t + IST); x.setUTCHours(0, 0, 0, 0); return new Date(x.getTime() - IST) }
// Order outcome buckets used across the dashboard
const outcome = {
  $switch: {
    branches: [
      { case: { $or: [{ $in: ['$payment.status', ['paid', 'cod_collected']] }, { $eq: ['$status', 'Delivered'] }] }, then: 'success' },
      { case: { $or: [{ $in: ['$status', ['Payment Rejected', 'Cancelled', 'Returned']] }, { $eq: ['$payment.status', 'rejected'] }] }, then: 'failed' },
    ],
    default: 'pending',
  },
}
const dayKey = (field) => ({ $dateToString: { format: '%Y-%m-%d', date: field, timezone: 'Asia/Kolkata' } })
function fillDays(days, rows, keys) {
  const out = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY)
    const key = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
    const row = rows.find((r) => r._id === key) || {}
    out.push({ date: key, ...Object.fromEntries(keys.map((k) => [k, row[k] || 0])) })
  }
  return out
}

router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const now = Date.now()
    const today = startOfDay()
    const since14 = startOfDay(now - 13 * DAY)
    const since30 = new Date(now - 30 * DAY)
    const [
      users, newUsers7, live, viewsToday, visitorsToday, ordersToday, outcomes, statusBreakdown,
      orderSeries, trafficSeries, topProducts, recentOrders, recentRequests, openRequests, visitors7, orders7,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', createdAt: { $gte: new Date(now - 7 * DAY) } }),
      Presence.countDocuments({ lastSeen: { $gte: new Date(now - LIVE_MS) } }),
      PageView.countDocuments({ at: { $gte: today } }),
      PageView.distinct('sid', { at: { $gte: today } }).then((a) => a.length),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.aggregate([{ $group: { _id: outcome, count: { $sum: 1 }, amount: { $sum: '$total' } } }]),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Order.aggregate([
        { $match: { createdAt: { $gte: since14 } } },
        { $group: { _id: dayKey('$createdAt'), orders: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: [outcome, 'failed'] }, 0, '$total'] } } } },
      ]),
      PageView.aggregate([
        { $match: { at: { $gte: since14 } } },
        { $group: { _id: { d: dayKey('$at'), sid: '$sid' }, v: { $sum: 1 } } },
        { $group: { _id: '$_id.d', views: { $sum: '$v' }, visitors: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: since30 } } },
        { $addFields: { outcome } },
        { $match: { outcome: { $ne: 'failed' } } },
        { $unwind: '$items' },
        { $group: { _id: '$items.name', qty: { $sum: '$items.qty' }, revenue: { $sum: { $multiply: ['$items.qty', '$items.price'] } }, orders: { $addToSet: '$_id' }, product: { $first: '$items.product' }, image: { $max: '$items.image' } } },
        { $project: { qty: 1, revenue: 1, product: 1, image: 1, orders: { $size: '$orders' } } },
        { $sort: { qty: -1 } }, { $limit: 8 },
      ]),
      Order.find().sort('-createdAt').limit(8).populate('user', 'name email').lean(),
      ProductRequest.find().sort('-createdAt').limit(5).select('-photos').lean(),
      ProductRequest.countDocuments({ status: 'New' }),
      PageView.distinct('sid', { at: { $gte: new Date(now - 7 * DAY) } }).then((a) => a.length),
      Order.countDocuments({ createdAt: { $gte: new Date(now - 7 * DAY) } }),
    ])
    await withImages(recentOrders)
    await withImages([{ items: topProducts }])
    const o = Object.fromEntries(outcomes.map((x) => [x._id, x]))
    const successCount = o.success?.count || 0
    res.json({
      users, newUsers7, live, viewsToday, visitorsToday, ordersToday, openRequests,
      revenue: o.success?.amount || 0,
      pendingAmount: o.pending?.amount || 0,
      orders: { success: successCount, pending: o.pending?.count || 0, failed: o.failed?.count || 0 },
      avgOrderValue: successCount ? Math.round((o.success.amount || 0) / successCount) : 0,
      conversion7: visitors7 ? +((orders7 / visitors7) * 100).toFixed(1) : 0,
      statusBreakdown, topProducts, recentOrders, recentRequests,
      series: fillDays(14, [...orderSeries, ...trafficSeries].reduce((acc, r) => {
        const e = acc.find((x) => x._id === r._id); if (e) Object.assign(e, r); else acc.push({ ...r }); return acc
      }, []), ['views', 'visitors', 'orders', 'revenue']),
    })
  })
)

// Live visitors (polled every few seconds by the admin header)
router.get(
  '/live',
  asyncHandler(async (req, res) => {
    const sessions = await Presence.find({ lastSeen: { $gte: new Date(Date.now() - LIVE_MS) } })
      .sort('-lastSeen').limit(100).populate('user', 'name email').lean()
    res.json({ count: sessions.length, sessions })
  })
)

router.get(
  '/traffic',
  asyncHandler(async (req, res) => {
    const days = Math.min(90, Math.max(1, parseInt(req.query.days) || 7))
    const since = startOfDay(Date.now() - (days - 1) * DAY)
    const match = { $match: { at: { $gte: since } } }
    const [series, pages, refs, devices, totals, returning] = await Promise.all([
      PageView.aggregate([match, { $group: { _id: { d: dayKey('$at'), sid: '$sid' }, v: { $sum: 1 } } },
        { $group: { _id: '$_id.d', views: { $sum: '$v' }, visitors: { $sum: 1 } } }]),
      PageView.aggregate([match, { $group: { _id: '$path', views: { $sum: 1 }, sids: { $addToSet: '$sid' } } },
        { $project: { views: 1, visitors: { $size: '$sids' } } }, { $sort: { views: -1 } }, { $limit: 12 }]),
      PageView.aggregate([match, { $group: { _id: { $ifNull: [{ $cond: [{ $eq: ['$ref', ''] }, null, '$ref'] }, 'Direct / none'] }, views: { $sum: 1 } } }, { $sort: { views: -1 } }, { $limit: 8 }]),
      PageView.aggregate([match, { $group: { _id: '$device', views: { $sum: 1 } } }, { $sort: { views: -1 } }]),
      PageView.aggregate([match, { $group: { _id: null, views: { $sum: 1 }, sids: { $addToSet: '$sid' } } }, { $project: { views: 1, visitors: { $size: '$sids' } } }]),
      Presence.countDocuments({ lastSeen: { $gte: since }, firstSeen: { $lt: since } }),
    ])
    const t = totals[0] || { views: 0, visitors: 0 }
    res.json({
      days, views: t.views, visitors: t.visitors, returning,
      pagesPerVisitor: t.visitors ? +(t.views / t.visitors).toFixed(1) : 0,
      series: fillDays(days, series, ['views', 'visitors']), pages, refs, devices,
    })
  })
)

/* ---------------------------------- Users --------------------------------- */
const userStatsPipeline = [
  { $lookup: { from: 'orders', let: { u: '$_id' }, pipeline: [{ $match: { $expr: { $eq: ['$user', '$$u'] } } }, { $project: { total: 1, createdAt: 1, outcome } }], as: 'orders' } },
  { $lookup: { from: 'presences', localField: '_id', foreignField: 'user', as: 'presence' } },
  { $project: {
    name: 1, email: 1, phone: 1, role: 1, createdAt: 1, blocked: 1, blockedReason: 1, blockedAt: 1,
    provider: 1,
    // Small thumbnail for lists (falls back to the full photo for older uploads)
    avatar: { $ifNull: ['$avatarThumb', '$avatar'] },
    orderCount: { $size: '$orders' },
    spent: { $sum: { $map: { input: { $filter: { input: '$orders', cond: { $eq: ['$$this.outcome', 'success'] } } }, in: '$$this.total' } } },
    success: { $size: { $filter: { input: '$orders', cond: { $eq: ['$$this.outcome', 'success'] } } } },
    failed: { $size: { $filter: { input: '$orders', cond: { $eq: ['$$this.outcome', 'failed'] } } } },
    pending: { $size: { $filter: { input: '$orders', cond: { $eq: ['$$this.outcome', 'pending'] } } } },
    lastOrderAt: { $max: '$orders.createdAt' },
    lastSeen: { $max: '$presence.lastSeen' },
  } },
]

router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const q = String(req.query.q || '').trim().slice(0, 60)
    const rx = q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') : null
    const sortKey = { spent: { spent: -1 }, orders: { orderCount: -1 }, recent: { lastSeen: -1 }, new: { createdAt: -1 } }[req.query.sort] || { createdAt: -1 }
    const users = await User.aggregate([
      { $match: { role: 'user', ...(rx ? { $or: [{ name: rx }, { email: rx }, { phone: rx }] } : {}) } },
      ...userStatsPipeline,
      { $sort: sortKey }, { $limit: 300 },
    ])
    res.json({ users, liveWindowMs: LIVE_MS })
  })
)

router.get(
  '/users/:id',
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'User not found' })
    const _id = new mongoose.Types.ObjectId(req.params.id)
    const [stats] = await User.aggregate([{ $match: { _id } }, ...userStatsPipeline])
    if (!stats) return res.status(404).json({ message: 'User not found' })
    // Full-size photo and saved addresses for the customer page
    const extra = await User.findById(_id).select('avatar avatarSource addresses').lean()
    if (extra?.avatar) stats.avatar = extra.avatar
    stats.avatarSource = extra?.avatarSource || (extra?.avatar ? 'upload' : '')
    const addresses = (extra?.addresses || []).map((a) => ({
      id: String(a._id), label: a.label || '', name: a.name || '', phone: a.phone || '', line1: a.line1 || '', landmark: a.landmark || '',
      city: a.city || '', state: a.state || '', pincode: a.pincode || '', isDefault: !!a.isDefault,
    })).sort((x, y) => Number(y.isDefault) - Number(x.isDefault))
    const orders = await withImages(await Order.find({ user: _id }).sort('-createdAt').limit(100).lean())
    const phones = [...new Set([stats.phone, ...orders.map((o) => o.shippingAddress?.phone)].filter(Boolean))]
    const [requests, views, favourite] = await Promise.all([
      phones.length ? ProductRequest.find({ phone: { $in: phones } }).sort('-createdAt').limit(20).select('-photos').lean() : [],
      PageView.find({ user: _id }).sort('-at').limit(25).lean(),
      Order.aggregate([{ $match: { user: _id } }, { $unwind: '$items' }, { $group: { _id: '$items.name', qty: { $sum: '$items.qty' }, product: { $first: '$items.product' }, image: { $max: '$items.image' } } }, { $sort: { qty: -1 } }, { $limit: 5 }]).then(async (f) => { await withImages([{ items: f }]); return f }),
    ])
    res.json({
      user: { ...stats, addresses }, orders, requests, views, favourite,
      live: stats.lastSeen ? Date.now() - new Date(stats.lastSeen).getTime() < LIVE_MS : false,
      avgOrderValue: stats.success ? Math.round(stats.spent / stats.success) : 0,
    })
  })
)

// Block / unblock a customer. Blocked customers can browse but cannot order.
router.patch(
  '/users/:id/block',
  validate(z.object({ blocked: z.boolean(), reason: z.string().trim().max(200).optional() })),
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'User not found' })
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.role === 'admin') return res.status(400).json({ message: 'Admin accounts can’t be blocked' })
    user.blocked = req.body.blocked
    user.blockedReason = req.body.blocked ? req.body.reason || '' : undefined
    user.blockedAt = req.body.blocked ? new Date() : undefined
    await user.save()
    // Tell the customer in their notification bell (with sound)
    await Notification.create(req.body.blocked
      ? { audience: 'user', user: user._id, type: 'account', status: 'Blocked', title: 'Your account has been blocked', body: 'You can’t place orders right now. Please contact our support team on +91 7620377278 or care@animalveda.com to get unblocked and keep shopping with AnimalVeda.' }
      : { audience: 'user', user: user._id, type: 'account', status: 'Active', title: 'Welcome back! Your account is active again', body: 'You can shop with AnimalVeda again. Thank you for your patience. 🐾' }
    ).catch((e) => console.error('[notify] block:', e.message))
    res.json({ user: { _id: user._id, blocked: user.blocked, blockedReason: user.blockedReason, blockedAt: user.blockedAt } })
  })
)

/* --------------------------------- Orders --------------------------------- */
const ORDER_STATUSES = Order.schema.path('status').enumValues


router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const { status, method } = req.query
    const filter = {}
    if (status) filter.status = status
    if (method) filter['payment.method'] = method
    const orders = await Order.find(filter).sort('-createdAt').limit(500).populate('user', 'name email phone').lean()
    res.json(await withImages(orders))
  })
)

router.patch(
  '/orders/:id/verify-payment',
  validate(z.object({ action: z.enum(['approve', 'reject']) })),
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found' })
    const approved = req.body.action === 'approve'
    order.payment.status = approved ? 'paid' : 'rejected'
    order.payment.verifiedBy = req.user._id
    order.payment.verifiedAt = new Date()
    order.status = approved ? 'Confirmed' : 'Payment Rejected'
    order.statusHistory.push({ status: order.status, note: approved ? 'Payment verified' : 'Payment rejected' })
    await order.save()
    notifyStatus(order)
    res.json(order)
  })
)

router.patch(
  '/orders/:id/status',
  validate(z.object({ status: z.string(), note: z.string().optional() })),
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found' })
    if (!ORDER_STATUSES.includes(req.body.status)) return res.status(400).json({ message: 'Unknown status' })
    const changed = order.status !== req.body.status // compare BEFORE updating
    order.status = req.body.status
    // Delivering a COD order means the cash was collected
    if (req.body.status === 'Delivered' && order.payment.method === 'COD') order.payment.status = 'cod_collected'
    order.statusHistory.push({ status: req.body.status, note: req.body.note })
    await order.save()
    if (changed) notifyStatus(order, req.body.note)
    res.json(order)
  })
)

/* --------------------------------- Reviews --------------------------------- */
router.get('/reviews', asyncHandler(async (req, res) => {
  const status = ['pending', 'approved', 'rejected'].includes(req.query.status) ? req.query.status : undefined
  const [reviews, counts] = await Promise.all([
    Review.find(status ? { status } : {}).sort('-createdAt').limit(300).populate('user', 'name email').lean(),
    Review.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
  ])
  res.json({ reviews, counts: Object.fromEntries(counts.map((c) => [c._id, c.n])) })
}))
router.patch(
  '/reviews/:id',
  validate(z.object({ status: z.enum(['approved', 'rejected', 'pending']) })),
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Review not found' })
    const review = await Review.findById(req.params.id)
    if (!review) return res.status(404).json({ message: 'Review not found' })
    const was = review.status
    review.status = req.body.status
    review.moderatedAt = new Date()
    await review.save()
    if (was !== 'approved' && review.status === 'approved') {
      Notification.create({
        audience: 'user', user: review.user, type: 'review', status: 'approved', image: review.productImage, link: `/product/${review.productSlug}`,
        title: 'Your review is live! ⭐', body: `Thanks for reviewing ${review.productName}. Other pet parents can now read it.`,
      }).catch(() => {})
    }
    res.json({ review })
  })
)
router.delete('/reviews/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Review not found' })
  await Review.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
}))

/* ---------------------------------- Email ---------------------------------- */
const ADMIN_EMAIL = () => process.env.ADMIN_NOTIFY_EMAIL || 'gulhanev33@gmail.com'
router.get('/email-status', (req, res) => res.json({ provider: mailProvider(), adminEmail: ADMIN_EMAIL() }))
router.post(
  '/email-test',
  asyncHandler(async (req, res) => {
    if (!mailProvider()) return res.status(400).json({ message: 'Email isn’t set up on the server yet.' })
    const r = await sendMail({
      to: ADMIN_EMAIL(),
      subject: '✅ AnimalVeda test email: order emails are working',
      html: '<div style="font-family:Arial,sans-serif;font-size:15px;color:#1a3450"><h2 style="font-family:Georgia,serif">Order emails are working 🎉</h2><p>You will get an email like this for every new order, and customers will get one when they order and every time you change their order status.</p><p>AnimalVeda</p></div>',
      text: 'Order emails are working. You will get an email for every new order.',
    })
    if (r.error) return res.status(502).json({ message: r.error })
    res.json({ ok: true, to: ADMIN_EMAIL(), remaining: r.remaining })
  })
)

/* -------------------------------- Products -------------------------------- */
// Admin list: includes buying cost + courier charge (never sent to customers)
router.get(
  '/products',
  asyncHandler(async (req, res) => {
    const items = await Product.find({ isActive: { $ne: false } }).sort({ reviews: -1 }).limit(500).lean()
    res.json({ items: await withCosts(items) })
  })
)
router.post(
  '/products',
  asyncHandler(async (req, res) => {
    const { product, costs } = splitCosts(req.body)
    const p = await Product.create(product)
    await saveCosts(p._id, costs)
    res.status(201).json((await withCosts([p.toObject()]))[0])
  })
)
router.patch(
  '/products/:id',
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Product not found' })
    const { product, costs } = splitCosts(req.body)
    const p = await Product.findByIdAndUpdate(req.params.id, product, { new: true }).lean()
    if (!p) return res.status(404).json({ message: 'Product not found' })
    await saveCosts(p._id, costs)
    res.json((await withCosts([p]))[0])
  })
)

/* ------------------------------ Profit & loss ------------------------------ */
// Successful orders: what the customer paid minus what we paid (stock + courier).
// Returned orders: the courier was paid twice (there and back) for nothing, the
// stock comes back. Pending orders are shown separately until they complete.
const ymd = (t) => new Date(t).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
const istMidnight = (s) => new Date(`${s}T00:00:00+05:30`)
const addDays = (s, n) => ymd(istMidnight(s).getTime() + n * DAY + 6 * 60 * 60 * 1000)
const ISO = /^\d{4}-\d{2}-\d{2}$/
function plRange({ period = 'month', date, from, to }) {
  const today = ymd(Date.now())
  const d = ISO.test(date || '') ? date : today
  if (period === 'day') return { start: d, end: d, by: 'day' }
  if (period === 'week') return { start: addDays(d, -6), end: d, by: 'day' }
  if (period === 'year') return { start: `${d.slice(0, 4)}-01-01`, end: `${d.slice(0, 4)}-12-31`, by: 'month' }
  if (period === 'custom') {
    let a = ISO.test(from || '') ? from : d, b = ISO.test(to || '') ? to : a
    if (a > b) [a, b] = [b, a]
    if (istMidnight(b) - istMidnight(a) > 366 * DAY) a = addDays(b, -365)
    return { start: a, end: b, by: istMidnight(b) - istMidnight(a) > 92 * DAY ? 'month' : 'day' }
  }
  const [y, m] = d.split('-').map(Number)
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return { start: `${d.slice(0, 7)}-01`, end: `${d.slice(0, 7)}-${String(last).padStart(2, '0')}`, by: 'day' }
}
const plOutcome = (o) => {
  if (o.status === 'Returned') return 'returned'
  if (['Cancelled', 'Payment Rejected'].includes(o.status) || o.payment?.status === 'rejected') return 'cancelled'
  if (['paid', 'cod_collected'].includes(o.payment?.status) || o.status === 'Delivered') return 'success'
  return 'pending'
}
const blank = () => ({ sales: 0, fees: 0, goodsCost: 0, courierCost: 0, gross: 0, returnsLoss: 0, net: 0, orders: 0, returns: 0 })

router.get(
  '/profit',
  asyncHandler(async (req, res) => {
    const r = plRange(req.query)
    const since = istMidnight(r.start), until = new Date(istMidnight(r.end).getTime() + DAY)
    const orders = await Order.find({ createdAt: { $gte: since, $lt: until } })
      .select('orderNo createdAt status payment.status subtotal discount shippingFee codFee total items customerName shippingAddress.name')
      .sort('-createdAt').lean()
    // Cost snapshots taken at checkout; older orders fall back to today's costs
    const snaps = new Map((await OrderCost.find({ order: { $in: orders.map((o) => o._id) } }).lean()).map((c) => [String(c.order), c]))
    const need = orders.filter((o) => !snaps.has(String(o._id)))
    const map = need.length ? await costMap(need.flatMap((o) => o.items.map((i) => i.product))) : new Map()

    const totals = blank()
    const pending = { orders: 0, value: 0 }
    const cancelled = { orders: 0 }
    const buckets = new Map()
    const products = new Map()
    const returnsList = []
    let missingOrders = 0, estimated = 0
    // Every day/month in range, so the chart has no gaps
    if (r.by === 'month') {
      for (let y = +r.start.slice(0, 4), m = +r.start.slice(5, 7); `${y}-${String(m).padStart(2, '0')}` <= r.end.slice(0, 7); m === 12 ? (y++, m = 1) : m++)
        buckets.set(`${y}-${String(m).padStart(2, '0')}`, blank())
    } else {
      for (let k = r.start; k <= r.end; k = addDays(k, 1)) buckets.set(k, blank())
    }
    const lineCost = (c, it) => c?.lines?.find((l) => l.sku === it.variantSku && String(l.product) === String(it.product))

    for (const o of orders) {
      const kind = plOutcome(o)
      if (kind === 'cancelled') { cancelled.orders++; continue }
      if (kind === 'pending') { pending.orders++; pending.value += o.total || 0; continue }
      let c = snaps.get(String(o._id))
      if (!c) { c = costOfItems(o.items, map); estimated++ }
      if (c.missing) missingOrders++
      const key = r.by === 'month' ? ymd(o.createdAt).slice(0, 7) : ymd(o.createdAt)
      const b = buckets.get(key) || blank()
      for (const t of [totals, b]) {
        if (kind === 'success') {
          t.orders++
          t.sales += (o.subtotal || 0) - (o.discount || 0) // after coupon discounts
          t.fees += (o.shippingFee || 0) + (o.codFee || 0)
          t.goodsCost += c.goodsCost || 0
          t.courierCost += c.courierCost || 0
        } else {
          t.returns++
          t.returnsLoss += 2 * (c.courierCost || 0)
        }
      }
      buckets.set(key, b)
      for (const it of o.items) {
        const lc = lineCost(c, it) || { costPrice: 0, courierCharge: 0 }
        const p = products.get(it.name) || { name: it.name, product: it.product, image: it.image, qty: 0, sales: 0, goodsCost: 0, courierCost: 0, returned: 0, returnsLoss: 0 }
        if (kind === 'success') {
          p.qty += it.qty; p.sales += it.price * it.qty
          p.goodsCost += (lc.costPrice || 0) * it.qty; p.courierCost += (lc.courierCharge || 0) * it.qty
        } else {
          p.returned += it.qty; p.returnsLoss += 2 * (lc.courierCharge || 0) * it.qty
        }
        products.set(it.name, p)
      }
      if (kind === 'returned') returnsList.push({ orderNo: o.orderNo, createdAt: o.createdAt, customer: o.customerName || o.shippingAddress?.name || '', total: o.total, loss: 2 * (c.courierCost || 0), items: o.items.map((i) => `${i.name} × ${i.qty}`).join(', ') })
    }
    const finish = (t) => { t.gross = t.sales + t.fees - t.goodsCost - t.courierCost; t.net = t.gross - t.returnsLoss; return t }
    finish(totals)
    const productRows = [...products.values()].map((p) => ({ ...p, profit: p.sales - p.goodsCost - p.courierCost - p.returnsLoss }))
      .sort((a, b) => a.profit - b.profit)
    await withImages([{ items: productRows }])
    res.json({
      period: req.query.period || 'month', start: r.start, end: r.end, by: r.by,
      totals, pending, cancelled,
      margin: totals.sales + totals.fees ? +((totals.net / (totals.sales + totals.fees)) * 100).toFixed(1) : 0,
      series: [...buckets.entries()].map(([date, b]) => ({ date, ...finish(b) })),
      products: productRows, returns: returnsList.slice(0, 100),
      missingOrders, estimated,
    })
  })
)
router.delete(
  '/products/:id',
  asyncHandler(async (req, res) => {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false })
    res.json({ message: 'Product deactivated' })
  })
)

/* ------------------------------- Categories ------------------------------- */
router.post('/categories', asyncHandler(async (req, res) => res.status(201).json(await Category.create(req.body))))

/* -------------------------------- Settings -------------------------------- */
router.get('/settings', asyncHandler(async (req, res) => res.json(await Settings.findOne({ key: 'global' }))))
router.patch(
  '/settings',
  asyncHandler(async (req, res) => {
    const s = await Settings.findOneAndUpdate({ key: 'global' }, req.body, { new: true, upsert: true })
    res.json(s)
  })
)


/* ---------------------------- Product requests ---------------------------- */
router.get(
  '/requests',
  asyncHandler(async (req, res) => {
    const filter = req.query.status ? { status: req.query.status } : {}
    const requests = await ProductRequest.find(filter).sort({ createdAt: -1 }).limit(200).lean()
    res.json({ requests })
  })
)

router.patch(
  '/requests/:id',
  validate(z.object({ status: z.enum(['New', 'Contacted', 'Sourcing', 'Quoted', 'Fulfilled', 'Unavailable']) })),
  asyncHandler(async (req, res) => {
    const doc = await ProductRequest.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })
    if (!doc) return res.status(404).json({ message: 'Request not found' })
    res.json({ request: doc })
  })
)

export default router
