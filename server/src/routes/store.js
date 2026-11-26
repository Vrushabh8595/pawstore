import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { Product, Order, Settings, PageView, Presence } from '../models/index.js'
import { optionalAuth } from '../middleware/optionalAuth.js'
import { asyncHandler, validate } from '../middleware/error.js'

// Public storefront endpoints: checkout (guest or logged in) + visitor tracking.
const router = Router()
router.use(optionalAuth)

const MAX_PER_PRODUCT = 7
const genOrderNo = () => 'AV' + Date.now().toString().slice(-7) + Math.floor(Math.random() * 90 + 10)

/* -------------------------------- Checkout -------------------------------- */
const orderLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false })
const orderSchema = z.object({
  items: z.array(z.object({ slug: z.string().max(160), sku: z.string().max(60), qty: z.number().int().min(1).max(MAX_PER_PRODUCT) })).min(1).max(40),
  address: z.object({
    name: z.string().trim().min(2).max(80),
    phone: z.string().regex(/^\d{10}$/),
    line1: z.string().trim().min(3).max(240),
    city: z.string().trim().min(2).max(80),
    state: z.string().trim().max(80).optional().default(''),
    pincode: z.string().regex(/^\d{6}$/),
  }),
  paymentMethod: z.enum(['UPI_MANUAL', 'COD']),
  utr: z.string().regex(/^\d{12}$/).optional(),
  email: z.string().email().max(120).optional(),
})

router.post(
  '/orders',
  orderLimiter,
  validate(orderSchema),
  asyncHandler(async (req, res) => {
    const { items, address, paymentMethod, utr, email } = req.body
    if (paymentMethod === 'UPI_MANUAL') {
      if (!utr) return res.status(400).json({ message: 'Enter the 12-digit UPI reference (UTR).' })
      if (await Order.exists({ 'payment.utr': utr })) return res.status(409).json({ message: 'This UPI reference has already been used.' })
    }
    const perProduct = {}
    for (const it of items) perProduct[it.slug] = (perProduct[it.slug] || 0) + it.qty
    if (Object.values(perProduct).some((n) => n > MAX_PER_PRODUCT))
      return res.status(400).json({ message: `You can order at most ${MAX_PER_PRODUCT} of the same product per order.` })

    const settings = (await Settings.findOne({ key: 'global' })) || {}
    // Prices always come from the database, never from the client.
    const lines = []
    let subtotal = 0
    for (const it of items) {
      const product = await Product.findOne({ slug: it.slug, isActive: { $ne: false } })
      const variant = product?.variants.find((v) => v.sku === it.sku)
      if (!product || !variant) return res.status(400).json({ message: 'A product in your cart is no longer available. Please refresh your cart.' })
      const dec = await Product.updateOne(
        { _id: product._id, variants: { $elemMatch: { sku: it.sku, stock: { $gte: it.qty } } } },
        { $inc: { 'variants.$.stock': -it.qty } }
      )
      if (dec.modifiedCount === 0) return res.status(409).json({ message: `Sorry, ${product.name} (${variant.size}) just went out of stock.` })
      subtotal += variant.price * it.qty
      lines.push({ product: product._id, name: product.name, variantSku: variant.sku, size: variant.size, price: variant.price, qty: it.qty })
    }
    const shippingFee = subtotal >= (settings.freeShipAbove ?? 999) ? 0 : (settings.shippingFee ?? 59)
    const codFee = paymentMethod === 'COD' ? (settings.codFee ?? 49) : 0
    const order = await Order.create({
      orderNo: genOrderNo(),
      user: req.user?._id,
      guestEmail: req.user ? undefined : email,
      customerName: address.name,
      items: lines,
      shippingAddress: address,
      subtotal, shippingFee, codFee, total: subtotal + shippingFee + codFee,
      payment: { method: paymentMethod, status: paymentMethod === 'UPI_MANUAL' ? 'pending_verification' : 'cod_pending', utr },
      status: 'Pending Verification',
      statusHistory: [{ status: 'Pending Verification' }],
    })
    res.status(201).json({ order })
  })
)

/* --------------------------------- Tracking -------------------------------- */
const trackLimiter = rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false })
const trackSchema = z.object({
  sid: z.string().regex(/^[a-z0-9-]{8,64}$/i),
  type: z.enum(['view', 'ping']),
  path: z.string().max(200).optional().default('/'),
  ref: z.string().max(300).optional().default(''),
})
const deviceOf = (ua = '') => (/ipad|tablet/i.test(ua) ? 'tablet' : /mobi|android|iphone/i.test(ua) ? 'mobile' : 'desktop')
const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview/i

router.post(
  '/track',
  trackLimiter,
  validate(trackSchema),
  asyncHandler(async (req, res) => {
    const ua = req.get('user-agent') || ''
    if (BOT.test(ua)) return res.status(204).end()
    const { sid, type, ref } = req.body
    const path = req.body.path.split('?')[0].slice(0, 200)
    if (path.startsWith('/admin')) return res.status(204).end() // don't count admin browsing
    const device = deviceOf(ua)
    let refHost = ''
    try { refHost = ref ? new URL(ref).hostname.replace(/^www\./, '') : '' } catch { /* ignore */ }
    const set = { lastSeen: new Date(), path, device, ...(req.user ? { user: req.user._id } : {}) }
    await Presence.updateOne({ sid }, { $set: set, $setOnInsert: { firstSeen: new Date() }, ...(type === 'view' ? { $inc: { views: 1 } } : {}) }, { upsert: true })
    if (type === 'view') await PageView.create({ sid, path, device, ref: refHost, user: req.user?._id })
    res.status(204).end()
  })
)

export default router
