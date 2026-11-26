import { Router } from 'express'
import { z } from 'zod'
import mongoose from 'mongoose'
import { Product, Category, Order, Settings, ProductRequest, User, PageView, Presence } from '../models/index.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { asyncHandler, validate } from '../middleware/error.js'
import { notifyStatus } from '../utils/notify.js'
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
    name: 1, email: 1, phone: 1, role: 1, createdAt: 1,
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
    const orders = await withImages(await Order.find({ user: _id }).sort('-createdAt').limit(100).lean())
    const phones = [...new Set([stats.phone, ...orders.map((o) => o.shippingAddress?.phone)].filter(Boolean))]
    const [requests, views, favourite] = await Promise.all([
      phones.length ? ProductRequest.find({ phone: { $in: phones } }).sort('-createdAt').limit(20).select('-photos').lean() : [],
      PageView.find({ user: _id }).sort('-at').limit(25).lean(),
      Order.aggregate([{ $match: { user: _id } }, { $unwind: '$items' }, { $group: { _id: '$items.name', qty: { $sum: '$items.qty' }, product: { $first: '$items.product' }, image: { $max: '$items.image' } } }, { $sort: { qty: -1 } }, { $limit: 5 }]).then(async (f) => { await withImages([{ items: f }]); return f }),
    ])
    res.json({
      user: stats, orders, requests, views, favourite,
      live: stats.lastSeen ? Date.now() - new Date(stats.lastSeen).getTime() < LIVE_MS : false,
      avgOrderValue: stats.success ? Math.round(stats.spent / stats.success) : 0,
    })
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
    order.status = req.body.status
    // Delivering a COD order means the cash was collected
    if (req.body.status === 'Delivered' && order.payment.method === 'COD') order.payment.status = 'cod_collected'
    const changed = order.status !== req.body.status
    order.statusHistory.push({ status: req.body.status, note: req.body.note })
    await order.save()
    if (changed) notifyStatus(order, req.body.note)
    res.json(order)
  })
)

/* -------------------------------- Products -------------------------------- */
router.post('/products', asyncHandler(async (req, res) => res.status(201).json(await Product.create(req.body))))
router.patch(
  '/products/:id',
  asyncHandler(async (req, res) => {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!p) return res.status(404).json({ message: 'Product not found' })
    res.json(p)
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
