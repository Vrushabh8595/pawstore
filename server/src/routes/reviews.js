import { Router } from 'express'
import { z } from 'zod'
import { Review, Product, Order, Notification } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler, validate } from '../middleware/error.js'
import { reviewLimiter } from '../middleware/security.js'

// Product reviews. Public: approved reviews + rating summaries.
// Customers (logged in): write / update their own review (goes back to "pending").
const router = Router()
const slugRx = /^[a-z0-9-]{1,120}$/

async function summaryFor(match) {
  const rows = await Review.aggregate([
    { $match: { status: 'approved', ...match } },
    { $group: { _id: '$productSlug', avg: { $avg: '$rating' }, count: { $sum: 1 }, s1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } }, s2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } }, s3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } }, s4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } }, s5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } } } },
  ])
  return Object.fromEntries(rows.map((r) => [r._id, { avg: Math.round(r.avg * 10) / 10, count: r.count, breakdown: { 1: r.s1, 2: r.s2, 3: r.s3, 4: r.s4, 5: r.s5 } }]))
}

// GET /reviews/summary → { slug: { avg, count, breakdown } } for every reviewed product (used on product cards)
router.get('/summary', asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'public, max-age=60')
  res.json(await summaryFor({}))
}))

// GET /reviews/product/:slug → approved reviews + summary
router.get('/product/:slug', asyncHandler(async (req, res) => {
  const slug = String(req.params.slug)
  if (!slugRx.test(slug)) return res.status(400).json({ message: 'Invalid product' })
  const [reviews, summary] = await Promise.all([
    Review.find({ productSlug: slug, status: 'approved' }).sort('-createdAt').limit(100)
      .select('name rating title comment verifiedPurchase createdAt').lean(),
    summaryFor({ productSlug: slug }),
  ])
  res.json({ reviews, summary: summary[slug] || { avg: 0, count: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } } })
}))

// GET /reviews/mine → all of the signed-in customer's reviews (for "My reviews" in the account)
router.get('/mine', authenticate, asyncHandler(async (req, res) => {
  res.json({ reviews: await Review.find({ user: req.user._id }).sort('-updatedAt').limit(200).select('productSlug productName productImage rating title comment status updatedAt').lean() })
}))

// GET /reviews/mine/:slug → the signed-in customer's own review (any status)
router.get('/mine/:slug', authenticate, asyncHandler(async (req, res) => {
  const slug = String(req.params.slug)
  if (!slugRx.test(slug)) return res.status(400).json({ message: 'Invalid product' })
  res.json({ review: await Review.findOne({ user: req.user._id, productSlug: slug }).select('rating title comment status createdAt').lean() })
}))

const plain = (max) => z.string().trim().max(max).transform((v) => v.replace(/[<>]/g, '')) // no HTML in reviews

// POST /reviews → create or update my review for a product (needs approval again)
router.post(
  '/',
  authenticate,
  reviewLimiter,
  validate(z.object({
    slug: z.string().regex(slugRx),
    rating: z.number().int().min(1).max(5),
    title: plain(80).optional().default(''),
    comment: plain(1000).refine((v) => v.length >= 10, 'Please write at least 10 characters'),
  })),
  asyncHandler(async (req, res) => {
    if (req.user.role === 'admin') return res.status(403).json({ message: 'Admins can’t post reviews' })
    if (req.user.blocked) return res.status(403).json({ message: 'Your account is blocked. Please contact support.' })
    const { slug, rating, title, comment } = req.body
    const product = await Product.findOne({ slug }).select('_id name images').lean()
    if (!product) return res.status(404).json({ message: 'Product not found' })
    const verifiedPurchase = !!(await Order.exists({ user: req.user._id, status: 'Delivered', $or: [{ 'items.product': product._id }, { 'items.slug': slug }] }))
    const review = await Review.findOneAndUpdate(
      { user: req.user._id, productSlug: slug },
      { $set: { product: product._id, productName: product.name, productImage: product.images?.[0], name: req.user.name, rating, title, comment, verifiedPurchase, status: 'pending', moderatedAt: null } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    Notification.create({
      audience: 'admin', type: 'review', image: product.images?.[0], link: '/admin/reviews', status: 'pending',
      title: `New ${rating}★ review to approve`, body: `${req.user.name} on ${product.name}: “${comment.slice(0, 90)}${comment.length > 90 ? '…' : ''}”`,
    }).catch(() => {})
    res.status(201).json({ review: { rating: review.rating, title: review.title, comment: review.comment, status: review.status } })
  })
)

export default router
