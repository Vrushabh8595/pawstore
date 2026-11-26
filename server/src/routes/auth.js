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

import { loginLimiter, registerLimiter } from '../middleware/security.js'

const BCRYPT_ROUNDS = 12
// Used when the email doesn't exist so a failed login takes the same time
// either way (stops attackers from discovering which emails have accounts).
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS)

const email = z.string().trim().toLowerCase().email().max(120)
const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
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
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token: signToken(user) })
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
    res.json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, blocked: !!user.blocked }, token: signToken(user) })
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
      user = await User.create({ name, email, passwordHash })
    }
    res.cookie('token', signToken(user), cookieOptions())
    res.json({ user: { id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role, blocked: !!user.blocked }, token: signToken(user) })
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
    res.json({ user: req.user })
  })
)

export default router
