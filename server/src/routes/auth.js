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
import { profileSchema, publicUser, nameField } from '../utils/profile.js'

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
  validate(z.object({ token: z.string().min(20) })),
  asyncHandler(async (req, res) => {
    const origins = (process.env.CLIENT_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean)
    let claims
    try {
      claims = await verifyClerkToken(req.body.token, origins)
    } catch (e) {
      return res.status(401).json({ message: `Google sign-in failed: ${e.message}` })
    }
    const email = String(claims.email || '').toLowerCase().trim()
    if (!email || email.includes('{{')) return res.status(400).json({ message: 'Your Google account has no email address we can use.' })
    let user = await User.findOne({ email })
    if (user?.role === 'admin') return res.status(403).json({ message: 'Admins must sign in with email and password.' })
    if (!user) {
      const name = (claims.name && !String(claims.name).includes('{{') ? String(claims.name) : email.split('@')[0]).slice(0, 80)
      const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), BCRYPT_ROUNDS) // unusable random password
      user = await User.create({ name, email, passwordHash, provider: 'google' })
    }
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
    if (data.avatar !== undefined) user.avatar = data.avatar || undefined
    if (data.address !== undefined) {
      user.addresses = data.address
        ? [{ name: user.name, phone: user.phone, ...data.address, landmark: data.address.landmark || undefined, isDefault: true }]
        : []
    }
    await user.save()
    res.json({ user: publicUser(user), message: 'Profile updated' })
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
    if (user.provider === 'google') return res.status(400).json({ message: 'This account signs in with Google, so its email comes from Google.', errors: { email: 'Managed by your Google account' } })
    const ok = await bcrypt.compare(data.password, user.passwordHash)
    if (!ok) return res.status(400).json({ message: 'Current password is wrong', errors: { password: 'Current password is wrong' } })
    if (data.email === user.email) return res.json({ user: publicUser(user), message: 'That’s already your email' })
    if (await User.exists({ email: data.email })) return res.status(409).json({ message: 'That email is already used by another account', errors: { email: 'Already used by another account' } })
    user.email = data.email
    await user.save()
    res.json({ user: publicUser(user), message: 'Email updated' })
  })
)

export default router
