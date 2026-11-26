import { Router } from 'express'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { User } from '../models/index.js'
import crypto from 'node:crypto'
import { signToken, cookieOptions } from '../utils/token.js'
import { verifyClerkToken } from '../utils/clerk.js'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler, validate } from '../middleware/error.js'

const router = Router()

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { message: 'Too many attempts, try later' } })

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(6),
})
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(1) })

router.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, phone, password } = req.body
    if (await User.findOne({ email })) return res.status(409).json({ message: 'Email already registered' })
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ name, email, phone, passwordHash })
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
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ message: 'Invalid email or password' })
    res.cookie('token', signToken(user), cookieOptions())
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token: signToken(user) })
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
      const passwordHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10) // unusable random password
      user = await User.create({ name, email, passwordHash })
    }
    res.cookie('token', signToken(user), cookieOptions())
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role }, token: signToken(user) })
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
