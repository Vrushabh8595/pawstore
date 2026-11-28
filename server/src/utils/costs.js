import { Product, ProductCost, OrderCost } from '../models/index.js'

const num = (v) => (Number.isFinite(Number(v)) && Number(v) >= 0 ? Math.round(Number(v) * 100) / 100 : 0)

// productId -> { courierCharge, bySku: { sku: costPrice } }
export async function costMap(productIds) {
  const ids = [...new Set(productIds.filter(Boolean).map(String))]
  if (!ids.length) return new Map()
  const rows = await ProductCost.find({ product: { $in: ids } }).lean()
  return new Map(rows.map((r) => [String(r.product), { courierCharge: r.courierCharge || 0, dummy: !!r.dummy, bySku: Object.fromEntries((r.variants || []).map((v) => [v.sku, v.costPrice || 0])) }]))
}

// Cost of one order's items with the given cost map
export function costOfItems(items = [], map) {
  let goodsCost = 0, courierCost = 0, missing = false
  const lines = items.map((it) => {
    const c = map.get(String(it.product))
    const costPrice = c?.bySku?.[it.variantSku]
    const courierCharge = c?.courierCharge ?? 0
    if (!c || !(costPrice > 0)) missing = true
    goodsCost += (costPrice || 0) * (it.qty || 0)
    courierCost += courierCharge * (it.qty || 0)
    return { product: it.product, sku: it.variantSku, qty: it.qty, costPrice: costPrice || 0, courierCharge }
  })
  return { goodsCost, courierCost, lines, missing }
}

// Snapshot what this order cost us. Never blocks or fails checkout.
export async function recordOrderCost(order) {
  try {
    const map = await costMap(order.items.map((i) => i.product))
    const c = costOfItems(order.items, map)
    await OrderCost.updateOne(
      { order: order._id },
      { $set: { orderNo: order.orderNo, orderedAt: order.createdAt || new Date(), ...c } },
      { upsert: true }
    )
  } catch (e) {
    console.error('[costs] order', order?.orderNo, e.message)
  }
}

// Admin product payload -> cost doc fields (and the product fields without costs)
export function splitCosts(body = {}) {
  const { courierCharge, costDummy, ...rest } = body
  const variants = Array.isArray(rest.variants) ? rest.variants : null
  const costs = variants ? variants.filter((v) => v?.sku).map((v) => ({ sku: String(v.sku), costPrice: num(v.costPrice) })) : null
  if (variants) rest.variants = variants.map(({ costPrice, ...v }) => v)
  const hasCosts = courierCharge !== undefined || (variants && variants.some((v) => v && v.costPrice !== undefined && v.costPrice !== ''))
  return { product: rest, costs: hasCosts ? { courierCharge: num(courierCharge), variants: costs || [] } : null }
}

export async function saveCosts(productId, costs) {
  if (!costs) return
  await ProductCost.updateOne({ product: productId }, { $set: { ...costs, dummy: false } }, { upsert: true })
}

// Attach costs to products for the admin product list
export async function withCosts(products) {
  const map = await costMap(products.map((p) => p._id))
  return products.map((p) => {
    const c = map.get(String(p._id))
    return {
      ...p,
      courierCharge: c ? c.courierCharge : '',
      costDummy: c?.dummy || false,
      variants: (p.variants || []).map((v) => ({ ...v, costPrice: c?.bySku?.[v.sku] ?? '' })),
    }
  })
}

// Sample cost prices for products that existed before costs were tracked, so
// the profit & loss page has numbers to show. Marked `dummy` so the admin can
// see which ones still need real figures. Runs once (only while no costs exist).
export async function seedDummyCosts() {
  try {
    if (await ProductCost.exists({})) return
    const products = await Product.find({}).select('variants').lean()
    if (!products.length) return
    const courierFor = (price) => (price < 300 ? 45 : price < 800 ? 60 : price < 1500 ? 80 : price < 3000 ? 110 : 150)
    const docs = products.map((p) => {
      const top = Math.max(0, ...(p.variants || []).map((v) => v.price || 0))
      return {
        product: p._id,
        courierCharge: courierFor(top),
        variants: (p.variants || []).map((v) => ({ sku: v.sku, costPrice: Math.round((v.price || 0) * 0.68) })),
        dummy: true,
      }
    })
    await ProductCost.insertMany(docs, { ordered: false })
    console.log(`✓ Added sample costs for ${docs.length} products`)
  } catch (e) {
    console.error('[costs] seed', e.message)
  }
}
