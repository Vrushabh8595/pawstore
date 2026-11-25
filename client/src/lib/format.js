export const inr = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0)

export const discountPct = (price, mrp) =>
  mrp && mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0

export const orderNo = () =>
  'ORD' + Date.now().toString().slice(-7) + Math.floor(Math.random() * 90 + 10)

export const SHIPPING_FEE = 59
export const FREE_SHIP_ABOVE = 999
export const COD_FEE = 49

// Business UPI id — replace with a real merchant UPI id before going live.
export const UPI = { id: 'pawstore@upi', payee: 'PawStore' }

export const upiLink = ({ amount, note }) =>
  `upi://pay?pa=${UPI.id}&pn=${encodeURIComponent(UPI.payee)}&am=${Number(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`

export const STATUS_FLOW = [
  'Pending Verification',
  'Confirmed',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
]
