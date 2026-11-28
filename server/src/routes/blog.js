import { Router } from 'express'
import mongoose from 'mongoose'
import { BlogPost, BlogImage } from '../models/index.js'
import { asyncHandler } from '../middleware/error.js'
import { getCategories } from '../utils/blog.js'

// Public blog API: only ever returns posts the admin has published.
// Author details are never shown publicly.
const router = Router()
const PUBLISHED = { status: 'published' }
const PER_PAGE = 9
// Public card fields (no author, review or internal fields)
const PUBLIC = 'title slug excerpt cover coverAlt category tags publishedAt readMinutes updatedAt'
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

router.get('/categories', asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'public, max-age=60')
  res.json((await getCategories()).map(({ slug, name }) => ({ slug, name })))
}))

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.min(200, Math.max(1, parseInt(req.query.page) || 1))
    const filter = { ...PUBLISHED }
    const cat = String(req.query.category || '')
    if (cat) filter.category = cat
    const tag = String(req.query.tag || '').toLowerCase().slice(0, 30)
    if (tag) filter.tags = tag
    const q = String(req.query.q || '').trim().slice(0, 60)
    if (q) filter.$or = [{ title: new RegExp(esc(q), 'i') }, { excerpt: new RegExp(esc(q), 'i') }]
    const [cats, items, total, counts] = await Promise.all([
      getCategories(),
      BlogPost.find(filter).select(PUBLIC).sort({ publishedAt: -1 }).skip((page - 1) * PER_PAGE).limit(PER_PAGE).lean(),
      BlogPost.countDocuments(filter),
      BlogPost.aggregate([{ $match: PUBLISHED }, { $group: { _id: '$category', n: { $sum: 1 } } }]),
    ])
    res.set('Cache-Control', 'public, max-age=60')
    res.json({
      items: items.map((p) => card(p, cats)), total, page, pages: Math.max(1, Math.ceil(total / PER_PAGE)),
      categories: cats.map(({ slug, name }) => ({ slug, name, count: counts.find((c) => c._id === slug)?.n || 0 })),
    })
  })
)

// For the sitemap (served by the website)
router.get(
  '/sitemap',
  asyncHandler(async (req, res) => {
    const posts = await BlogPost.find(PUBLISHED).select('slug updatedAt publishedAt category').sort({ publishedAt: -1 }).limit(5000).lean()
    res.set('Cache-Control', 'public, max-age=300')
    res.json({ posts: posts.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt, category: p.category })) })
  })
)

router.get(
  '/post/:slug',
  asyncHandler(async (req, res) => {
    const post = await BlogPost.findOne({ ...PUBLISHED, slug: String(req.params.slug).slice(0, 90) }).select(`${PUBLIC} content metaTitle metaDescription`).lean()
    if (!post) return res.status(404).json({ message: 'Post not found' })
    const [cats, related] = await Promise.all([
      getCategories(),
      BlogPost.find({ ...PUBLISHED, _id: { $ne: post._id }, category: post.category }).select(PUBLIC).sort({ publishedAt: -1 }).limit(3).lean(),
    ])
    BlogPost.updateOne({ _id: post._id }, { $inc: { views: 1 } }).catch(() => {})
    res.set('Cache-Control', 'public, max-age=60')
    res.json({ post: { ...card(post, cats), content: post.content, metaTitle: post.metaTitle, metaDescription: post.metaDescription }, related: related.map((p) => card(p, cats)) })
  })
)

router.get(
  '/images/:id',
  asyncHandler(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).end()
    const img = await BlogImage.findById(req.params.id).lean()
    if (!img) return res.status(404).end()
    res.set({
      'Content-Type': img.type,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Cross-Origin-Resource-Policy': 'cross-origin', // shown on the website's own domain
      'X-Content-Type-Options': 'nosniff',
    })
    res.send(Buffer.from(img.data.buffer || img.data))
  })
)

function card(p, cats) {
  return {
    id: String(p._id), title: p.title, slug: p.slug, excerpt: p.excerpt, cover: p.cover, coverAlt: p.coverAlt || p.title,
    category: p.category, categoryName: cats.find((c) => c.slug === p.category)?.name || '', tags: p.tags || [],
    publishedAt: p.publishedAt, updatedAt: p.updatedAt, readMinutes: p.readMinutes || 1,
  }
}

export default router
