import { Link } from 'react-router-dom'
import { IndianRupee, ShoppingBag, Clock, Package } from 'lucide-react'
import { useOrders } from '@/store/orders'
import { products } from '@/data/products'
import { inr } from '@/lib/format'
import StatusBadge, { PaymentBadge } from '@/components/StatusBadge'

export default function Overview() {
  const orders = useOrders((s) => s.orders)
  const today = new Date().toDateString()
  const todays = orders.filter((o) => new Date(o.createdAt).toDateString() === today)
  const pending = orders.filter((o) => o.payment.status === 'pending_verification')
  const revenue = orders.filter((o) => o.payment.status === 'paid').reduce((n, o) => n + o.total, 0)

  const stats = [
    [ShoppingBag, "Today's orders", todays.length, 'text-blue-600 bg-blue-50'],
    [Clock, 'Pending verification', pending.length, 'text-amber-600 bg-amber-50'],
    [IndianRupee, 'Verified revenue', inr(revenue), 'text-green-600 bg-green-50'],
    [Package, 'Active products', products.length, 'text-violet-600 bg-violet-50'],
  ]

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-1">Overview</h1>
      <p className="text-ink-500 text-sm mb-6">Dummy data — connects to <code>GET /admin/stats</code> later.</p>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {stats.map(([Icon, label, value, cls]) => (
          <div key={label} className="card p-5">
            <span className={`grid place-items-center w-11 h-11 rounded-xl mb-3 ${cls}`}><Icon size={22} /></span>
            <p className="text-2xl font-extrabold">{value}</p>
            <p className="text-sm text-ink-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="font-extrabold text-lg">Recent orders</h2>
        <Link to="/admin/orders" className="text-brand-600 font-bold text-sm">View all</Link>
      </div>
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-ink-50 text-left text-ink-500">
            <tr><Th>Order</Th><Th>Customer</Th><Th>Total</Th><Th>Payment</Th><Th>Status</Th></tr>
          </thead>
          <tbody>
            {orders.slice(0, 6).map((o) => (
              <tr key={o.orderNo} className="border-t border-[#f0f0ec]">
                <Td><Link to="/admin/orders" className="font-bold text-brand-600">{o.orderNo}</Link></Td>
                <Td>{o.customer}</Td>
                <Td className="font-semibold">{inr(o.total)}</Td>
                <Td><PaymentBadge payment={o.payment} /></Td>
                <Td><StatusBadge status={o.status} /></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const Th = ({ children }) => <th className="px-4 py-3 font-semibold">{children}</th>
const Td = ({ children, className = '' }) => <td className={`px-4 py-3 ${className}`}>{children}</td>
