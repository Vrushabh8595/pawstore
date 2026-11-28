import { Router } from 'express'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { BlogPost, User, Notification } from '../models/index.js'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { asyncHandler, validate } from '../middleware/error.js'
import { postSchema, readyErrors, applyFields, uniqueSlug, CARD, saveImage, ensureAuthorSlug } from '../utils/blog.js'

// Admin: blog authors and post approval. Nothing goes live without this.
const router = Router()
router.use(authenticate, requireAdmin)
const oid = (id) => mongoose.isValidObjectId(id)

/* --------------------------------- Authors --------------------------------- */
router.get('/authors', asyncHandler(async (req, res) => {
  const authors = await User.find({ role: 'author' }).select('name email bio authorSlug avatarThumb avatar createdAt').sort({ createdAt: -1 }).lean()
  const counts = await BlogPost.aggregate([{ $match: { author: { $in: authors.map((a) => a._id) } } }, { $group: { _id: { a: '$author', s: '$status' }, n: { $sum: 1 } } }])
  res.json({
    authors: authors.map((a) => ({
      id: String(a._id), name: a.name, email: a.email, bio: a.bio || '', slug: a.authorSlug, avatar: a.avatarThumb || a.avatar || '', createdAt: a.createdAt,
      posts: Object.fromEntries(counts.filter((c) => String(c._id.a) === String(a._id)).map((c) => [c._id.s, c.n])),
    })),
  })
}))

const password = z.string().min(8, 'Use at least 8 characters').max(72).regex(/[A-Za-z]/, 'Include a letter').regex(/\d/, 'Include a number')
router.post('/authors', validate(z.object({
  name: z.string().trim().min(2).max(60).regex(/^[\p{L} .'-]+$/u, 'Use letters only for the name'),
  email: z.string().trim().toLowerCase().email().max(120),
  password,
  bio: z.string().trim().max(300).optional().default(''),
}).strict()), asyncHandler(async (req, res) => {
  const { name, email, bio } = req.body
  if (await User.exists({ email })) return res.status(409).json({ message: 'An account with this email already exists. Use a different email for the author.' })
  const user = new User({ name, email, bio, role: 'author', passwordHash: await bcrypt.hash(req.body.password, 12) })
  await user.save()
  await ensureAuthorSlug(user)
  res.status(201).json({ author: { id: String(user._id), name, email, bio, slug: user.authorSlug, posts: {} } })
}))

router.patch('/authors/:id', validate(z.object({
  name: z.string().trim().min(2).max(60).regex(/^[\p{L} .'-]+$/u, 'Use letters only for the name').optional(),
  bio: z.string().trim().max(300).optional(),
  password: password.optional(),
}).strict()), asyncHandler(async (req, res) => {
  if (!oid(req.params.id)) return res.status(404).json({ message: 'Author not found' })
  const user = await User.findOne({ _id: req.params.id, role: 'author' })
  if (!user) return res.status(404).json({ message: 'Author not found' })
  if (req.body.name) user.name = req.body.name
  if (req.body.bio !== undefined) user.bio = req.body.bio
  if (req.body.password) user.passwordHash = await bcrypt.hash(req.body.password, 12)
  await user.save()
  if (req.body.name) await BlogPost.updateMany({ author: user._id }, { authorName: user.name })
  res.json({ ok: true })
}))

// Delete the author's login and profile. Unpublished posts go with it; published
// posts stay live under the author's name unless the admin removes them too.
router.delete('/authors/:id', asyncHandler(async (req, res) => {
  if (!oid(req.params.id)) return res.status(404).json({ message: 'Author not found' })
  const user = await User.findOne({ _id: req.params.id, role: 'author' })
  if (!user) return res.status(404).json({ message: 'Author not found' })
  const removePublished = req.query.posts === 'delete'
  const drafts = await BlogPost.deleteMany({ author: user._id, status: { $ne: 'published' } })
  const live = removePublished
    ? await BlogPost.deleteMany({ author: user._id, status: 'published' })
    : await BlogPost.updateMany({ author: user._id, status: 'published' }, { $unset: { author: 1 }, authorName: user.name })
  await Notification.deleteMany({ user: user._id }).catch(() => {})
  await user.deleteOne()
  res.json({ ok: true, removedDrafts: drafts.deletedCount, publishedPosts: removePublished ? `deleted ${live.deletedCount}` : `kept ${live.modifiedCount}` })
}))

/* ---------------------------------- Posts ---------------------------------- */
router.get('/posts', asyncHandler(async (req, res) => {
  const status = ['draft', 'pending', 'published', 'rejected'].includes(req.query.status) ? req.query.status : undefined
  const [posts, counts] = await Promise.all([
    BlogPost.find(status ? { status } : {}).select(CARD).sort({ status: 1, updatedAt: -1 }).limit(500).lean(),
    BlogPost.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
  ])
  res.json({ posts, counts: Object.fromEntries(counts.map((c) => [c._id, c.n])) })
}))
router.get('/posts/:id', asyncHandler(async (req, res) => {
  const post = oid(req.params.id) && await BlogPost.findById(req.params.id).lean()
  if (!post) return res.status(404).json({ message: 'Post not found' })
  res.json({ post })
}))

const publish = (post, admin) => { post.status = 'published'; post.publishedAt = post.publishedAt || new Date(); post.reviewedBy = admin._id; post.reviewNote = undefined }

router.post('/posts', validate(postSchema), asyncHandler(async (req, res) => {
  const b = req.body
  await ensureAuthorSlug(req.user)
  const post = new BlogPost({ author: req.user._id, authorName: req.user.name, status: 'draft' })
  applyFields(post, b)
  post.slug = await uniqueSlug(BlogPost, 'slug', b.slug || b.title)
  if (b.publish) {
    const errors = readyErrors(post)
    if (Object.keys(errors).length) return res.status(400).json({ message: 'A few things are needed before publishing.', errors })
    publish(post, req.user)
  }
  await post.save()
  res.status(201).json({ post })
}))

router.patch('/posts/:id', validate(postSchema), asyncHandler(async (req, res) => {
  const post = oid(req.params.id) && await BlogPost.findById(req.params.id)
  if (!post) return res.status(404).json({ message: 'Post not found' })
  const b = req.body
  applyFields(post, b)
  // The web address of a live post never changes (links and Google would break)
  if (b.slug && b.slug !== post.slug && post.status !== 'published') post.slug = await uniqueSlug(BlogPost, 'slug', b.slug, post._id)
  if (b.publish || post.status === 'published') {
    const errors = readyErrors(post)
    if (Object.keys(errors).length) return res.status(400).json({ message: 'A few things are needed before publishing.', errors })
    if (b.publish) publish(post, req.user)
  }
  await post.save()
  res.json({ post })
}))

router.patch('/posts/:id/review', validate(z.object({ action: z.enum(['approve', 'reject', 'unpublish']), note: z.string().trim().max(500).optional() }).strict()), asyncHandler(async (req, res) => {
  const post = oid(req.params.id) && await BlogPost.findById(req.params.id)
  if (!post) return res.status(404).json({ message: 'Post not found' })
  const { action, note } = req.body
  if (action === 'approve') {
    const errors = readyErrors(post)
    if (Object.keys(errors).length) return res.status(400).json({ message: 'This post isn’t complete yet: ' + Object.values(errors).join(' '), errors })
    publish(post, req.user)
  } else if (action === 'reject') {
    if (!note) return res.status(400).json({ message: 'Tell the author what to change.' })
    post.status = 'rejected'; post.reviewNote = note; post.reviewedBy = req.user._id
  } else {
    post.status = 'draft'; post.reviewNote = note || 'Taken offline by the admin.'
  }
  await post.save()
  if (post.author && String(post.author) !== String(req.user._id)) {
    Notification.create({
      audience: 'user', user: post.author, type: 'blog', link: `/author/posts/${post._id}`, image: post.cover, status: post.status,
      title: action === 'approve' ? 'Your post is live! 🎉' : action === 'reject' ? 'Your post needs changes' : 'Your post was taken offline',
      body: action === 'approve' ? `“${post.title}” is now published on the AnimalVeda blog.` : `“${post.title}”: ${post.reviewNote}`,
    }).catch(() => {})
  }
  res.json({ post })
}))

router.delete('/posts/:id', asyncHandler(async (req, res) => {
  if (!oid(req.params.id)) return res.status(404).json({ message: 'Post not found' })
  await BlogPost.findByIdAndDelete(req.params.id)
  res.json({ ok: true })
}))

router.post('/images', validate(z.object({ image: z.string().max(1_000_000) }).strict()), asyncHandler(async (req, res) => {
  const r = await saveImage(req.body.image, req.user._id)
  if (r.error) return res.status(400).json({ message: r.error })
  res.status(201).json({ url: `${req.protocol}://${req.get('host')}/api/blog/images/${r.id}` })
}))

export default router
