import { Router } from 'express'
import { Product, Category } from '../models/index.js'
import { asyncHandler } from '../middleware/error.js'

const router = Router()

// GET /products?cat=&q=&lifeStage=&breedSize=&foodType=&diet=&sort=&page=&limit=
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { cat, q, lifeStage, breedSize, foodType, diet, sort = 'popular', page = 1, limit = 12 } = req.query
    const filter = { isActive: true }
    if (cat) filter.category = cat
    if (lifeStage) filter.lifeStage = { $in: [].concat(lifeStage) }
    if (breedSize) filter.breedSize = { $in: [].concat(breedSize) }
    if (foodType) filter.foodType = { $in: [].concat(foodType) }
    if (diet) filter.diet = { $in: [].concat(diet) }
    if (q) filter.$text = { $search: q }

    const sortMap = {
      popular: { reviews: -1 },
      rating: { rating: -1 },
      'price-asc': { 'variants.0.price': 1 },
      'price-desc': { 'variants.0.price': -1 },
    }

    const skip = (Number(page) - 1) * Number(limit)
    const [items, total] = await Promise.all([
      Product.find(filter).sort(sortMap[sort] || sortMap.popular).skip(skip).limit(Number(limit)),
      Product.countDocuments(filter),
    ])
    res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
  })
)

router.get(
  '/categories',
  asyncHandler(async (req, res) => {
    res.json(await Category.find().sort('name'))
  })
)

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug, isActive: true })
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json(product)
  })
)

export default router
