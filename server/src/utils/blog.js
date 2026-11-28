import { z } from 'zod'
import { BlogPost, BlogImage, BlogCategory, User } from '../models/index.js'

// Built-in categories; authors and the admin can add more (BlogCategory)
export const BLOG_CATEGORIES = [
  ['dog-care', 'Dog care'], ['cat-care', 'Cat care'], ['nutrition', 'Nutrition & food'], ['health', 'Health & medicines'],
  ['grooming', 'Grooming'], ['training', 'Training & behaviour'], ['livestock', 'Cattle & livestock'], ['news', 'AnimalVeda news'],
]

export const slugify = (s = '') =>
  String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)

export async function uniqueSlug(Model, field, base, exceptId) {
  const root = slugify(base) || 'post'
  for (let i = 1; i < 200; i++) {
    const slug = i === 1 ? root : `${root}-${i}`
    const clash = await Model.exists({ [field]: slug, ...(exceptId ? { _id: { $ne: exceptId } } : {}) })
    if (!clash) return slug
  }
  return `${root}-${Date.now().toString(36)}`
}

// All categories: built-in first, then added ones (cached briefly)
let catCache = null
export async function getCategories() {
  if (catCache && Date.now() - catCache.at < 30_000) return catCache.list
  const added = await BlogCategory.find({}).select('slug name').sort({ name: 1 }).lean()
  const list = [...BLOG_CATEGORIES.map(([slug, name]) => ({ slug, name, builtIn: true })), ...added.filter((c) => !BLOG_CATEGORIES.some(([s]) => s === c.slug)).map((c) => ({ slug: c.slug, name: c.name }))]
  catCache = { list, at: Date.now() }
  return list
}
export const clearCategoryCache = () => { catCache = null }

// Add a category by name (returns the existing one if the name is already taken)
export async function addCategory(rawName, userId) {
  const name = String(rawName || '').replace(/\s+/g, ' ').trim()
  if (name.length < 2 || name.length > 40) return { error: 'Use a category name of 2 to 40 characters.' }
  if (/[<>{}]/.test(name)) return { error: 'Use letters, numbers and simple punctuation only.' }
  const slug = slugify(name).slice(0, 40)
  if (!slug) return { error: 'Use letters or numbers in the name.' }
  const all = await getCategories()
  const same = all.find((c) => c.slug === slug || c.name.toLowerCase() === name.toLowerCase())
  if (same) return { category: same, existed: true }
  if (all.length >= 60) return { error: 'There are already 60 categories. Ask the admin to remove unused ones.' }
  try { await BlogCategory.create({ slug, name, createdBy: userId }) } catch (e) { if (e?.code !== 11000) throw e }
  clearCategoryCache()
  return { category: { slug, name } }
}

// Express middleware: a post's category must be one that exists
export async function checkCategory(req, res, next) {
  try {
    const c = req.body?.category
    if (c && !(await getCategories()).some((x) => x.slug === c)) return res.status(400).json({ message: 'Choose a category from the list.', errors: { category: 'Choose a category from the list.' } })
    next()
  } catch (e) { next(e) }
}

const words = (s = '') => (String(s).match(/[\p{L}\p{N}]+/gu) || []).length
export const readMinutes = (content) => Math.max(1, Math.round(words(content) / 200))

// https only (or our own image route); blocks javascript:, data: and the like
const httpsUrl = z.string().trim().max(500).regex(/^https:\/\/[^\s<>"']+$/, 'Use an https:// image link or upload a picture')
const text = (max) => z.string().trim().max(max)

export const postSchema = z.object({
  title: text(140).min(3, 'Add a title (at least 3 characters)'),
  slug: text(90).optional(),
  excerpt: text(300).optional(),
  content: z.string().max(60000, 'The post is too long (60,000 characters max)').optional(),
  cover: z.union([httpsUrl, z.literal('')]).optional(),
  coverAlt: text(160).optional(),
  category: z.union([text(40).regex(/^[a-z0-9-]+$/, 'Choose a category from the list.'), z.literal('')]).optional(),
  tags: z.array(text(30)).max(10).optional(),
  metaTitle: text(70).optional(),
  metaDescription: text(170).optional(),
  submit: z.boolean().optional(), // author: send for review
  publish: z.boolean().optional(), // admin only: publish straight away
}).strict()

// What a post needs before it can be reviewed or published
export function readyErrors(p) {
  const e = {}
  if (!p.title || p.title.length < 10) e.title = 'Use a title of at least 10 characters.'
  if (!p.excerpt || p.excerpt.length < 50) e.excerpt = 'Write a short summary of at least 50 characters.'
  if (words(p.content) < 150) e.content = 'Write at least 150 words.'
  if (!p.cover) e.cover = 'Add a cover image.'
  if (!p.category) e.category = 'Choose a category.'
  return e
}

export function applyFields(post, body) {
  for (const k of ['title', 'excerpt', 'content', 'cover', 'coverAlt', 'category', 'metaTitle', 'metaDescription']) if (body[k] !== undefined) post[k] = body[k]
  if (body.tags) post.tags = [...new Set(body.tags.map((t) => t.toLowerCase()).filter(Boolean))]
  post.readMinutes = readMinutes(post.content)
}

// Card fields for lists (no full content)
export const CARD = 'title slug excerpt cover coverAlt category tags authorName author publishedAt readMinutes updatedAt status reviewNote submittedAt createdAt views'

export const authorPublic = (u) => u && ({ name: u.name, slug: u.authorSlug, bio: u.bio || '', avatar: u.avatar || '' })

// Uploaded images: jpeg/png/webp only, checked by their magic bytes, ≤ 700 KB
const SIG = { 'image/jpeg': [0xff, 0xd8, 0xff], 'image/png': [0x89, 0x50, 0x4e, 0x47], 'image/webp': [0x52, 0x49, 0x46, 0x46] }
export async function saveImage(dataUrl, userId) {
  const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''))
  if (!m) return { error: 'Upload a JPG, PNG or WebP picture.' }
  const buf = Buffer.from(m[2], 'base64')
  if (buf.length > 700 * 1024) return { error: 'That picture is too big. Use one under 700 KB.' }
  const sig = SIG[m[1]]
  if (!sig.every((b, i) => buf[i] === b) || (m[1] === 'image/webp' && buf.toString('ascii', 8, 12) !== 'WEBP')) return { error: 'That file isn’t a valid picture.' }
  const img = await BlogImage.create({ data: buf, type: m[1], size: buf.length, uploadedBy: userId })
  return { id: String(img._id) }
}

export async function ensureAuthorSlug(user) {
  if (user.authorSlug) return user.authorSlug
  user.authorSlug = await uniqueSlug(User, 'authorSlug', user.name)
  await user.save()
  return user.authorSlug
}

export { BlogPost }
