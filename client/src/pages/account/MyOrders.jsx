import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import { useOrders } from '@/store/orders'
import { useAuth } from '@/store/auth'
import { inr } from '@/lib/format'
import StatusBadge from '@/components/StatusBadge'

export default function MyOrders() {
  const email = useAuth((s) => s.user?.email)
  const orders = useOrders((s) => s.orders).filter((o) => o.email === email || o.email === 'demo@animalveda.com')

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-5">My Orders</h1>
      {orders.length === 0 ? (
        <div className="card p-12 text-center text-ink-500">
          <Package size={40} className="mx-auto mb-3" />
          No orders yet. <Link to="/products" className="text-brand-600 font-semibold">Start shopping</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.orderNo} to={`/account/orders/${o.orderNo}`} className="card p-4 flex items-center gap-4 hover:border-brand-300 transition">
              <span className="grid place-items-center w-12 h-12 rounded-xl bg-brand-50 text-brand-600 shrink-0"><Package size={22} /></span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold">{o.orderNo}</span>
                  <StatusBadge status={o.status} />
                </div>
                <p className="text-sm text-ink-500 truncate">{o.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}</p>
                <p className="text-xs text-ink-500">{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <span className="font-extrabold">{inr(o.total)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
