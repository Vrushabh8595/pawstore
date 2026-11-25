import { Router } from 'express'
import { z } from 'zod'
import { Wishlist } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler, validate } from '../middleware/error.js'

const router = Router()
router.use(authenticate)

const load = async (userId) =>
  (await Wishlist.findOne({ user: userId }).populate('products')) || (await Wishlist.create({ user: userId, products: [] }))

router.get('/', asyncHandler(async (req, res) => res.json(await load(req.user._id))))

router.post(
  '/toggle',
  validate(z.object({ product: z.string() })),
  asyncHandler(async (req, res) => {
    const wl = await load(req.user._id)
    const id = req.body.product
    const has = wl.products.some((p) => String(p?._id || p) === id)
    wl.products = has ? wl.products.filter((p) => String(p?._id || p) !== id) : [...wl.products, id]
    await wl.save()
    res.json(await wl.populate('products'))
  })
)

export default router
