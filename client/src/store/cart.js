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

// Cart holds { id (productId), sku, qty }. Product + variant details are
// resolved from the catalog so the stored cart stays small.
export const useCart = create(
  persist(
    (set, get) => ({
      items: [],
      add: (productId, sku, qty = 1) =>
        set((s) => {
          const i = s.items.findIndex((it) => it.id === productId && it.sku === sku)
          if (i > -1) {
            const items = [...s.items]
            items[i] = { ...items[i], qty: items[i].qty + qty }
            return { items }
          }
          return { items: [...s.items, { id: productId, sku, qty }] }
        }),
      setQty: (productId, sku, qty) =>
        set((s) => ({
          items: s.items
            .map((it) => (it.id === productId && it.sku === sku ? { ...it, qty: Math.max(1, qty) } : it))
            .filter((it) => it.qty > 0),
        })),
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
