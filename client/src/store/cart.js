import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getProductById } from '@/data/products'

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
      detailed: () =>
        get()
          .items.map((it) => {
            const product = getProductById(it.id)
            const variant = product?.variants.find((v) => v.sku === it.sku)
            if (!product || !variant) return null
            return { ...it, product, variant, lineTotal: variant.price * it.qty }
          })
          .filter(Boolean),
      subtotal: () => get().detailed().reduce((n, it) => n + it.lineTotal, 0),
    }),
    { name: 'pawstore-cart' }
  )
)
