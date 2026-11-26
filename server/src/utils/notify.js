import { Notification, User } from '../models/index.js'
import { sendMail } from './mailer.js'

// Creates the in-app notification + sends the emails for order events.
// Everything here is best-effort: a failed email never breaks the order flow.

const ADMIN_EMAIL = () => process.env.ADMIN_NOTIFY_EMAIL || 'gulhanev33@gmail.com'
const SITE = () => (process.env.SITE_URL || (process.env.CLIENT_ORIGIN || '').split(',')[0] || 'https://animalveda.com').trim().replace(/\/+$/, '')
const inr = (n) => '₹' + Number(n || 0).toLocaleString('en-IN')
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const payLabel = (o) => (o.payment?.method === 'COD' ? 'Cash on delivery' : 'UPI')

const STATUS_COPY = {
  Confirmed: ['Your order is confirmed', 'Great news! We have confirmed your order and are getting it ready.'],
  Packed: ['Your order is packed', 'Your order is packed and will be handed to our delivery partner soon.'],
  Shipped: ['Your order has shipped', 'Your order is on its way.'],
  'Out for Delivery': ['Out for delivery today', 'Your order is out for delivery. Please keep your phone handy.'],
  Delivered: ['Delivered, enjoy!', 'Your order has been delivered. We hope your pet loves it!'],
  Cancelled: ['Your order was cancelled', 'Your order has been cancelled. If you paid by UPI, the refund reaches your account in 5 to 7 working days.'],
  Returned: ['Return received', 'We have received your return. Any refund due will be processed in 5 to 7 working days.'],
  'Payment Rejected': ['We could not verify your payment', 'We could not verify your UPI payment. Please contact us so we can sort it out.'],
}
export const statusCopy = (s) => STATUS_COPY[s] || [`Order update: ${s}`, `Your order status is now “${s}”.`]

export async function customerEmailOf(order) {
  if (order.guestEmail) return order.guestEmail
  if (order.user?.email) return order.user.email
  if (order.user) return (await User.findById(order.user).select('email').lean())?.email
  return null
}

function itemsTable(order) {
  return (order.items || []).map((i) => `
    <tr>
      <td style="padding:8px 0;width:56px;vertical-align:top">${i.image ? `<img src="${esc(i.image)}" width="48" height="48" alt="" style="border-radius:8px;object-fit:cover;border:1px solid #eee;display:block">` : ''}</td>
      <td style="padding:8px 8px;vertical-align:top;font-size:14px;color:#1a3450">${esc(i.name)}<br><span style="color:#6b7280;font-size:12px">${esc(i.size || '')} × ${i.qty}</span></td>
      <td style="padding:8px 0;vertical-align:top;text-align:right;font-size:14px;font-weight:700;color:#1a3450;white-space:nowrap">${inr(i.price * i.qty)}</td>
    </tr>`).join('')
}

export function emailLayout({ heading, intro, order, cta, ctaUrl, badge }) {
  const a = order.shippingAddress || {}
  return `<!doctype html><html><body style="margin:0;background:#faf6ef;font-family:Arial,Helvetica,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf6ef;padding:24px 12px"><tr><td align="center">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #f0e6d6">
    <tr><td style="background:#1a3450;padding:18px 24px"><img src="${SITE()}/email-logo.png" alt="AnimalVeda" height="30" style="display:block;height:30px;width:auto"></td></tr>
    <tr><td style="padding:24px">
      ${badge ? `<span style="display:inline-block;background:#fff1e6;color:#c2410c;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px">${esc(badge)}</span>` : ''}
      <h1 style="font-family:Georgia,serif;color:#1a3450;font-size:22px;margin:12px 0 6px">${esc(heading)}</h1>
      <p style="color:#4b5563;font-size:14px;line-height:1.55;margin:0 0 16px">${intro}</p>
      <p style="font-size:13px;color:#6b7280;margin:0 0 4px">Order <b style="color:#1a3450">${esc(order.orderNo)}</b> · ${payLabel(order)}</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #f1f1f1;border-bottom:1px solid #f1f1f1;margin:8px 0">${itemsTable(order)}</table>
      <table width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;color:#4b5563">
        <tr><td>Subtotal</td><td align="right">${inr(order.subtotal)}</td></tr>
        <tr><td>Delivery</td><td align="right">${order.shippingFee ? inr(order.shippingFee) : 'Free'}</td></tr>
        ${order.codFee ? `<tr><td>COD fee</td><td align="right">${inr(order.codFee)}</td></tr>` : ''}
        <tr><td style="padding-top:6px;font-size:15px;font-weight:700;color:#1a3450">Total</td><td align="right" style="padding-top:6px;font-size:15px;font-weight:700;color:#1a3450">${inr(order.total)}</td></tr>
      </table>
      <p style="font-size:13px;color:#4b5563;margin:16px 0 0;line-height:1.5"><b style="color:#1a3450">Deliver to</b><br>${esc(a.name)} · ${esc(a.phone)}<br>${esc(a.line1)}, ${esc(a.city)}${a.state ? ', ' + esc(a.state) : ''}, ${esc(a.pincode)}</p>
      ${cta ? `<p style="margin:22px 0 4px"><a href="${ctaUrl}" style="background:#f97316;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:999px;display:inline-block">${esc(cta)}</a></p>` : ''}
    </td></tr>
    <tr><td style="background:#fff7ed;padding:14px 24px;font-size:12px;color:#6b7280">AnimalVeda · Open 24×7 · Questions? Just reply to this email.</td></tr>
  </table></td></tr></table></body></html>`
}

export async function notifyNewOrder(order) {
  try {
    const first = order.items?.[0]
    const count = order.items?.reduce((n, i) => n + i.qty, 0) || 0
    await Notification.create({
      audience: 'admin', type: 'new_order', orderNo: order.orderNo, amount: order.total, image: first?.image, status: order.status,
      title: `New order ${order.orderNo} · ${inr(order.total)}`,
      body: `${order.customerName || order.shippingAddress?.name || 'Customer'} · ${count} item${count === 1 ? '' : 's'} · ${payLabel(order)} · ${order.shippingAddress?.city || ''}`,
    })
    const to = await customerEmailOf(order)
    const link = order.user ? `${SITE()}/account/orders/${order.orderNo}` : SITE()
    await Promise.all([
      sendMail({
        to: ADMIN_EMAIL(),
        subject: `🛒 New order ${order.orderNo}: ${inr(order.total)} (${payLabel(order)})`,
        html: emailLayout({ badge: 'New order', heading: `New order from ${order.customerName || 'a customer'}`, intro: `${count} item${count === 1 ? '' : 's'} · ${payLabel(order)}${to ? ` · ${esc(to)}` : ''}`, order, cta: 'Open in admin', ctaUrl: `${SITE()}/admin/orders` }),
      }),
      to && sendMail({
        to,
        subject: `Order ${order.orderNo} received, thank you! 🐾`,
        html: emailLayout({ badge: 'Order placed', heading: `Thanks, ${(order.customerName || '').split(' ')[0] || 'friend'}! Your order is in.`, intro: 'We have received your order and will confirm it shortly. You will get an email at every step.', order, cta: order.user ? 'Track your order' : 'Visit AnimalVeda', ctaUrl: link }),
      }),
    ])
  } catch (e) {
    console.error('[notify] new order:', e.message)
  }
}

export async function notifyStatus(order, note) {
  try {
    const [title, text] = statusCopy(order.status)
    if (order.user) {
      await Notification.create({
        audience: 'user', user: order.user._id || order.user, type: 'status', orderNo: order.orderNo, status: order.status,
        amount: order.total, image: order.items?.[0]?.image, title, body: note ? `${text} Note: ${note}` : text,
      })
    }
    const to = await customerEmailOf(order)
    if (to) {
      await sendMail({
        to,
        subject: `${title} · ${order.orderNo}`,
        html: emailLayout({ badge: order.status, heading: title, intro: esc(text) + (note ? `<br><br><b>Note from us:</b> ${esc(note)}` : ''), order, cta: order.user ? 'View order' : 'Visit AnimalVeda', ctaUrl: order.user ? `${SITE()}/account/orders/${order.orderNo}` : SITE() }),
      })
    }
  } catch (e) {
    console.error('[notify] status:', e.message)
  }
}
