import { verifyToken } from '../utils/token.js'
import { User } from '../models/index.js'

// Like authenticate, but never rejects — attaches req.user when a valid session exists.
export async function optionalAuth(req, res, next) {
  try {
    const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      const payload = verifyToken(token)
      req.user = await User.findById(payload.id).select('-passwordHash')
    }
  } catch { /* guest */ }
  next()
}
