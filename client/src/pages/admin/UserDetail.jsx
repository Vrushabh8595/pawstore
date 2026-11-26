import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, IndianRupee, ShoppingBag, CheckCircle2, Clock, XCircle, TrendingUp, Phone, Mail, CalendarDays, Eye } from 'lucide-react'
import { api } from '@/lib/api'
import { inr } from '@/lib/format'
import StatusBadge, { PaymentBadge } from '@/components/StatusBadge'
import { Stat, Panel, OutcomeRing, HBars, Loading, ErrorBox, fmtNum, fmtDate, fmtDateTime, timeAgo } from './ui'
import { Avatar } from './Users'

export default function UserDetail() {
  const { id } = useParams()
  const q = useQuery({ queryKey: ['admin-user', id], queryFn: () => api.get(`/admin/users/${id}`), refetchInterval: 30_000 })
  if (q.isLoading) return <Loading label="Loading customer…" />
  if (q.isError) return <ErrorBox error={q.error} />
  const { user: u, orders, requests, views, favourite, live, avgOrderValue } = q.data

  return (
    <div>
      <Link to="/admin/users" className="inline-flex items-center gap-1.5 text-sm font-bold text-ink-500 hover:text-brand-600 mb-4"><ArrowLeft size={16} /> All users</Link>

      <div className="card p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <Avatar name={u.name} live={live} size="w-16 h-16 text-xl" />
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl truncate">{u.name}</h1>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-500 mt-1">
            <span className="inline-flex items-center gap-1.5"><Mail size={14} />{u.email}</span>
            {u.phone && <a href={`tel:${u.phone}`} className="inline-flex items-center gap-1.5 hover:text-brand-600"><Phone size={14} />{u.phone}</a>}
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} />Member since {fmtDate(u.createdAt)}</span>
          </div>
        </div>
        <span className={`self-start sm:self-center text-xs font-extrabold px-3 py-1.5 rounded-full ${live ? 'bg-green-100 text-green-700' : 'bg-ink-100 text-ink-700'}`}>
          {live ? '● Online now' : `Last seen ${timeAgo(u.lastSeen)}`}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
        <Stat icon={IndianRupee} tone="green" label="Total spent (to date)" value={inr(u.spent)} />
        <Stat icon={ShoppingBag} tone="orange" label="Orders placed" value={fmtNum(u.orderCount)} />
        <Stat icon={CheckCircle2} tone="green" label="Successful" value={fmtNum(u.success)} />
        <Stat icon={Clock} tone="amber" label="Pending" value={fmtNum(u.pending)} />
        <Stat icon={XCircle} tone="red" label="Failed / cancelled" value={fmtNum(u.failed)} />
        <Stat icon={TrendingUp} tone="navy" label="Avg order value" value={inr(avgOrderValue)} />
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mt-4">
        <Panel title="Order history" className="lg:col-span-2">
          {orders.length === 0 ? <p className="text-sm text-ink-500 py-6 text-center">No orders yet.</p> : (
            <ul className="divide-y divide-ink-100">
              {orders.map((o) => (
                <li key={o._id} className="py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <b>{o.orderNo}</b><StatusBadge status={o.status} /><PaymentBadge payment={o.payment} />
                    <span className="ml-auto font-extrabold">{inr(o.total)}</span>
                  </div>
                  <p className="text-xs text-ink-500 mt-1">{fmtDateTime(o.createdAt)} · {o.payment.method === 'COD' ? 'Cash on delivery' : `UPI ${o.payment.utr || ''}`} · {o.shippingAddress?.city}</p>
                  <p className="text-sm text-ink-700 mt-1">{o.items.map((i) => `${i.name} (${i.size}) × ${i.qty}`).join(', ')}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <div className="space-y-4">
          <Panel title="Order outcomes"><OutcomeRing success={u.success} pending={u.pending} failed={u.failed} /></Panel>
          <Panel title="Favourite products"><HBars rows={favourite} valueKey="qty" format={(n) => `× ${n}`} empty="No purchases yet" /></Panel>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mt-4">
        <Panel title="Recent activity on site" right={<Eye size={16} className="text-ink-500" />}>
          {views.length === 0 ? <p className="text-sm text-ink-500 py-6 text-center">No tracked visits while logged in.</p> : (
            <ul className="text-sm divide-y divide-ink-100">
              {views.map((v) => (
                <li key={v._id} className="py-2 flex justify-between gap-3"><span className="font-mono text-xs truncate">{v.path}</span><span className="text-xs text-ink-500 shrink-0">{v.device} · {timeAgo(v.at)}</span></li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Product requests">
          {requests.length === 0 ? <p className="text-sm text-ink-500 py-6 text-center">No requests from this customer.</p> : (
            <ul className="text-sm divide-y divide-ink-100">
              {requests.map((r) => (
                <li key={r._id} className="py-2.5">
                  <div className="flex justify-between gap-2"><b className="truncate">{r.product || 'Photo request'}</b><span className="text-xs text-ink-500">{timeAgo(r.createdAt)}</span></div>
                  <p className="text-xs text-ink-500">{r.need} for {r.animal === 'Other' ? r.animalOther : r.animal} · {r.status}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
