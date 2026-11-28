import { Order } from '../models/index.js'

// Store coupons. Codes are matched without caring about upper/lower case.
export const COUPONS = {
  NEWANIMALVEDA: { code: 'NewAnimalVeda', percent: 5, firstOrderOnly: true, label: '5% off your first order' },
}

const NOT_COUNTED = ['Cancelled', 'Payment Rejected'] // these don't use up a "first order"
const clean = (s) => String(s || '').trim().toUpperCase().replace(/\s+/g, '')

// Is this a first order? Checks the account, the email and the delivery phone,
// so the same person can't reuse the code as a guest.
async function hasOrdered({ user, email, phone }) {
  const or = []
  if (user?._id) or.push({ user: user._id })
  const mail = (email || user?.email || '').toLowerCase()
  if (mail) or.push({ guestEmail: mail })
  if (phone) or.push({ 'shippingAddress.phone': phone })
  if (user?.phone) or.push({ 'shippingAddress.phone': user.phone })
  if (!or.length) return false
  return !!(await Order.exists({ $or: or, status: { $nin: NOT_COUNTED } }))
}

// → { coupon: { code, percent, discount, label } } or { error }
export async function evaluateCoupon({ code, subtotal, user, email, phone }) {
  const c = COUPONS[clean(code)]
  if (!c) return { error: 'This coupon code isn’t valid.' }
  if (c.firstOrderOnly && (await hasOrdered({ user, email, phone })))
    return { error: `${c.code} is only for your first order.` }
  const discount = Math.round((Math.max(0, Number(subtotal) || 0) * c.percent) / 100)
  return { coupon: { code: c.code, percent: c.percent, discount, label: c.label } }
}
