import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Dummy order store. In production, orders are created server-side
// (POST /orders) which recalculates totals and reduces stock. Here we keep
// them in localStorage so the user + admin dashboards have data to show.

const seedOrders = [
  {
    orderNo: 'ORD1000012',
    email: 'demo@animalveda.com',
    customer: 'Demo Customer',
    createdAt: Date.now() - 1000 * 60 * 60 * 26,
    items: [{ name: 'Daily Chicken Adult Dry Food', sku: 'CAD-3', size: '3kg', price: 1399, qty: 1 }],
    subtotal: 1399, shippingFee: 0, codFee: 0, total: 1399,
    payment: { method: 'UPI_MANUAL', status: 'paid', utr: '402311889076' },
    address: { name: 'Demo Customer', phone: '9876543210', line1: '12 Baker Street', city: 'Pune', state: 'MH', pincode: '411001' },
    status: 'Shipped',
    statusHistory: [
      { status: 'Pending Verification', at: Date.now() - 1000 * 60 * 60 * 26 },
      { status: 'Confirmed', at: Date.now() - 1000 * 60 * 60 * 25 },
      { status: 'Packed', at: Date.now() - 1000 * 60 * 60 * 20 },
      { status: 'Shipped', at: Date.now() - 1000 * 60 * 60 * 6 },
    ],
  },
  {
    orderNo: 'ORD1000019',
    email: 'demo@animalveda.com',
    customer: 'Demo Customer',
    createdAt: Date.now() - 1000 * 60 * 90,
    items: [
      { name: 'Training Liver Bites', sku: 'TLB-2', size: '500g', price: 599, qty: 2 },
      { name: 'Veg Dental Sticks', sku: 'VDS-7', size: '7 sticks', price: 249, qty: 1 },
    ],
    subtotal: 1447, shippingFee: 0, codFee: 49, total: 1496,
    payment: { method: 'COD', status: 'cod_pending' },
    address: { name: 'Demo Customer', phone: '9876543210', line1: '12 Baker Street', city: 'Pune', state: 'MH', pincode: '411001' },
    status: 'Pending Verification',
    statusHistory: [{ status: 'Pending Verification', at: Date.now() - 1000 * 60 * 90 }],
  },
]

export const useOrders = create(
  persist(
    (set, get) => ({
      orders: seedOrders,
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
    { name: 'pawstore-orders' }
  )
)
