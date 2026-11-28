import { verifyToken } from '../utils/token.js'
import { User } from '../models/index.js'

// Reads the JWT from the httpOnly cookie (or Authorization header) and loads the user.
export async function authenticate(req, res, next) {
  try {
    // Header first: Safari/iOS blocks the cross-site cookie, so the app sends the token itself
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token
    if (!token) return res.status(401).json({ message: 'Not authenticated' })
    const payload = verifyToken(token)
    const user = await User.findById(payload.id).select('-passwordHash')
    if (!user) return res.status(401).json({ message: 'User not found' })
    req.user = user
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired session' })
  }
}

// Admin check runs on the BACKEND for every admin route — never trust the frontend.
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin access required' })
  next()
}

// Blog authors (and the admin) — checked on the backend for every author route
export function requireAuthor(req, res, next) {
  if (!['author', 'admin'].includes(req.user?.role)) return res.status(403).json({ message: 'Author access required' })
  next()
}
