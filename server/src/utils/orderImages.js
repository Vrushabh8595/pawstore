import { Product } from '../models/index.js'

// Older orders were saved without product images — fill them in from the catalogue.
export async function withImages(orders) {
  const missing = new Set()
  for (const o of orders) for (const i of o.items || []) if (!i.image && i.product) missing.add(String(i.product))
  if (missing.size) {
    const prods = await Product.find({ _id: { $in: [...missing] } }).select('images slug').lean()
    const map = new Map(prods.map((p) => [String(p._id), p]))
    for (const o of orders) for (const i of o.items || []) {
      const p = map.get(String(i.product))
      if (p) { i.image = i.image || p.images?.[0]; i.slug = i.slug || p.slug }
    }
  }
  return orders
}
