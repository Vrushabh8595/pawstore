import { Link, useParams } from 'react-router-dom'
import { Check } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useOrders } from '@/store/orders'
import { api } from '@/lib/api'
import { normOrder } from '@/lib/myOrders'
import { inr, STATUS_FLOW } from '@/lib/format'
import StatusBadge, { PaymentBadge } from '@/components/StatusBadge'

export default function OrderDetail() {
  const { orderNo } = useParams()
  const local = useOrders((s) => s.get(orderNo))
  const q = useQuery({ queryKey: ['my-order', orderNo], queryFn: () => api.get(`/orders/no/${encodeURIComponent(orderNo)}`), retry: false })
  const order = q.data ? normOrder(q.data) : local ? normOrder(local) : null
  if (q.isLoading && !local) return <div className="card h-40 animate-pulse" />
  if (!order) return <div className="card p-12 text-center text-ink-500">Order not found. <Link to="/account" className="text-brand-600 font-semibold">My orders</Link></div>

  const doneIndex = STATUS_FLOW.indexOf(order.status)
  const rejected = order.status === 'Payment Rejected'

  return (
    <div>
      <Link to="/account" className="text-sm text-brand-600 font-semibold">← All orders</Link>
      <div className="flex items-center gap-3 flex-wrap mt-2 mb-6">
        <h1 className="text-2xl sm:text-3xl break-all">{order.orderNo}</h1>
        <StatusBadge status={order.status} />
        <PaymentBadge payment={order.payment} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div className="space-y-6 min-w-0">
          {/* Timeline */}
          {!rejected && (
            <section className="card p-5">
              <h2 className="font-bold mb-4">Order status</h2>
              <ol className="space-y-4">
                {STATUS_FLOW.map((step, i) => {
                  const done = i <= doneIndex
                  return (
                    <li key={step} className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full grid place-items-center text-xs font-bold ${done ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-500'}`}>
                        {done ? <Check size={15} /> : i + 1}
                      </span>
                      <span className={`text-sm ${done ? 'font-bold text-ink-900' : 'text-ink-500'}`}>{step}</span>
                    </li>
                  )
                })}
              </ol>
            </section>
          )}
          {rejected && (
            <section className="card p-5 bg-red-50 border-red-200">
              <p className="font-bold text-red-700">Payment was rejected</p>
              <p className="text-sm text-red-600 mt-1">The UPI reference couldn't be verified. Please contact support to re-try payment.</p>
            </section>
          )}

          {/* Items */}
          <section className="card p-5">
            <h2 className="font-bold mb-4">Items</h2>
            {order.items.map((it) => (
              <div key={it.sku + it.name} className="flex justify-between text-sm py-1.5 border-b border-[#f0f0ec] last:border-0">
                <span className="text-ink-700 min-w-0 pr-3">{it.name} · {it.size} × {it.qty}</span>
                <span className="font-semibold shrink-0">{inr(it.price * it.qty)}</span>
              </div>
            ))}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-5 text-sm">
            <h2 className="font-bold mb-3">Payment</h2>
            <Row k="Subtotal" v={inr(order.subtotal)} />
            <Row k="Shipping" v={order.shippingFee === 0 ? 'FREE' : inr(order.shippingFee)} />
            {order.codFee > 0 && <Row k="COD fee" v={inr(order.codFee)} />}
            <div className="border-t border-[#ecece7] my-2" />
            <Row k="Total" v={inr(order.total)} bold />
            <p className="text-xs text-ink-500 mt-3">
              {order.payment.method === 'COD' ? 'Cash on Delivery' : `UPI · ref ${order.payment.utr || '—'}`}
            </p>
          </section>
          <section className="card p-5 text-sm">
            <h2 className="font-bold mb-2">Delivery address</h2>
            <p className="text-ink-700">{order.address.name}<br />{order.address.line1}<br />{order.address.city}, {order.address.state} {order.address.pincode}<br />📞 {order.address.phone}</p>
          </section>
        </aside>
      </div>
    </div>
  )
}

function Row({ k, v, bold }) {
  return <div className={`flex justify-between ${bold ? 'font-extrabold text-base' : 'text-ink-700 py-0.5'}`}><span>{k}</span><span>{v}</span></div>
}
