import { Router } from 'express'
import mongoose from 'mongoose'
import { BlogPost, BlogImage, User } from '../models/index.js'
import { asyncHandler } from '../middleware/error.js'
import { BLOG_CATEGORIES, CARD, authorPublic } from '../utils/blog.js'

// Public blog API: only ever returns posts the admin has published.
const router = Router()
const PUBLISHED = { status: 'published' }
const PER_PAGE = 9
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

router.get('/categories', (req, res) => res.json(BLOG_CATEGORIES.map(([slug, name]) => ({ slug, name }))))

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.min(200, Math.max(1, parseInt(req.query.page) || 1))
    const filter = { ...PUBLISHED }
    const cat = String(req.query.category || '')
    if (cat) filter.category = cat
    const tag = String(req.query.tag || '').toLowerCase().slice(0, 30)
    if (tag) filter.tags = tag
    let author = null
    if (req.query.author) {
      author = await User.findOne({ authorSlug: String(req.query.author).slice(0, 90), role: { $in: ['author', 'admin'] } }).select('name authorSlug bio avatar').lean()
      if (!author) return res.status(404).json({ message: 'Author not found' })
      filter.author = author._id
    }
    const q = String(req.query.q || '').trim().slice(0, 60)
    if (q) filter.$or = [{ title: new RegExp(esc(q), 'i') }, { excerpt: new RegExp(esc(q), 'i') }]
    const [items, total, counts] = await Promise.all([
      BlogPost.find(filter).select(CARD).sort({ publishedAt: -1 }).skip((page - 1) * PER_PAGE).limit(PER_PAGE).lean(),
      BlogPost.countDocuments(filter),
      BlogPost.aggregate([{ $match: PUBLISHED }, { $group: { _id: '$category', n: { $sum: 1 } } }]),
    ])
    res.set('Cache-Control', 'public, max-age=60')
    res.json({
      items: items.map(card), total, page, pages: Math.max(1, Math.ceil(total / PER_PAGE)),
      categories: BLOG_CATEGORIES.map(([slug, name]) => ({ slug, name, count: counts.find((c) => c._id === slug)?.n || 0 })),
      author: author ? authorPublic(author) : null,
    })
  })
)

// For the sitemap (served by the website)
router.get(
  '/sitemap',
  asyncHandler(async (req, res) => {
    const [posts, authors] = await Promise.all([
      BlogPost.find(PUBLISHED).select('slug updatedAt publishedAt category').sort({ publishedAt: -1 }).limit(5000).lean(),
      BlogPost.distinct('author', PUBLISHED).then((ids) => User.find({ _id: { $in: ids }, authorSlug: { $exists: true } }).select('authorSlug').lean()),
    ])
    res.set('Cache-Control', 'public, max-age=300')
    res.json({ posts: posts.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt, category: p.category })), authors: authors.map((a) => a.authorSlug) })
  })
)

router.get(
  '/post/:slug',
  asyncHandler(async (req, res) => {
    const post = await BlogPost.findOne({ ...PUBLISHED, slug: String(req.params.slug).slice(0, 90) }).select('-reviewNote -reviewedBy -submittedAt').lean()
    if (!post) return res.status(404).json({ message: 'Post not found' })
    const [author, related] = await Promise.all([
      post.author ? User.findById(post.author).select('name authorSlug bio avatar').lean() : null,
      BlogPost.find({ ...PUBLISHED, _id: { $ne: post._id }, category: post.category }).select(CARD).sort({ publishedAt: -1 }).limit(3).lean(),
    ])
    BlogPost.updateOne({ _id: post._id }, { $inc: { views: 1 } }).catch(() => {})
    res.set('Cache-Control', 'public, max-age=60')
    res.json({ post: { ...card(post), content: post.content, metaTitle: post.metaTitle, metaDescription: post.metaDescription }, author: authorPublic(author) || { name: post.authorName || 'AnimalVeda' }, related: related.map(card) })
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

function card(p) {
  return {
    id: String(p._id), title: p.title, slug: p.slug, excerpt: p.excerpt, cover: p.cover, coverAlt: p.coverAlt || p.title,
    category: p.category, categoryName: BLOG_CATEGORIES.find(([s]) => s === p.category)?.[1] || '', tags: p.tags || [],
    authorName: p.authorName, publishedAt: p.publishedAt, updatedAt: p.updatedAt, readMinutes: p.readMinutes || 1,
  }
}

export default router
