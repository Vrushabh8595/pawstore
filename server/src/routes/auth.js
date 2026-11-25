import { Router } from 'express'
import bcrypt from 'bcryptjs'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { User } from '../models/index.js'
import { signToken, cookieOptions } from '../utils/token.js'
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
    res.status(201).json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } })
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
    res.json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } })
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
