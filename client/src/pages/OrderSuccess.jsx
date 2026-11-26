import { Link, useLocation, useParams } from 'react-router-dom'
import { playSound } from '@/lib/feedback'
import { Package } from 'lucide-react'
import { useOrders } from '@/store/orders'
import { inr } from '@/lib/format'

export default function OrderSuccess() {
  const { orderNo } = useParams()
  const order = useOrders((s) => s.get(orderNo))
  const animal = useLocation().state?.animal || 'dog'

  return (
    <div className="container-x py-16 max-w-xl text-center">
      <button type="button" onClick={() => playSound('celebrate')} aria-label="Play celebration sound"
        className="relative mx-auto mb-5 grid place-items-center w-28 h-28 rounded-full bg-brand-100 ring-8 ring-brand-50 animate-pop active:scale-90 transition">
        <span className="text-6xl animate-float" style={{ '--r': '0deg' }}>{animal === 'cat' ? '🐱' : '🐶'}</span>
        <span className="absolute -top-2 -right-6 bg-pine-800 text-white text-xs font-extrabold px-2.5 py-1 rounded-full rounded-bl-none shadow-lg"
          style={{ animation: 'fade-up .5s .35s both' }}>Yay! 🎉</span>
      </button>
      <h1 className="text-3xl sm:text-4xl">Order placed!</h1>
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
