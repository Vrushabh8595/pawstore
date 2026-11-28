import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Check, Search, Loader2, Phone, MessageCircle, MapPin, Mail, User as UserIcon, Clock, RefreshCw, IndianRupee, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'
import { inr, STATUS_FLOW } from '@/lib/format'
import StatusBadge, { PaymentBadge } from '@/components/StatusBadge'
import { PageHead, Loading, ErrorBox, timeAgo, custName, fmtDateTime, ItemImg, ItemStack } from './ui'

const TABS = [
  ['all', 'All'],
  ['Pending Verification', 'New'],
  ['Confirmed', 'Confirmed'],
  ['Packed', 'Packed'],
  ['Shipped', 'Shipped'],
  ['Out for Delivery', 'Out for delivery'],
  ['Delivered', 'Delivered'],
  ['closed', 'Cancelled / returned'],
]
const CLOSED = ['Cancelled', 'Returned', 'Payment Rejected']
const inTab = (o, tab) => tab === 'all' || (tab === 'closed' ? CLOSED.includes(o.status) : o.status === tab)
const isFresh = (o) => o.status === 'Pending Verification' && Date.now() - new Date(o.createdAt) < 6 * 3600e3
const NEXT = { 'Pending Verification': 'Confirmed', Confirmed: 'Packed', Packed: 'Shipped', Shipped: 'Out for Delivery', 'Out for Delivery': 'Delivered' }

export default function AdminOrders() {
  const qc = useQueryClient()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState(params.get('status') || 'all')
  const [payF, setPayF] = useState('all')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(null) // order _id
  const q = useQuery({ queryKey: ['admin-orders'], queryFn: () => api.get('/admin/orders'), refetchInterval: 30_000 })
  const orders = useMemo(() => q.data || [], [q.data])
  const refresh = () => { qc.invalidateQueries({ queryKey: ['admin-orders'] }); qc.invalidateQueries({ queryKey: ['admin-dashboard'] }) }

  // ?open=AV123 (from a notification) opens that order
  const openNo = params.get('open')
  useEffect(() => {
    if (!openNo || !orders.length) return
    const o = orders.find((x) => x.orderNo === openNo)
    if (o) setOpen(o._id)
    params.delete('open'); setParams(params, { replace: true })
  }, [openNo, orders, params, setParams])

  const counts = useMemo(() => Object.fromEntries(TABS.map(([k]) => [k, orders.filter((o) => inTab(o, k)).length])), [orders])
  const list = useMemo(() => {
    const s = search.trim().toLowerCase()
    return orders.filter((o) =>
      inTab(o, tab) &&
      (payF === 'all' || o.payment.method === payF) &&
      (!s || `${o.orderNo} ${custName(o)} ${o.shippingAddress?.phone || ''} ${o.shippingAddress?.city || ''} ${o.user?.email || o.guestEmail || ''} ${o.items.map((i) => i.name).join(' ')}`.toLowerCase().includes(s)))
  }, [orders, tab, payF, search])
  const active = orders.find((o) => o._id === open)
  const today = orders.filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString())
  const pendingUpi = orders.filter((o) => o.payment.status === 'pending_verification').length

  if (q.isLoading) return <Loading label="Loading orders…" />
  if (q.isError) return <ErrorBox error={q.error} />

  return (
    <div>
      <PageHead title="Orders"
        sub={`${today.length} today · ${inr(today.filter((o) => !CLOSED.includes(o.status)).reduce((n, o) => n + o.total, 0))} · ${counts['Pending Verification']} waiting to confirm${pendingUpi ? ` · ${pendingUpi} UPI to verify` : ''}`}
        right={<button onClick={() => q.refetch()} className="btn-ghost !py-2 !px-3 text-sm"><RefreshCw size={15} className={q.isFetching ? 'animate-spin' : ''} /> Refresh</button>} />

      {/* Status tabs */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap mb-3">
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`shrink-0 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold border transition ${tab === k ? 'bg-pine-900 text-white border-pine-900' : 'bg-white border-ink-200 text-ink-700 hover:border-brand-300'}`}>
            {label}
            <span className={`text-[11px] font-extrabold rounded-full px-1.5 min-w-[20px] ${tab === k ? 'bg-white/15' : k === 'Pending Verification' && counts[k] ? 'bg-brand-500 text-white' : 'bg-sand-100 text-ink-500'}`}>{counts[k]}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center flex-1 min-w-[220px] bg-white rounded-full px-4 ring-1 ring-ink-200 focus-within:ring-brand-400">
          <Search size={17} className="text-ink-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order no, customer, phone, city, product…" className="w-full bg-transparent py-2.5 px-2.5 outline-none" />
        </div>
        <div className="flex rounded-full bg-white ring-1 ring-ink-200 p-1 text-sm font-semibold">
          {[['all', 'All'], ['COD', 'COD'], ['UPI_MANUAL', 'UPI']].map(([k, l]) => (
            <button key={k} onClick={() => setPayF(k)} className={`px-3 py-1.5 rounded-full ${payF === k ? 'bg-brand-500 text-white' : 'text-ink-700'}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Order cards */}
      <div className="space-y-2.5">
        {list.map((o) => {
          const qty = o.items.reduce((n, i) => n + i.qty, 0)
          return (
            <button key={o._id} onClick={() => setOpen(o._id)}
              className={`w-full text-left card p-3 sm:p-4 flex items-center gap-3 sm:gap-4 hover:border-brand-300 hover:shadow-md transition min-w-0 ${isFresh(o) ? 'ring-2 ring-brand-200 bg-brand-50/30' : ''}`}>
              <ItemStack items={o.items} size="w-12 h-12 sm:w-14 sm:h-14" />
              <span className="flex-1 min-w-0">
                <span className="flex items-center gap-2 flex-wrap">
                  <b className="text-ink-900">{o.orderNo}</b>
                  <StatusBadge status={o.status} />
                  <PaymentBadge payment={o.payment} />
                  {isFresh(o) && <span className="text-[10px] font-extrabold uppercase tracking-wider text-white bg-brand-500 rounded-full px-2 py-0.5 animate-pulse">New</span>}
                </span>
                <span className="block text-sm text-ink-700 truncate mt-1">{o.items.map((i) => `${i.name} (${i.size}) ×${i.qty}`).join(', ')}</span>
                <span className="flex items-center gap-x-3 gap-y-0.5 flex-wrap text-xs text-ink-500 mt-1">
                  <span className="inline-flex items-center gap-1"><UserIcon size={12} />{custName(o)}{!o.user && ' · guest'}</span>
                  <span className="inline-flex items-center gap-1"><MapPin size={12} />{o.shippingAddress?.city || 'None'}</span>
                  <span className="inline-flex items-center gap-1"><Clock size={12} />{timeAgo(o.createdAt)}</span>
                  <span>{qty} item{qty === 1 ? '' : 's'} · {o.payment.method === 'COD' ? 'Cash on delivery' : 'UPI'}</span>
                </span>
              </span>
              <span className="text-right shrink-0">
                <b className="block text-base sm:text-lg text-ink-900">{inr(o.total)}</b>
                <span className="hidden sm:inline text-xs font-bold text-brand-600">Manage →</span>
              </span>
            </button>
          )
        })}
        {list.length === 0 && <div className="card p-12 text-center text-ink-500">No orders here yet.</div>}
      </div>

      {active && <OrderDrawer order={active} onClose={() => setOpen(null)} onChanged={refresh} />}
    </div>
  )
}

function OrderDrawer({ order: o, onClose, onChanged }) {
  const [note, setNote] = useState('')
  const verify = useMutation({ mutationFn: (action) => api.patch(`/admin/orders/${o._id}/verify-payment`, { action }), onSuccess: onChanged })
  const status = useMutation({ mutationFn: (s) => api.patch(`/admin/orders/${o._id}/status`, { status: s, note: note.trim() || undefined }), onSuccess: () => { setNote(''); onChanged() } })
  const busy = verify.isPending || status.isPending
  const err = verify.error || status.error
  const a = o.shippingAddress || {}
  const email = o.user?.email || o.guestEmail
  const next = NEXT[o.status]
  const addr = [a.line1, a.city, a.state, a.pincode].filter(Boolean).join(', ')
  useEffect(() => { const k = (e) => e.key === 'Escape' && onClose(); window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k) }, [onClose])

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-[480px] max-w-full bg-sand-50 overflow-y-auto overscroll-contain shadow-2xl" style={{ animation: 'toast-in .3s ease both' }}>
        <div className="sticky top-0 z-10 bg-pine-900 text-white px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-white/60">{fmtDateTime(o.createdAt)} · {timeAgo(o.createdAt)}</p>
              <h2 className="font-extrabold text-lg flex items-center gap-2 font-sans">{o.orderNo}{busy && <Loader2 size={16} className="animate-spin text-brand-300" />}</h2>
            </div>
            <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-white/10"><X size={22} /></button>
          </div>
          <div className="flex items-center gap-2 mt-2"><StatusBadge status={o.status} /><PaymentBadge payment={o.payment} /><b className="ml-auto text-lg">{inr(o.total)}</b></div>
        </div>

        <div className="p-4 sm:p-5 space-y-4 text-sm">
          {err && <p className="card p-3 text-red-600 bg-red-50 border-red-200">{err.message}</p>}

          {/* Products */}
          <section className="card p-4 bg-white">
            <p className="font-bold mb-3">Products ({o.items.reduce((n, i) => n + i.qty, 0)})</p>
            <div className="space-y-3">
              {o.items.map((it, k) => (
                <div key={k} className="flex items-center gap-3">
                  <ItemImg src={it.image} alt={it.name} className="w-16 h-16" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ink-900 leading-snug line-clamp-2">{it.name}</p>
                    <p className="text-xs text-ink-500 mt-0.5">{it.size} · {inr(it.price)} each · <span className="font-mono">{it.variantSku}</span></p>
                    {it.slug && <a href={`/product/${it.slug}`} target="_blank" rel="noreferrer" className="text-xs font-semibold text-brand-600 inline-flex items-center gap-1 mt-0.5">View on store <ExternalLink size={11} /></a>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block text-xs font-extrabold bg-pine-900 text-white rounded-full px-2 py-0.5">×{it.qty}</span>
                    <p className="font-bold mt-1">{inr(it.price * it.qty)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-ink-100 mt-4 pt-3 space-y-1 text-ink-700">
              <Row l="Subtotal" r={inr(o.subtotal)} />
              {o.discount ? <Row l={`Coupon ${o.coupon || ''}`} r={<span className="text-green-700">− {inr(o.discount)}</span>} /> : null}
              <Row l="Delivery" r={o.shippingFee ? inr(o.shippingFee) : 'Free'} />
              {o.codFee ? <Row l="COD fee" r={inr(o.codFee)} /> : null}
              <Row l={<b className="text-ink-900">Total</b>} r={<b className="text-ink-900 text-base">{inr(o.total)}</b>} />
            </div>
          </section>

          {/* Payment */}
          {o.payment.method === 'UPI_MANUAL' ? (
            <section className="card p-4 bg-amber-50 border-amber-200">
              <p className="font-bold flex items-center gap-1.5"><IndianRupee size={15} /> UPI payment</p>
              <p className="text-ink-700 mt-1">UTR / reference: <b className="font-mono">{o.payment.utr || 'None'}</b></p>
              {o.payment.status === 'pending_verification' ? (
                <div className="flex gap-2 mt-3">
                  <button disabled={busy} onClick={() => verify.mutate('approve')} className="btn-primary !py-2 flex-1"><Check size={16} /> Mark paid</button>
                  <button disabled={busy} onClick={() => verify.mutate('reject')} className="btn-ghost !py-2 flex-1 !text-red-600 !border-red-200">Reject</button>
                </div>
              ) : <p className="text-ink-500 mt-2">Payment {o.payment.status.replace('_', ' ')}.</p>}
            </section>
          ) : (
            <section className="card p-4 bg-white flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-green-50 text-green-600 grid place-items-center"><IndianRupee size={18} /></span>
              <p className="flex-1"><b>Cash on delivery</b><br /><span className="text-ink-500 text-xs">Collect {inr(o.total)} at the door{o.payment.status === 'cod_collected' ? ', collected ✓' : ''}</span></p>
            </section>
          )}

          {/* Status */}
          <section className="card p-4 bg-white">
            <p className="font-bold mb-2">Update status</p>
            <p className="text-xs text-ink-500 mb-3">The customer gets an in-app alert{email ? ' and an email' : ''} for every change.</p>
            {next && (
              <button disabled={busy} onClick={() => status.mutate(next)} className="btn-primary w-full !py-2.5 mb-3">
                Mark as {next} →
              </button>
            )}
            <div className="flex flex-wrap gap-2">
              {[...STATUS_FLOW, 'Cancelled', 'Returned'].map((s) => (
                <button key={s} disabled={busy || o.status === s} onClick={() => { if (!CLOSED.includes(s) || window.confirm(`Mark ${o.orderNo} as ${s}? The customer will be notified.`)) status.mutate(s) }}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${o.status === s ? 'bg-brand-500 text-white border-brand-500' : CLOSED.includes(s) ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-ink-200 hover:border-brand-300'}`}>
                  {s}
                </button>
              ))}
            </div>
            <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200}
              placeholder="Optional note for the customer (e.g. courier + tracking no.)"
              className="mt-3 w-full rounded-xl border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-400" />
          </section>

          {/* Customer */}
          <section className="card p-4 bg-white">
            <p className="font-bold mb-3">Customer</p>
            <div className="flex items-center gap-3">
              <span className="w-11 h-11 rounded-full bg-brand-500 text-white font-extrabold grid place-items-center">{(custName(o)[0] || '?').toUpperCase()}</span>
              <div className="min-w-0 flex-1">
                {o.user ? <Link to={`/admin/users/${o.user._id}`} className="font-bold hover:text-brand-600">{custName(o)}</Link> : <b>{custName(o)}</b>}
                <p className="text-xs text-ink-500">{o.user ? 'Registered customer' : 'Guest checkout'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <a href={`tel:${a.phone}`} className="btn-ghost !py-2 text-sm"><Phone size={15} /> {a.phone}</a>
              <a href={`https://wa.me/91${a.phone}?text=${encodeURIComponent(`Hi ${a.name || ''}, this is AnimalVeda about your order ${o.orderNo}.`)}`} target="_blank" rel="noreferrer" className="btn-ghost !py-2 text-sm !text-green-700 !border-green-200"><MessageCircle size={15} /> WhatsApp</a>
            </div>
            {email && <a href={`mailto:${email}?subject=${encodeURIComponent(`Your AnimalVeda order ${o.orderNo}`)}`} className="mt-2 flex items-center gap-2 text-ink-700 hover:text-brand-600 break-all"><Mail size={15} className="shrink-0" />{email}</a>}
            <div className="mt-3 rounded-xl bg-sand-50 p-3">
              <p className="flex items-start gap-2 text-ink-700"><MapPin size={15} className="shrink-0 mt-0.5 text-brand-600" /><span><b>{a.name}</b><br />{addr}</span></p>
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-brand-600 mt-1.5 inline-flex items-center gap-1">Open in Google Maps <ExternalLink size={11} /></a>
            </div>
          </section>

          {/* Timeline */}
          <section className="card p-4 bg-white">
            <p className="font-bold mb-3">Timeline</p>
            <ol className="relative border-l-2 border-ink-100 ml-2 space-y-3">
              {[...o.statusHistory].reverse().map((h, i) => (
                <li key={i} className="pl-4 relative">
                  <span className={`absolute -left-[7px] top-1 w-3 h-3 rounded-full ring-2 ring-white ${i === 0 ? 'bg-brand-500' : 'bg-ink-200'}`} />
                  <p className="font-semibold text-ink-900">{h.status}</p>
                  {h.note && <p className="text-ink-500 text-xs">{h.note}</p>}
                  <p className="text-[11px] text-ink-500">{fmtDateTime(h.at)}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  )
}
const Row = ({ l, r }) => <div className="flex justify-between"><span>{l}</span><span>{r}</span></div>
