import { Router } from 'express'
import { z } from 'zod'
import { Cart } from '../models/index.js'
import { authenticate } from '../middleware/auth.js'
import { asyncHandler, validate } from '../middleware/error.js'

const router = Router()
router.use(authenticate)

const load = async (userId) =>
  (await Cart.findOne({ user: userId }).populate('items.product')) || (await Cart.create({ user: userId, items: [] }))

router.get('/', asyncHandler(async (req, res) => res.json(await load(req.user._id))))

const itemSchema = z.object({ product: z.string(), variantSku: z.string(), qty: z.number().int().min(1).default(1) })

router.post(
  '/',
  validate(itemSchema),
  asyncHandler(async (req, res) => {
    const { product, variantSku, qty } = req.body
    const cart = await load(req.user._id)
    const existing = cart.items.find((i) => String(i.product?._id || i.product) === product && i.variantSku === variantSku)
    if (existing) existing.qty += qty
    else cart.items.push({ product, variantSku, qty })
    await cart.save()
    res.json(await cart.populate('items.product'))
  })
)

router.patch(
  '/',
  validate(itemSchema),
  asyncHandler(async (req, res) => {
    const { product, variantSku, qty } = req.body
    const cart = await load(req.user._id)
    const item = cart.items.find((i) => String(i.product?._id || i.product) === product && i.variantSku === variantSku)
    if (item) item.qty = qty
    cart.items = cart.items.filter((i) => i.qty > 0)
    await cart.save()
    res.json(await cart.populate('items.product'))
  })
)

router.delete(
  '/:product/:variantSku',
  asyncHandler(async (req, res) => {
    const cart = await load(req.user._id)
    cart.items = cart.items.filter(
      (i) => !(String(i.product?._id || i.product) === req.params.product && i.variantSku === req.params.variantSku)
    )
    await cart.save()
    res.json(cart)
  })
)

export default router
