import { Router } from 'express'
import { z } from 'zod'
import { Product, Order, Settings } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler, validate } from '../middleware/error.js'
import { withImages } from '../utils/orderImages.js'
import { claimLimiter } from '../middleware/security.js'
import { recordOrderCost } from '../utils/costs.js'

const router = Router()
router.use(authenticate)

const genOrderNo = () => 'ORD' + Date.now().toString().slice(-7) + Math.floor(Math.random() * 90 + 10)

const createSchema = z.object({
  items: z.array(z.object({ product: z.string(), variantSku: z.string(), qty: z.number().int().min(1).max(7) })).min(1),
  shippingAddress: z.object({
    name: z.string().min(2),
    phone: z.string().regex(/^\d{10}$/),
    line1: z.string().min(3),
    city: z.string().min(2),
    state: z.string().optional(),
    pincode: z.string().regex(/^\d{6}$/),
  }),
  paymentMethod: z.enum(['UPI_MANUAL', 'COD']),
  utr: z.string().regex(/^\d{12}$/).optional(),
})

// POST /orders — totals are recalculated server-side from the DB (never trust the client).
router.post(
  '/',
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { items, shippingAddress, paymentMethod, utr } = req.body
    const settings = (await Settings.findOne({ key: 'global' })) || {}
    const shippingFeeBase = settings.shippingFee ?? 59
    const freeShipAbove = settings.freeShipAbove ?? 999
    const codFeeBase = settings.codFee ?? 49

    if (paymentMethod === 'UPI_MANUAL') {
      if (!utr) return res.status(400).json({ message: 'UTR is required for UPI payment' })
      if (await Order.findOne({ 'payment.utr': utr }))
        return res.status(409).json({ message: 'This UTR has already been used' })
    }

    // Max 7 units of the same product per order (any sizes combined)
    const MAX_PER_PRODUCT = 7
    const perProduct = {}
    for (const it of items) perProduct[it.product] = (perProduct[it.product] || 0) + it.qty
    if (Object.values(perProduct).some((n) => n > MAX_PER_PRODUCT))
      return res.status(400).json({ message: `You can order at most ${MAX_PER_PRODUCT} of the same product per order. Place this order first, then order again.` })

    // Build line items + decrement stock atomically (conditional $inc prevents overselling).
    const lineItems = []
    let subtotal = 0
    for (const it of items) {
      const product = await Product.findOne({ _id: it.product, 'variants.sku': it.variantSku })
      if (!product) return res.status(400).json({ message: 'Product/variant not found' })
      const variant = product.variants.find((v) => v.sku === it.variantSku)
      const dec = await Product.updateOne(
        { _id: product._id, 'variants.sku': it.variantSku, 'variants.stock': { $gte: it.qty } },
        { $inc: { 'variants.$.stock': -it.qty } }
      )
      if (dec.modifiedCount === 0) return res.status(409).json({ message: `Not enough stock for ${product.name}` })
      subtotal += variant.price * it.qty
      lineItems.push({ product: product._id, name: product.name, variantSku: variant.sku, size: variant.size, price: variant.price, qty: it.qty })
    }

    const shippingFee = subtotal >= freeShipAbove ? 0 : shippingFeeBase
    const codFee = paymentMethod === 'COD' ? codFeeBase : 0
    const total = subtotal + shippingFee + codFee

    const order = await Order.create({
      orderNo: genOrderNo(),
      user: req.user._id,
      items: lineItems,
      shippingAddress,
      subtotal,
      shippingFee,
      codFee,
      total,
      payment: {
        method: paymentMethod,
        status: paymentMethod === 'UPI_MANUAL' ? 'pending_verification' : 'cod_pending',
        utr,
      },
      status: 'Pending Verification',
      statusHistory: [{ status: 'Pending Verification' }],
    })
    recordOrderCost(order) // admin-only cost snapshot for profit & loss
    res.status(201).json(order)
  })
)

router.get('/my', asyncHandler(async (req, res) => res.json(await withImages(await Order.find({ user: req.user._id }).sort('-createdAt').lean()))))
// Link guest orders to the signed-in account. The customer proves ownership
// with the order number + the delivery phone number from their own receipt.
router.post(
  '/claim',
  claimLimiter,
  validate(z.object({ orders: z.array(z.object({ orderNo: z.string().max(40), phone: z.string().regex(/^\d{10}$/) })).min(1).max(30) })),
  asyncHandler(async (req, res) => {
    let linked = 0
    for (const { orderNo, phone } of req.body.orders) {
      const r = await Order.updateOne(
        { orderNo, user: { $exists: false }, 'shippingAddress.phone': phone },
        { $set: { user: req.user._id } }
      )
      const r2 = r.modifiedCount ? r : await Order.updateOne({ orderNo, user: null, 'shippingAddress.phone': phone }, { $set: { user: req.user._id } })
      linked += r2.modifiedCount
    }
    res.json({ linked })
  })
)

// A customer's own order by its order number (used by the account pages)
router.get(
  '/no/:orderNo',
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ orderNo: req.params.orderNo, user: req.user._id }).lean()
    if (!order) return res.status(404).json({ message: 'Order not found' })
    res.json((await withImages([order]))[0])
  })
)

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
    if (!order) return res.status(404).json({ message: 'Order not found' })
    res.json(order)
  })
)

// Attach a payment screenshot / UTR to an existing order.
router.post(
  '/:id/payment-proof',
  validate(z.object({ utr: z.string().regex(/^\d{12}$/).optional(), screenshotUrl: z.string().url().max(500).regex(/^https:\/\//, 'Must be an https link').optional() })),
  asyncHandler(async (req, res) => {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { 'payment.utr': req.body.utr, 'payment.screenshotUrl': req.body.screenshotUrl, 'payment.status': 'pending_verification' },
      { new: true }
    )
    if (!order) return res.status(404).json({ message: 'Order not found' })
    res.json(order)
  })
)

export default router
