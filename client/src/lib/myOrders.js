import { useQuery } from '@tanstack/react-query'
import { api } from './api'
import { useOrders } from '@/store/orders'
import { useAuth } from '@/store/auth'

// Normalise server + locally-saved orders into one shape
export const normOrder = (o) => ({
  ...o,
  address: o.address || o.shippingAddress || {},
  items: (o.items || []).map((i) => ({ ...i, sku: i.sku || i.variantSku })),
  createdAt: o.createdAt,
})

// The signed-in customer's orders: from the server, plus any order saved only
// in this browser (offline fallback) that belongs to the same email.
export function useMyOrders() {
  const user = useAuth((s) => s.user)
  const local = useOrders((s) => s.orders)
  const q = useQuery({ queryKey: ['my-orders', user?.id || user?._id], queryFn: () => api.get('/orders/my'), enabled: !!user, staleTime: 15_000 })
  const server = (q.data || []).map(normOrder)
  const seen = new Set(server.map((o) => o.orderNo))
  const extra = local.filter((o) => o.email === user?.email && !seen.has(o.orderNo)).map(normOrder)
  const orders = [...server, ...extra].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return { orders, isLoading: q.isLoading, isError: q.isError }
}
