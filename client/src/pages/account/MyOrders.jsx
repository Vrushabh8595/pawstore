import { Link } from 'react-router-dom'
import { Package, ChevronRight } from 'lucide-react'
import { inr } from '@/lib/format'
import { useMyOrders } from '@/lib/myOrders'
import StatusBadge from '@/components/StatusBadge'

export default function MyOrders() {
  const { orders, isLoading } = useMyOrders()

  return (
    <div className="min-w-0">
      <h1 className="text-2xl sm:text-3xl mb-4 sm:mb-5">My Orders</h1>
      {isLoading ? (
        <div className="space-y-3">{[0, 1].map((i) => <div key={i} className="card h-24 animate-pulse bg-white" />)}</div>
      ) : orders.length === 0 ? (
        <div className="card p-10 text-center text-ink-500">
          <Package size={40} className="mx-auto mb-3 text-brand-400" />
          No orders yet. <Link to="/products" className="text-brand-600 font-semibold">Start shopping</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.orderNo} to={`/account/orders/${o.orderNo}`}
              className="card p-3.5 sm:p-4 flex items-center gap-3 sm:gap-4 hover:border-brand-300 transition min-w-0">
              <span className="hidden min-[380px]:grid place-items-center w-11 h-11 rounded-xl bg-brand-50 text-brand-600 shrink-0"><Package size={20} /></span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-x-2 gap-y-1 flex-wrap">
                  <span className="font-bold text-sm sm:text-base">{o.orderNo}</span>
                  <StatusBadge status={o.status} />
                </div>
                <p className="text-sm text-ink-500 truncate mt-0.5">{o.items.map((i) => `${i.name} ×${i.qty}`).join(', ')}</p>
                <div className="flex items-center justify-between gap-2 mt-0.5">
                  <p className="text-xs text-ink-500">{new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  <span className="font-extrabold text-sm sm:text-base shrink-0">{inr(o.total)}</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-ink-500 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
