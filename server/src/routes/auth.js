import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { User } from '../models/index.js'
import crypto from 'node:crypto'
import { signToken, cookieOptions } from '../utils/token.js'
import { verifyClerkToken } from '../utils/clerk.js'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler, validate } from '../middleware/error.js'

const router = Router()

import { loginLimiter, registerLimiter, profileLimiter, emailChangeLimiter } from '../middleware/security.js'
import { profileSchema, publicUser, nameField, savedAddressSchema, MAX_ADDRESSES, defaultAddress } from '../utils/profile.js'
import { fetchGooglePhoto, isAllowedPhotoUrl } from '../utils/googlePhoto.js'
import { sendMail, mailEnabled } from '../utils/mailer.js'
import mongoose from 'mongoose'

// Pull the Google profile photo in, unless the customer chose their own photo
// or removed it on purpose. Never blocks sign-in if Google/Clerk is slow.
async function syncGooglePhoto(user, imageUrl) {
  if (!imageUrl || !isAllowedPhotoUrl(imageUrl)) return false
  if (user.avatarSource === 'upload' || user.avatarSource === 'none') return false
  if (user.avatar && !user.avatarSource) return false // older uploaded photo
  const photo = await fetchGooglePhoto(imageUrl)
  if (!photo) return false
  if (photo.avatar === user.avatar) return false
  user.avatar = photo.avatar
  user.avatarThumb = photo.avatarThumb
  user.avatarSource = 'google'
  return true
}

const BCRYPT_ROUNDS = 12
// Used when the email doesn't exist so a failed login takes the same time
// either way (stops attackers from discovering which emails have accounts).
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS)

const email = z.string().trim().toLowerCase().email().max(120)
const registerSchema = z.object({
  name: nameField,
  email,
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number').optional().or(z.literal('')),
  password: z.string().min(8, 'Use at least 8 characters').max(128)
    .regex(/[A-Za-z]/, 'Include at least one letter').regex(/\d/, 'Include at least one number'),
})
const loginSchema = z.object({ email, password: z.string().min(1).max(128) })

router.post(
  '/register',
  registerLimiter,
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body
    if (await User.findOne({ email })) return res.status(409).json({ message: 'Email already registered' })
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS)
    const user = await User.create({ name, email, phone: phone || undefined, passwordHash })
    res.cookie('token', signToken(user), cookieOptions())
    res.status(201).json({ user: publicUser(user), token: signToken(user) })
  })
)

router.post(
  '/login',
  loginLimiter,
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    const ok = await bcrypt.compare(password, user?.passwordHash || DUMMY_HASH)
    if (!user || !ok) return res.status(401).json({ message: 'Invalid email or password' })
    res.cookie('token', signToken(user), cookieOptions())
    res.json({ user: publicUser(user), token: signToken(user) })
  })
)

// "Continue with Google" via Clerk: verify the Clerk session token, then
// find-or-create the user and issue our normal session cookie.
router.post(
  '/clerk',
  loginLimiter,
  // imageUrl = the Google profile photo Clerk gives the browser (optional)
  validate(z.object({ token: z.string().min(20), imageUrl: z.string().max(2000).optional() })),
  asyncHandler(async (req, res) => {
    const origins = (process.env.CLIENT_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean)
    let claims
    try {
      claims = await verifyClerkToken(req.body.token, origins)
    } catch (e) {
      return res.status(401).json({ message: `Google sign-in failed: ${e.message}` })
    }
    const email = String(claims.email || '').toLowerCase().trim()
    const clerkId = typeof claims.sub === 'string' && /^user_[A-Za-z0-9]+$/.test(claims.sub) ? claims.sub : null
    if (!email || email.includes('{{')) return res.status(400).json({ message: 'Your Google account has no email address we can use.' })
    // Same Google account as before (even if the customer changed their store email)…
    let user = clerkId ? await User.findOne({ clerkId }) : null
    // …or the first Google sign-in for this email
    if (!user) {
      user = await User.findOne({ email })
      if (user?.clerkId && user.clerkId !== clerkId) {
        return res.status(409).json({ message: 'This email is already used by another AnimalVeda account. Please sign in with that account.' })
      }
    }
    if (user?.role === 'admin') return res.status(403).json({ message: 'Admins must sign in with email and password.' })
    if (!user) {
      const name = (claims.name && !String(claims.name).includes('{{') ? String(claims.name) : email.split('@')[0]).slice(0, 80)
      const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), BCRYPT_ROUNDS) // unusable random password
      user = new User({ name, email, passwordHash, provider: 'google' })
    }
    if (clerkId && !user.clerkId) user.clerkId = clerkId
    await syncGooglePhoto(user, req.body.imageUrl).catch(() => false)
    await user.save()
    res.cookie('token', signToken(user), cookieOptions())
    res.json({ user: publicUser(user), token: signToken(user) })
  })
)

router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieOptions())
  res.json({ message: 'Logged out' })
})

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    res.json({ user: publicUser(req.user) })
  })
)

// Zod issues → { field: message } using the full path ("address.pincode")
function check(schema, body, res) {
  const r = schema.safeParse(body)
  if (r.success) return r.data
  const errors = {}
  for (const i of r.error.issues) {
    const key = i.path.join('.') || 'form'
    if (!errors[key]) errors[key] = i.code === 'unrecognized_keys' ? 'You can’t change that field' : i.message
  }
  res.status(400).json({ message: Object.values(errors)[0] || 'Please check your details', errors })
  return null
}

// Update own profile: name, phone, photo, saved address. Nothing else can be
// changed here (role / blocked / email / password are refused by the schema).
router.patch(
  '/me',
  authenticate,
  profileLimiter,
  asyncHandler(async (req, res) => {
    const data = check(profileSchema, req.body, res)
    if (!data) return
    const user = await User.findById(req.user._id)
    if (!user) return res.status(401).json({ message: 'User not found' })
    if (data.name !== undefined) user.name = data.name
    if (data.phone !== undefined) user.phone = data.phone || undefined
    if (data.avatar !== undefined) {
      user.avatar = data.avatar || undefined
      user.avatarThumb = data.avatar ? data.avatarThumb || undefined : undefined
      user.avatarSource = data.avatar ? 'upload' : 'none'
    }
    // Older app versions: one "address" = the default address
    if (data.address !== undefined) {
      const def = defaultAddress(user)
      if (!data.address) {
        if (def) user.addresses.pull(def._id)
        if (user.addresses[0]) user.addresses[0].isDefault = true
      } else if (def) {
        Object.assign(def, { ...data.address, landmark: data.address.landmark || undefined })
      } else {
        user.addresses.push({ label: 'Home', name: user.name, phone: user.phone, ...data.address, landmark: data.address.landmark || undefined, isDefault: true })
      }
    }
    await user.save()
    res.json({ user: publicUser(user), message: 'Profile updated' })
  })
)

// Re-sync the Google photo (used when a Google customer was already signed in)
router.post(
  '/me/google-photo',
  authenticate,
  profileLimiter,
  asyncHandler(async (req, res) => {
    const data = check(z.object({ imageUrl: z.string().max(2000) }).strict(), req.body, res)
    if (!data) return
    const user = await User.findById(req.user._id)
    if (!user) return res.status(401).json({ message: 'User not found' })
    if (user.provider !== 'google') return res.json({ user: publicUser(user) })
    if (await syncGooglePhoto(user, data.imageUrl).catch(() => false)) await user.save()
    res.json({ user: publicUser(user) })
  })
)

/* ------------------------------ Address book ------------------------------ */
const addressId = (req, res) => {
  if (mongoose.isValidObjectId(req.params.id)) return req.params.id
  res.status(404).json({ message: 'Address not found' })
  return null
}
const cleanAddress = (a) => ({ ...a, label: a.label || 'Home', landmark: a.landmark || undefined })
const makeDefault = (user, sub) => user.addresses.forEach((a) => { a.isDefault = a === sub })

router.post(
  '/me/addresses',
  authenticate,
  profileLimiter,
  asyncHandler(async (req, res) => {
    const data = check(savedAddressSchema, req.body, res)
    if (!data) return
    const user = await User.findById(req.user._id)
    if (!user) return res.status(401).json({ message: 'User not found' })
    if (user.addresses.length >= MAX_ADDRESSES) return res.status(400).json({ message: `You can save up to ${MAX_ADDRESSES} addresses. Please delete one first.` })
    const { isDefault, ...rest } = data
    user.addresses.push(cleanAddress(rest))
    const added = user.addresses[user.addresses.length - 1]
    if (isDefault || user.addresses.length === 1) makeDefault(user, added)
    await user.save()
    res.status(201).json({ user: publicUser(user), address: { id: String(added._id) }, message: 'Address saved' })
  })
)

router.patch(
  '/me/addresses/:id',
  authenticate,
  profileLimiter,
  asyncHandler(async (req, res) => {
    const id = addressId(req, res)
    if (!id) return
    const data = check(savedAddressSchema, req.body, res)
    if (!data) return
    const user = await User.findById(req.user._id)
    if (!user) return res.status(401).json({ message: 'User not found' })
    const sub = user.addresses.id(id)
    if (!sub) return res.status(404).json({ message: 'Address not found' })
    const { isDefault, ...rest } = data
    sub.set({ ...cleanAddress(rest), landmark: rest.landmark || undefined })
    if (isDefault) makeDefault(user, sub)
    await user.save()
    res.json({ user: publicUser(user), message: 'Address updated' })
  })
)

router.post(
  '/me/addresses/:id/default',
  authenticate,
  profileLimiter,
  asyncHandler(async (req, res) => {
    const id = addressId(req, res)
    if (!id) return
    const user = await User.findById(req.user._id)
    if (!user) return res.status(401).json({ message: 'User not found' })
    const sub = user.addresses.id(id)
    if (!sub) return res.status(404).json({ message: 'Address not found' })
    makeDefault(user, sub)
    await user.save()
    res.json({ user: publicUser(user), message: 'Default address changed' })
  })
)

router.delete(
  '/me/addresses/:id',
  authenticate,
  profileLimiter,
  asyncHandler(async (req, res) => {
    const id = addressId(req, res)
    if (!id) return
    const user = await User.findById(req.user._id)
    if (!user) return res.status(401).json({ message: 'User not found' })
    const sub = user.addresses.id(id)
    if (!sub) return res.status(404).json({ message: 'Address not found' })
    const wasDefault = !!sub.isDefault
    user.addresses.pull(sub._id)
    if (wasDefault && user.addresses[0]) user.addresses[0].isDefault = true
    await user.save()
    res.json({ user: publicUser(user), message: 'Address deleted' })
  })
)

// Change email: needs the current password. Google accounts keep their Google email.
router.patch(
  '/me/email',
  authenticate,
  emailChangeLimiter,
  asyncHandler(async (req, res) => {
    const data = check(z.object({ email, password: z.string().min(1, 'Enter your current password').max(128) }).strict(), req.body, res)
    if (!data) return
    const user = await User.findById(req.user._id)
    if (!user) return res.status(401).json({ message: 'User not found' })
    if (user.provider === 'google') return res.status(400).json({ message: 'This account signs in with Google. We’ll email you a code to confirm the new address instead.', errors: { email: 'Use the code option for Google accounts' } })
    const ok = await bcrypt.compare(data.password, user.passwordHash)
    if (!ok) return res.status(400).json({ message: 'Current password is wrong', errors: { password: 'Current password is wrong' } })
    if (data.email === user.email) return res.json({ user: publicUser(user), message: 'That’s already your email' })
    if (await User.exists({ email: data.email })) return res.status(409).json({ message: 'That email is already used by another account', errors: { email: 'Already used by another account' } })
    user.email = data.email
    await user.save()
    res.json({ user: publicUser(user), message: 'Email updated' })
  })
)

// Google accounts have no password, so a new email is confirmed by a 6-digit
// code sent to that new address (which also proves the customer owns it).
// Google sign-in keeps working afterwards because we match on the Clerk id.
const CODE_TTL_MS = 15 * 60 * 1000
const hashCode = (userId, code) => crypto.createHash('sha256').update(`${userId}:${code}:${process.env.JWT_SECRET || ''}`).digest('hex')

router.post(
  '/me/email/code',
  authenticate,
  emailChangeLimiter,
  asyncHandler(async (req, res) => {
    const data = check(z.object({ email }).strict(), req.body, res)
    if (!data) return
    const user = await User.findById(req.user._id)
    if (!user) return res.status(401).json({ message: 'User not found' })
    if (user.provider !== 'google') return res.status(400).json({ message: 'Use your current password to change the email.' })
    if (!user.clerkId) return res.status(400).json({ message: 'Please sign out and sign in with Google once more, then try again.' })
    if (data.email === user.email) return res.status(400).json({ message: 'That’s already your email', errors: { email: 'That’s already your email' } })
    if (await User.exists({ email: data.email })) return res.status(409).json({ message: 'That email is already used by another account', errors: { email: 'Already used by another account' } })
    if (!mailEnabled()) return res.status(503).json({ message: 'Email changes are unavailable right now. Please contact support.' })
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
    user.pendingEmail = data.email
    user.emailCodeHash = hashCode(user._id, code)
    user.emailCodeExpires = new Date(Date.now() + CODE_TTL_MS)
    user.emailCodeTries = 0
    await user.save()
    const sent = await sendMail({
      to: data.email,
      subject: `${code} is your AnimalVeda verification code`,
      text: `Hi ${user.name},\n\nUse this code to confirm ${data.email} as the email on your AnimalVeda account: ${code}\n\nIt expires in 15 minutes. If you didn’t ask for this, you can ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1a1a17"><p>Hi ${user.name.replace(/[<>&"]/g, '')},</p><p>Use this code to confirm this address as the email on your AnimalVeda account:</p><p style="font-size:30px;font-weight:800;letter-spacing:6px;margin:18px 0">${code}</p><p style="color:#666">It expires in 15 minutes. If you didn’t ask for this, you can ignore this email.</p></div>`,
    })
    if (!sent?.ok) return res.status(502).json({ message: 'We couldn’t send the code. Please check the email and try again.' })
    res.json({ user: publicUser(user), message: `We sent a 6-digit code to ${data.email}` })
  })
)

router.post(
  '/me/email/verify',
  authenticate,
  emailChangeLimiter,
  asyncHandler(async (req, res) => {
    const data = check(z.object({ code: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code') }).strict(), req.body, res)
    if (!data) return
    const user = await User.findById(req.user._id)
    if (!user) return res.status(401).json({ message: 'User not found' })
    const clear = () => { user.pendingEmail = undefined; user.emailCodeHash = undefined; user.emailCodeExpires = undefined; user.emailCodeTries = undefined }
    if (!user.pendingEmail || !user.emailCodeExpires || user.emailCodeExpires < new Date()) {
      clear(); await user.save()
      return res.status(400).json({ message: 'That code has expired. Please ask for a new one.', errors: { code: 'Code expired, ask for a new one' } })
    }
    if ((user.emailCodeTries || 0) >= 5) {
      clear(); await user.save()
      return res.status(400).json({ message: 'Too many wrong codes. Please ask for a new one.', errors: { code: 'Too many tries, ask for a new code' } })
    }
    const ok = crypto.timingSafeEqual(Buffer.from(hashCode(user._id, data.code)), Buffer.from(user.emailCodeHash))
    if (!ok) {
      user.emailCodeTries = (user.emailCodeTries || 0) + 1
      await user.save()
      return res.status(400).json({ message: 'That code is wrong', errors: { code: 'That code is wrong' } })
    }
    if (await User.exists({ email: user.pendingEmail, _id: { $ne: user._id } })) {
      clear(); await user.save()
      return res.status(409).json({ message: 'That email is already used by another account', errors: { code: 'Email already used by another account' } })
    }
    user.email = user.pendingEmail
    clear()
    await user.save()
    res.json({ user: publicUser(user), message: 'Email updated' })
  })
)

router.delete(
  '/me/email/code',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findByIdAndUpdate(req.user._id, { $unset: { pendingEmail: 1, emailCodeHash: 1, emailCodeExpires: 1, emailCodeTries: 1 } }, { new: true })
    res.json({ user: publicUser(user) })
  })
)

export default router
