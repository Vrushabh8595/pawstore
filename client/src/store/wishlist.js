import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useWishlist = create(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (productId) =>
        set((s) => ({
          ids: s.ids.includes(productId) ? s.ids.filter((id) => id !== productId) : [...s.ids, productId],
        })),
      has: (productId) => get().ids.includes(productId),
      clear: () => set({ ids: [] }),
    }),
    { name: 'pawstore-wishlist' }
  )
)
