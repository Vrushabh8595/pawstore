import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { IndianRupee, ShoppingBag, Users, Radio, Eye, Clock, XCircle, Inbox, TrendingUp, Percent, RefreshCw } from 'lucide-react'
import { api } from '@/lib/api'
import { inr } from '@/lib/format'
import StatusBadge, { PaymentBadge } from '@/components/StatusBadge'
import { PageHead, Stat, Panel, BarLineChart, HBars, OutcomeRing, Loading, ErrorBox, fmtNum, timeAgo, custName } from './ui'

export default function Overview() {
  const q = useQuery({ queryKey: ['admin-dashboard'], queryFn: () => api.get('/admin/dashboard'), refetchInterval: 30_000 })
  if (q.isLoading) return <Loading label="Loading dashboard…" />
  if (q.isError) return <ErrorBox error={q.error} />
  const d = q.data
  const last7 = d.series.slice(-7)
  const sum = (k, arr = last7) => arr.reduce((n, x) => n + (x[k] || 0), 0)

  return (
    <div>
      <PageHead title="Dashboard" sub={`Updated ${timeAgo(q.dataUpdatedAt)} · refreshes every 30s`}
        right={<button onClick={() => q.refetch()} className="btn-ghost !py-2 !px-3.5 text-sm"><RefreshCw size={15} className={q.isFetching ? 'animate-spin' : ''} /> Refresh</button>} />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <Stat icon={IndianRupee} tone="green" label="Revenue (successful orders)" value={inr(d.revenue)} hint={`${inr(d.pendingAmount)} still pending`} />
        <Stat icon={ShoppingBag} tone="orange" label="Orders today" value={fmtNum(d.ordersToday)} hint={`${fmtNum(sum('orders'))} in last 7 days`} />
        <Stat icon={Users} tone="navy" label="Registered users" value={fmtNum(d.users)} hint={`+${fmtNum(d.newUsers7)} this week`} />
        <Stat icon={Radio} tone="green" label="Live on site now" value={fmtNum(d.live)} hint="Active in last 2 minutes" live />
        <Stat icon={Eye} tone="blue" label="Visitors today" value={fmtNum(d.visitorsToday)} hint={`${fmtNum(d.viewsToday)} page views`} />
        <Stat icon={Clock} tone="amber" label="Pending orders" value={fmtNum(d.orders.pending)} hint="Verify payments / confirm" />
        <Stat icon={XCircle} tone="red" label="Failed / cancelled" value={fmtNum(d.orders.failed)} hint="Rejected, cancelled, returned" />
        <Stat icon={Inbox} tone="violet" label="New product requests" value={fmtNum(d.openRequests)} hint="Waiting for a call back" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Panel title="Orders & revenue — last 14 days" className="lg:col-span-2">
          <BarLineChart data={d.series} bar="revenue" line="orders" barLabel="Revenue" lineLabel="Orders" money />
        </Panel>
        <Panel title="Order outcomes">
          <OutcomeRing {...d.orders} />
          <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
            <div className="rounded-xl bg-sand-50 p-3"><p className="text-xs text-ink-500 flex items-center gap-1"><TrendingUp size={12} /> Avg order value</p><p className="font-extrabold">{inr(d.avgOrderValue)}</p></div>
            <div className="rounded-xl bg-sand-50 p-3"><p className="text-xs text-ink-500 flex items-center gap-1"><Percent size={12} /> Conversion (7d)</p><p className="font-extrabold">{d.conversion7}%</p></div>
          </div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Panel title="Traffic — last 14 days" className="lg:col-span-2" right={<Link to="/admin/traffic" className="text-sm font-bold text-brand-600">Details →</Link>}>
          <BarLineChart data={d.series} bar="views" line="visitors" barLabel="Page views" lineLabel="Visitors" />
        </Panel>
        <Panel title="Most ordered (30 days)">
          <HBars rows={d.topProducts} valueKey="qty" format={(n) => `${fmtNum(n)} sold`} empty="No orders yet" />
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Panel title="Recent orders" className="lg:col-span-2" right={<Link to="/admin/orders" className="text-sm font-bold text-brand-600">All orders →</Link>}>
          {d.recentOrders.length === 0 ? <p className="text-sm text-ink-500 py-6 text-center">No orders yet.</p> : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm min-w-[560px]">
                <thead className="text-left text-ink-500 text-xs"><tr><th className="py-2 px-4 sm:px-2">Order</th><th className="px-2">Customer</th><th className="px-2">Total</th><th className="px-2">Payment</th><th className="px-2">Status</th><th className="px-2">When</th></tr></thead>
                <tbody>
                  {d.recentOrders.map((o) => (
                    <tr key={o._id} className="border-t border-ink-100">
                      <td className="py-2.5 px-4 sm:px-2 font-bold">{o.orderNo}</td>
                      <td className="px-2">{o.user ? <Link to={`/admin/users/${o.user._id}`} className="hover:text-brand-600 font-semibold">{custName(o)}</Link> : <span>{custName(o)} <span className="text-xs text-ink-500">(guest)</span></span>}</td>
                      <td className="px-2 font-semibold">{inr(o.total)}</td>
                      <td className="px-2"><PaymentBadge payment={o.payment} /></td>
                      <td className="px-2"><StatusBadge status={o.status} /></td>
                      <td className="px-2 text-ink-500 text-xs">{timeAgo(o.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
        <Panel title="Latest requests" right={<Link to="/admin/requests" className="text-sm font-bold text-brand-600">All →</Link>}>
          {d.recentRequests.length === 0 ? <p className="text-sm text-ink-500 py-6 text-center">No requests yet.</p> : (
            <ul className="divide-y divide-ink-100">
              {d.recentRequests.map((r) => (
                <li key={r._id} className="py-2.5 text-sm">
                  <div className="flex justify-between gap-2"><span className="font-bold truncate">{r.product || 'Photo request'}</span><span className="text-xs text-ink-500 shrink-0">{timeAgo(r.createdAt)}</span></div>
                  <p className="text-xs text-ink-500">{r.need} for {r.animal === 'Other' ? r.animalOther : r.animal} · {r.name} · {r.status}{r.urgency === 'Urgent' ? ' · ⚡' : ''}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {d.statusBreakdown.length > 0 && (
        <Panel title="Orders by status" className="mt-4">
          <div className="flex flex-wrap gap-2">
            {d.statusBreakdown.map((s) => (
              <Link key={s._id} to={`/admin/orders?status=${encodeURIComponent(s._id)}`} className="inline-flex items-center gap-2 rounded-full bg-sand-50 ring-1 ring-ink-100 px-3 py-1.5 text-sm hover:ring-brand-300">
                <StatusBadge status={s._id} /><b>{s.count}</b>
              </Link>
            ))}
          </div>
        </Panel>
      )}
    </div>
  )
}
