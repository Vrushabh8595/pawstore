import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Package } from 'lucide-react'
import { useOrders } from '@/store/orders'
import { inr } from '@/lib/format'

export default function OrderSuccess() {
  const { orderNo } = useParams()
  const order = useOrders((s) => s.get(orderNo))

  return (
    <div className="container-x py-16 max-w-xl text-center">
      <CheckCircle2 size={64} className="mx-auto text-green-500 mb-4" />
      <h1 className="text-3xl font-extrabold">Order placed!</h1>
      <p className="text-ink-500 mt-2">
        Thank you. Your order <b className="text-ink-900">{orderNo}</b> has been received and is
        <b> pending verification</b>. You'll get an update once it's confirmed.
      </p>

      {order && (
        <div className="card p-5 mt-6 text-left">
          <div className="flex items-center gap-2 font-bold mb-3"><Package size={18} className="text-brand-600" /> Summary</div>
          {order.items.map((it) => (
            <div key={it.sku} className="flex justify-between text-sm py-1">
              <span className="text-ink-700">{it.name} · {it.size} × {it.qty}</span>
              <span className="font-semibold">{inr(it.price * it.qty)}</span>
            </div>
          ))}
          <div className="border-t border-[#ecece7] mt-2 pt-2 flex justify-between font-extrabold">
            <span>Total</span><span>{inr(order.total)}</span>
          </div>
          <p className="text-sm text-ink-500 mt-3">
            Payment: {order.payment.method === 'COD' ? 'Cash on Delivery' : `UPI (ref ${order.payment.utr})`}
          </p>
        </div>
      )}

      <div className="flex gap-3 justify-center mt-6">
        <Link to="/account" className="btn-primary">Track order</Link>
        <Link to="/products" className="btn-ghost">Keep shopping</Link>
      </div>
    </div>
  )
}
