import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Dummy order store. In production, orders are created server-side
// (POST /orders) which recalculates totals and reduces stock. Here we keep
// them in localStorage so the user + admin dashboards have data to show.

// Orders placed in this browser (kept as an offline fallback / receipt).
// The account pages read the real list from the server (GET /orders/my).
const DEMO = /^demo@/
export const useOrders = create(
  persist(
    (set, get) => ({
      orders: [],
      place: (order) => set((s) => ({ orders: [order, ...s.orders] })),
      updateStatus: (orderNo, status, note) =>
        set((s) => ({
          orders: s.orders.map((o) =>
            o.orderNo === orderNo
              ? { ...o, status, statusHistory: [...o.statusHistory, { status, at: Date.now(), note }] }
              : o
          ),
        })),
      verifyPayment: (orderNo, action) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.orderNo !== orderNo) return o
            const paid = action === 'approve'
            return {
              ...o,
              payment: { ...o.payment, status: paid ? 'paid' : 'rejected' },
              status: paid ? 'Confirmed' : 'Payment Rejected',
              statusHistory: [
                ...o.statusHistory,
                { status: paid ? 'Confirmed' : 'Payment Rejected', at: Date.now(), note: paid ? 'Payment verified' : 'Payment rejected' },
              ],
            }
          }),
        })),
      byEmail: (email) => get().orders.filter((o) => o.email === email),
      get: (orderNo) => get().orders.find((o) => o.orderNo === orderNo),
    }),
    { name: 'pawstore-orders', version: 2, migrate: (st) => ({ ...st, orders: (st?.orders || []).filter((o) => !DEMO.test(o.email || '')) }) }
  )
)
