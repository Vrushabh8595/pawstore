import { Router } from 'express'
import mongoose from 'mongoose'
import { z } from 'zod'
import { BlogPost, Notification } from '../models/index.js'
import { authenticate, requireAuthor } from '../middleware/auth.js'
import { asyncHandler, validate } from '../middleware/error.js'
import { postSchema, readyErrors, applyFields, uniqueSlug, CARD, saveImage, ensureAuthorSlug } from '../utils/blog.js'
import { blogWriteLimiter, blogImageLimiter } from '../middleware/security.js'

// Author dashboard API. Authors only see and change their own posts, and can
// never publish: submitting sends the post to the admin for approval.
const router = Router()
router.use(authenticate, requireAuthor)

const mine = (req, id) => (mongoose.isValidObjectId(id) ? BlogPost.findOne({ _id: id, author: req.user._id }) : null)
const EDITABLE = ['draft', 'pending', 'rejected']

router.get('/me', asyncHandler(async (req, res) => {
  await ensureAuthorSlug(req.user)
  res.json({ name: req.user.name, email: req.user.email, bio: req.user.bio || '', slug: req.user.authorSlug, avatar: req.user.avatar || '' })
}))
router.patch('/me', validate(z.object({ bio: z.string().trim().max(300) }).strict()), asyncHandler(async (req, res) => {
  req.user.bio = req.body.bio
  await req.user.save()
  res.json({ bio: req.user.bio })
}))

router.get('/posts', asyncHandler(async (req, res) => {
  const posts = await BlogPost.find({ author: req.user._id }).select(CARD).sort({ updatedAt: -1 }).limit(500).lean()
  res.json({ posts })
}))
router.get('/posts/:id', asyncHandler(async (req, res) => {
  const post = await mine(req, req.params.id)?.lean()
  if (!post) return res.status(404).json({ message: 'Post not found' })
  res.json({ post })
}))

async function notifyAdmin(post, name) {
  await Notification.create({ audience: 'admin', type: 'blog', link: `/admin/blog?review=${post._id}`, image: post.cover, title: 'New blog post to review', body: `${name} sent “${post.title}” for approval.` }).catch(() => {})
}

router.post('/posts', blogWriteLimiter, validate(postSchema), asyncHandler(async (req, res) => {
  const b = req.body
  await ensureAuthorSlug(req.user)
  const post = new BlogPost({ author: req.user._id, authorName: req.user.name, status: 'draft' })
  applyFields(post, b)
  post.slug = await uniqueSlug(BlogPost, 'slug', b.slug || b.title)
  if (b.submit) {
    const errors = readyErrors(post)
    if (Object.keys(errors).length) return res.status(400).json({ message: 'A few things are needed before review.', errors })
    post.status = 'pending'; post.submittedAt = new Date()
  }
  await post.save()
  if (post.status === 'pending') notifyAdmin(post, req.user.name)
  res.status(201).json({ post })
}))

router.patch('/posts/:id', blogWriteLimiter, validate(postSchema), asyncHandler(async (req, res) => {
  const post = await mine(req, req.params.id)
  if (!post) return res.status(404).json({ message: 'Post not found' })
  if (!EDITABLE.includes(post.status)) return res.status(409).json({ message: 'This post is live. Ask the admin to make changes to published posts.' })
  const b = req.body
  applyFields(post, b)
  if (b.slug && b.slug !== post.slug) post.slug = await uniqueSlug(BlogPost, 'slug', b.slug, post._id)
  post.authorName = req.user.name
  const wasPending = post.status === 'pending'
  if (b.submit) {
    const errors = readyErrors(post)
    if (Object.keys(errors).length) return res.status(400).json({ message: 'A few things are needed before review.', errors })
    post.status = 'pending'; post.submittedAt = new Date(); post.reviewNote = undefined
  } else if (post.status === 'rejected') post.status = 'draft'
  await post.save()
  if (b.submit && !wasPending) notifyAdmin(post, req.user.name)
  res.json({ post })
}))

// Take a pending post back to draft
router.post('/posts/:id/withdraw', asyncHandler(async (req, res) => {
  const post = await mine(req, req.params.id)
  if (!post) return res.status(404).json({ message: 'Post not found' })
  if (post.status !== 'pending') return res.status(409).json({ message: 'Only posts waiting for review can be taken back.' })
  post.status = 'draft'
  await post.save()
  res.json({ post })
}))

router.delete('/posts/:id', asyncHandler(async (req, res) => {
  const post = await mine(req, req.params.id)
  if (!post) return res.status(404).json({ message: 'Post not found' })
  if (post.status === 'published') return res.status(409).json({ message: 'Published posts can only be removed by the admin.' })
  await post.deleteOne()
  res.json({ ok: true })
}))

router.post('/images', blogImageLimiter, validate(z.object({ image: z.string().max(1_000_000) }).strict()), asyncHandler(async (req, res) => {
  const r = await saveImage(req.body.image, req.user._id)
  if (r.error) return res.status(400).json({ message: r.error })
  res.status(201).json({ url: `${req.protocol}://${req.get('host')}/api/blog/images/${r.id}` })
}))

export default router
