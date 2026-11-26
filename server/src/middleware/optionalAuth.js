import { verifyToken } from '../utils/token.js'
import { User } from '../models/index.js'

// Like authenticate, but never rejects — attaches req.user when a valid session exists.
export async function optionalAuth(req, res, next) {
  try {
    // Header first: Safari/iOS blocks the cross-site cookie, so the app sends the token itself
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token
    if (token) {
      const payload = verifyToken(token)
      req.user = await User.findById(payload.id).select('-passwordHash')
    }
  } catch { /* guest */ }
  next()
}
