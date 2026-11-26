import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Ban, ShieldCheck, Loader2, ArrowLeft, IndianRupee, ShoppingBag, CheckCircle2, Clock, XCircle, TrendingUp, Phone, Mail, CalendarDays, Eye } from 'lucide-react'
import { api } from '@/lib/api'
import { inr } from '@/lib/format'
import StatusBadge, { PaymentBadge } from '@/components/StatusBadge'
import { Stat, Panel, OutcomeRing, HBars, Loading, ErrorBox, fmtNum, fmtDate, fmtDateTime, timeAgo, ItemStack } from './ui'
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
          <h1 className="text-2xl sm:text-3xl truncate flex items-center gap-2">{u.name}{u.blocked && <span className="shrink-0 font-sans text-xs font-extrabold uppercase tracking-wider text-white bg-red-500 rounded-full px-2 py-1">Blocked</span>}</h1>
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

      <BlockPanel user={u} />

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
                  <Link to={`/admin/orders?open=${o.orderNo}`} className="flex gap-3 group">
                    <ItemStack items={o.items} size="w-12 h-12" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <b className="group-hover:text-brand-600">{o.orderNo}</b><StatusBadge status={o.status} /><PaymentBadge payment={o.payment} />
                        <span className="ml-auto font-extrabold">{inr(o.total)}</span>
                      </div>
                      <p className="text-xs text-ink-500 mt-1">{fmtDateTime(o.createdAt)} · {o.payment.method === 'COD' ? 'Cash on delivery' : `UPI ${o.payment.utr || ''}`} · {o.shippingAddress?.city}</p>
                      <p className="text-sm text-ink-700 mt-1">{o.items.map((i) => `${i.name} (${i.size}) × ${i.qty}`).join(', ')}</p>
                    </div>
                  </Link>
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

// Block / unblock: blocked customers can browse but can't place orders
function BlockPanel({ user: u }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const m = useMutation({
    mutationFn: (blocked) => api.patch(`/admin/users/${u._id}/block`, { blocked, reason: reason.trim() || undefined }),
    onSuccess: () => { setOpen(false); setReason(''); qc.invalidateQueries({ queryKey: ['admin-user', u._id] }); qc.invalidateQueries({ queryKey: ['admin-users'] }) },
  })
  if (u.blocked) {
    return (
      <div className="card p-4 mb-4 flex flex-wrap items-center gap-3 bg-red-50 border-red-200">
        <span className="w-10 h-10 rounded-xl bg-red-500 text-white grid place-items-center shrink-0"><Ban size={19} /></span>
        <p className="flex-1 min-w-[200px] text-sm text-red-800">
          <b>This customer is blocked</b> since {fmtDateTime(u.blockedAt)}. They can browse but can’t place orders (also not as a guest with the same email or phone).
          {u.blockedReason && <span className="block mt-0.5">Reason: {u.blockedReason}</span>}
        </p>
        <button disabled={m.isPending} onClick={() => m.mutate(false)} className="btn-primary !py-2 !px-4 text-sm !bg-green-600 hover:!bg-green-700">
          {m.isPending ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={16} />} Unblock
        </button>
        {m.error && <p className="w-full text-sm text-red-600">{m.error.message}</p>}
      </div>
    )
  }
  return (
    <div className="mb-4">
      {!open ? (
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 border border-red-200 rounded-full px-3.5 py-1.5 hover:bg-red-50">
          <Ban size={15} /> Block this customer
        </button>
      ) : (
        <div className="card p-4 border-red-200 animate-fade-in">
          <p className="font-bold text-ink-900">Block {u.name}?</p>
          <p className="text-sm text-ink-500 mt-0.5">They won’t be able to place orders. When they try, they’ll see a message asking them to contact support.</p>
          <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={200} placeholder="Reason (only visible to admins), e.g. repeated fake COD orders"
            className="mt-3 w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-red-400" />
          <div className="flex gap-2 mt-3">
            <button disabled={m.isPending} onClick={() => m.mutate(true)} className="btn-primary !py-2 !px-4 text-sm !bg-red-600 hover:!bg-red-700">
              {m.isPending ? <Loader2 size={15} className="animate-spin" /> : <Ban size={15} />} Block customer
            </button>
            <button onClick={() => setOpen(false)} className="btn-ghost !py-2 !px-4 text-sm">Cancel</button>
          </div>
          {m.error && <p className="text-sm text-red-600 mt-2">{m.error.message}</p>}
        </div>
      )}
    </div>
  )
}
