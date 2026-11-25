import { Router } from 'express'
import { z } from 'zod'
import { Product, Category, Order, Settings } from '../models/index.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { asyncHandler, validate } from '../middleware/error.js'

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

/* --------------------------------- Orders --------------------------------- */
router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const { status, method } = req.query
    const filter = {}
    if (status) filter.status = status
    if (method) filter['payment.method'] = method
    res.json(await Order.find(filter).sort('-createdAt').populate('user', 'name email'))
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
    res.json(order)
  })
)

router.patch(
  '/orders/:id/status',
  validate(z.object({ status: z.string(), note: z.string().optional() })),
  asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.id)
    if (!order) return res.status(404).json({ message: 'Order not found' })
    order.status = req.body.status
    order.statusHistory.push({ status: req.body.status, note: req.body.note })
    await order.save()
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

export default router
