import { Router } from 'express'
import { z } from 'zod'
import { Notification } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler, validate } from '../middleware/error.js'

// In-app notifications. Admins see store-wide alerts (new orders);
// customers see updates about their own orders.
const router = Router()
router.use(authenticate)

const scope = (req) => (req.user.role === 'admin' ? { audience: 'admin' } : { audience: 'user', user: req.user._id })

// GET /notifications?since=ISO — latest 30 + unread count (polled every ~15 s)
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = scope(req)
    const since = req.query.since ? new Date(String(req.query.since)) : null
    const [items, unread] = await Promise.all([
      Notification.find(since && !isNaN(since) ? { ...filter, createdAt: { $gt: since } } : filter).sort('-createdAt').limit(30).lean(),
      Notification.countDocuments({ ...filter, read: false }),
    ])
    res.json({ items, unread, now: new Date() })
  })
)

// POST /notifications/read { ids?: [] } — no ids = mark all read
router.post(
  '/read',
  validate(z.object({ ids: z.array(z.string().regex(/^[a-f0-9]{24}$/)).max(100).optional() })),
  asyncHandler(async (req, res) => {
    const filter = { ...scope(req), read: false, ...(req.body.ids?.length ? { _id: { $in: req.body.ids } } : {}) }
    const r = await Notification.updateMany(filter, { $set: { read: true } })
    res.json({ updated: r.modifiedCount })
  })
)

export default router
