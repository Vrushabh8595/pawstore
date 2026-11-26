import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { z } from 'zod'
import { ProductRequest } from '../models/index.js'
import { asyncHandler, validate } from '../middleware/error.js'

const router = Router()

// Public endpoint — throttle to stop spam.
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false })

const photo = z.string().regex(/^data:image\/(jpeg|png|webp);base64,/, 'Invalid image').max(700_000, 'Image too large')
const str = (max) => z.string().trim().max(max).optional().default('')

const schema = z
  .object({
    need: str(40),
    animal: str(40),
    animalOther: str(60),
    product: str(160),
    brand: str(120),
    strength: str(120),
    quantity: str(60),
    details: str(2000),
    urgency: z.enum(['Normal', 'Urgent']).default('Normal'),
    photos: z.array(photo).max(3).default([]),
    name: z.string().trim().min(1).max(80),
    phone: z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit phone'),
    city: str(80),
    pincode: z.string().regex(/^(\d{6})?$/, 'Invalid pincode').optional().default(''),
    contactVia: z.enum(['WhatsApp', 'Call']).default('WhatsApp'),
  })
  .refine((d) => d.product || d.photos.length, { message: 'Add a product name or a photo', path: ['product'] })

const makeRef = () => 'AV' + Date.now().toString(36).toUpperCase().slice(-5) + Math.floor(Math.random() * 36).toString(36).toUpperCase()

router.post(
  '/',
  limiter,
  validate(schema),
  asyncHandler(async (req, res) => {
    const doc = await ProductRequest.create({ ...req.body, ref: makeRef() })
    res.status(201).json({ request: { ref: doc.ref, status: doc.status } })
  })
)

export default router
