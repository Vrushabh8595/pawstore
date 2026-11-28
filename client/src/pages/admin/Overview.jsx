import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { IndianRupee, ShoppingBag, Users, Radio, Eye, Clock, XCircle, Inbox, TrendingUp, TrendingDown, Percent, RefreshCw, Undo2, Wallet } from 'lucide-react'
import { api } from '@/lib/api'
import { inr } from '@/lib/format'
import StatusBadge, { PaymentBadge } from '@/components/StatusBadge'
import { PageHead, Stat, Panel, BarLineChart, HBars, OutcomeRing, Loading, ErrorBox, fmtNum, timeAgo, custName, ItemStack } from './ui'

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

      <ProfitSummary />

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Panel title="Orders & revenue (last 14 days)" className="lg:col-span-2">
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
        <Panel title="Traffic (last 14 days)" className="lg:col-span-2" right={<Link to="/admin/traffic" className="text-sm font-bold text-brand-600">Details →</Link>}>
          <BarLineChart data={d.series} bar="views" line="visitors" barLabel="Page views" lineLabel="Visitors" />
        </Panel>
        <Panel title="Most ordered (30 days)">
          <HBars rows={d.topProducts} valueKey="qty" format={(n) => `${fmtNum(n)} sold`} empty="No orders yet" />
        </Panel>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Panel title="Recent orders" className="lg:col-span-2" right={<Link to="/admin/orders" className="text-sm font-bold text-brand-600">All orders →</Link>}>
          {d.recentOrders.length === 0 ? <p className="text-sm text-ink-500 py-6 text-center">No orders yet.</p> : (
            <ul className="divide-y divide-ink-100 -my-1">
              {d.recentOrders.map((o) => (
                <li key={o._id}>
                  <Link to={`/admin/orders?open=${o.orderNo}`} className="flex items-center gap-3 py-2.5 group min-w-0">
                    <ItemStack items={o.items} size="w-11 h-11" />
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2 flex-wrap"><b className="group-hover:text-brand-600">{o.orderNo}</b><StatusBadge status={o.status} /><PaymentBadge payment={o.payment} /></span>
                      <span className="block text-xs text-ink-500 truncate mt-0.5">{custName(o)}{!o.user && ' (guest)'} · {o.items.map((i) => i.name).join(', ')}</span>
                    </span>
                    <span className="text-right shrink-0"><b className="block">{inr(o.total)}</b><span className="text-xs text-ink-500">{timeAgo(o.createdAt)}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
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

// Today / this month profit and the loss from returns, linking to the full page
function ProfitSummary() {
  const day = useQuery({ queryKey: ['admin-profit', 'period=day'], queryFn: () => api.get('/admin/profit?period=day'), refetchInterval: 60_000 })
  const month = useQuery({ queryKey: ['admin-profit', 'period=month'], queryFn: () => api.get('/admin/profit?period=month'), refetchInterval: 60_000 })
  if (!day.data || !month.data) return null
  const signed = (n) => (n < 0 ? '−' + inr(-n) : inr(n))
  const Box = ({ title, value, hint, tone, Icon }) => (
    <div className="rounded-xl bg-sand-50 p-3 sm:p-4 min-w-0">
      <p className="text-xs font-semibold text-ink-500 flex items-center gap-1"><Icon size={13} /> {title}</p>
      <p className={`text-xl font-extrabold truncate ${tone}`}>{value}</p>
      <p className="text-xs text-ink-500 truncate">{hint}</p>
    </div>
  )
  const t = day.data.totals, m = month.data.totals
  return (
    <Panel title="Profit & loss" className="mt-4" right={<Link to="/admin/profit" className="text-sm font-bold text-brand-600">Details →</Link>}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Box title="Today" Icon={t.net < 0 ? TrendingDown : TrendingUp} value={signed(t.net)} tone={t.net < 0 ? 'text-red-600' : 'text-green-700'} hint={`${t.orders} completed orders`} />
        <Box title="This month" Icon={m.net < 0 ? TrendingDown : Wallet} value={signed(m.net)} tone={m.net < 0 ? 'text-red-600' : 'text-green-700'} hint={`${month.data.margin}% margin`} />
        <Box title="Loss from returns (month)" Icon={Undo2} value={inr(m.returnsLoss)} tone="text-red-600" hint={`${m.returns} returned order${m.returns === 1 ? '' : 's'}`} />
        <Box title="Stock + courier (month)" Icon={IndianRupee} value={inr(m.goodsCost + m.courierCost)} tone="text-ink-900" hint={`on ${inr(m.sales + m.fees)} sales`} />
      </div>
    </Panel>
  )
}
