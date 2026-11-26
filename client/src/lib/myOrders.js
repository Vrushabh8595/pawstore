import { useEffect, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
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

// The signed-in customer's orders, always from the server so status changes
// made by the admin (confirmed, shipped, cancelled…) show up. Orders this
// browser placed while the server didn't recognise the login are linked to
// the account automatically (order no. + delivery phone as proof).
export function useMyOrders() {
  const user = useAuth((s) => s.user)
  const local = useOrders((s) => s.orders)
  const qc = useQueryClient()
  const uid = user?.id || user?._id
  const key = ['my-orders', uid]
  // Last result is cached on the device so the list (or "No orders yet")
  // appears instantly, then refreshes from the server in the background.
  const cacheKey = `animalveda-myorders-${uid}`
  const q = useQuery({
    queryKey: key,
    queryFn: async () => {
      const data = await api.get('/orders/my')
      try { localStorage.setItem(cacheKey, JSON.stringify(data)) } catch { /* ignore */ }
      return data
    },
    enabled: !!user,
    initialData: () => { try { return JSON.parse(localStorage.getItem(cacheKey) || 'null') ?? undefined } catch { return undefined } },
    initialDataUpdatedAt: 0, // always refresh cached data
    staleTime: 0, refetchOnWindowFocus: true, refetchInterval: 60_000,
  })
  const server = (q.data || []).map(normOrder)
  const seen = new Set(server.map((o) => o.orderNo))
  const localOnly = local.filter((o) => o.email === user?.email && !seen.has(o.orderNo))

  const tried = useRef(new Set())
  useEffect(() => {
    if (!q.isSuccess) return
    const claim = localOnly
      .filter((o) => !tried.current.has(o.orderNo) && /^\d{10}$/.test(o.address?.phone || ''))
      .map((o) => ({ orderNo: o.orderNo, phone: o.address.phone }))
    if (!claim.length) return
    claim.forEach((c) => tried.current.add(c.orderNo))
    api.post('/orders/claim', { orders: claim })
      .then((r) => { if (r?.linked) qc.invalidateQueries({ queryKey: key }) })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.isSuccess, q.dataUpdatedAt, localOnly.length])

  const orders = [...server, ...localOnly.map(normOrder)].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  return { orders, isLoading: q.isLoading && !localOnly.length, isError: q.isError && !q.data, refetch: q.refetch }
}
