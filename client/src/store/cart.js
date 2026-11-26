import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getProductById } from '@/data/products'

// Pure helper: resolve raw cart rows into product+variant details.
// Kept OUTSIDE the store so components can memoize it from the stable
// `items` array — calling it as a Zustand selector would return a new
// array every render and cause an infinite re-render loop (React #185).
export function detailCart(items) {
  return items
    .map((it) => {
      const product = getProductById(it.id)
      const variant = product?.variants.find((v) => v.sku === it.sku)
      if (!product || !variant) return null
      return { ...it, product, variant, lineTotal: variant.price * it.qty }
    })
    .filter(Boolean)
}

export function cartSubtotal(items) {
  return detailCart(items).reduce((n, it) => n + it.lineTotal, 0)
}

// Max units of one product (across its sizes) in a single order. More than
// this needs a separate order — keeps stock fair and limits bulk misuse.
export const MAX_PER_PRODUCT = 7
export const productQty = (items, productId) => items.filter((it) => it.id === productId).reduce((n, it) => n + it.qty, 0)

// Cart holds { id (productId), sku, qty }. Product + variant details are
// resolved from the catalog so the stored cart stays small.
export const useCart = create(
  persist(
    (set, get) => ({
      items: [],
      // Returns how many units were actually added (0 when the limit is reached).
      add: (productId, sku, qty = 1) => {
        const room = MAX_PER_PRODUCT - productQty(get().items, productId)
        const n = Math.max(0, Math.min(qty, room))
        if (n === 0) return 0
        set((s) => {
          const i = s.items.findIndex((it) => it.id === productId && it.sku === sku)
          if (i > -1) {
            const items = [...s.items]
            items[i] = { ...items[i], qty: items[i].qty + n }
            return { items }
          }
          return { items: [...s.items, { id: productId, sku, qty: n }] }
        })
        return n
      },
      // Returns false when the requested qty would break the per-product limit.
      setQty: (productId, sku, qty) => {
        const items = get().items
        const current = items.find((it) => it.id === productId && it.sku === sku)?.qty || 0
        const others = productQty(items, productId) - current
        const next = Math.max(1, Math.min(qty, MAX_PER_PRODUCT - others))
        set({ items: items.map((it) => (it.id === productId && it.sku === sku ? { ...it, qty: next } : it)) })
        return next === qty
      },
      remove: (productId, sku) =>
        set((s) => ({ items: s.items.filter((it) => !(it.id === productId && it.sku === sku)) })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((n, it) => n + it.qty, 0),
      // Non-reactive derived reads (safe via get(); do NOT use as selectors).
      detailed: () => detailCart(get().items),
      subtotal: () => cartSubtotal(get().items),
    }),
    { name: 'pawstore-cart' }
  )
)
