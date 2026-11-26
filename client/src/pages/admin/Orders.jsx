import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X, Check, ChevronDown, Search, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { inr, STATUS_FLOW } from '@/lib/format'
import StatusBadge, { PaymentBadge } from '@/components/StatusBadge'
import { PageHead, Loading, ErrorBox, timeAgo, custName } from './ui'

export default function AdminOrders() {
  const qc = useQueryClient()
  const [params] = useSearchParams()
  const [statusF, setStatusF] = useState(params.get('status') || 'all')
  const [payF, setPayF] = useState('all')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(null)
  const q = useQuery({ queryKey: ['admin-orders'], queryFn: () => api.get('/admin/orders'), refetchInterval: 30_000 })
  const orders = useMemo(() => q.data || [], [q.data])
  const refresh = () => { qc.invalidateQueries({ queryKey: ['admin-orders'] }); qc.invalidateQueries({ queryKey: ['admin-dashboard'] }) }
  const verify = useMutation({ mutationFn: ({ id, action }) => api.patch(`/admin/orders/${id}/verify-payment`, { action }), onSuccess: refresh })
  const status = useMutation({ mutationFn: ({ id, status }) => api.patch(`/admin/orders/${id}/status`, { status }), onSuccess: refresh })
  const busy = verify.isPending || status.isPending

  const list = useMemo(() => {
    const s = search.trim().toLowerCase()
    return orders.filter((o) =>
      (statusF === 'all' || o.status === statusF) &&
      (payF === 'all' || o.payment.method === payF) &&
      (!s || `${o.orderNo} ${custName(o)} ${o.shippingAddress?.phone || ''} ${o.user?.email || o.guestEmail || ''}`.toLowerCase().includes(s)))
  }, [orders, statusF, payF, search])
  const active = orders.find((o) => o._id === open)
  const pendingUpi = orders.filter((o) => o.payment.status === 'pending_verification').length

  if (q.isLoading) return <Loading label="Loading orders…" />
  if (q.isError) return <ErrorBox error={q.error} />

  return (
    <div>
      <PageHead title="Orders" sub={`${orders.length} orders · ${pendingUpi} UPI payments waiting for verification`} />

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center flex-1 min-w-[220px] bg-white rounded-full px-4 ring-1 ring-ink-200 focus-within:ring-brand-400">
          <Search size={17} className="text-ink-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order no, customer, phone, email…" className="w-full bg-transparent py-2.5 px-2.5 outline-none" />
        </div>
        <Select value={statusF} onChange={setStatusF} options={['all', ...STATUS_FLOW, 'Payment Rejected', 'Cancelled', 'Returned']} label="statuses" />
        <Select value={payF} onChange={setPayF} options={['all', 'UPI_MANUAL', 'COD']} label="payments" />
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead className="bg-sand-50 text-left text-ink-500 text-xs uppercase tracking-wide">
            <tr><Th>Order</Th><Th>Customer</Th><Th>Items</Th><Th>Total</Th><Th>Payment</Th><Th>Status</Th><Th>Placed</Th><Th></Th></tr>
          </thead>
          <tbody>
            {list.map((o) => (
              <tr key={o._id} className="border-t border-ink-100 hover:bg-sand-50/60">
                <Td className="font-bold">{o.orderNo}</Td>
                <Td>{o.user ? <Link to={`/admin/users/${o.user._id}`} className="font-semibold hover:text-brand-600">{custName(o)}</Link> : <>{custName(o)} <span className="text-xs text-ink-500">guest</span></>}</Td>
                <Td className="text-ink-500">{o.items.reduce((n, i) => n + i.qty, 0)} items</Td>
                <Td className="font-semibold">{inr(o.total)}</Td>
                <Td><div className="flex items-center gap-1"><PaymentBadge payment={o.payment} /><span className="text-xs text-ink-500">{o.payment.method === 'COD' ? 'COD' : 'UPI'}</span></div></Td>
                <Td><StatusBadge status={o.status} /></Td>
                <Td className="text-ink-500 text-xs">{timeAgo(o.createdAt)}</Td>
                <Td><button onClick={() => setOpen(o._id)} className="text-brand-600 font-bold text-xs">Manage</button></Td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-ink-500">No orders match.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Manage drawer */}
      {active && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(null)} />
          <div className="absolute right-0 top-0 h-full w-[420px] max-w-[92%] bg-white overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-[#ecece7] sticky top-0 bg-white">
              <h2 className="font-extrabold flex items-center gap-2">{active.orderNo}{busy && <Loader2 size={16} className="animate-spin text-brand-500" />}</h2>
              <button onClick={() => setOpen(null)}><X size={22} /></button>
            </div>
            <div className="p-5 space-y-5 text-sm">
              <div className="flex items-center gap-2"><StatusBadge status={active.status} /><PaymentBadge payment={active.payment} /></div>

              {active.payment.method === 'UPI_MANUAL' && (
                <div className="card p-4 bg-amber-50 border-amber-200">
                  <p className="font-bold">UPI payment</p>
                  <p className="text-ink-700 mt-1">UTR / Ref: <b>{active.payment.utr || '—'}</b></p>
                  {active.payment.status === 'pending_verification' ? (
                    <div className="flex gap-2 mt-3">
                      <button disabled={busy} onClick={() => verify.mutate({ id: active._id, action: 'approve' })} className="btn-primary !py-2 flex-1"><Check size={16} /> Mark paid</button>
                      <button disabled={busy} onClick={() => verify.mutate({ id: active._id, action: 'reject' })} className="btn-ghost !py-2 flex-1 !text-red-600 !border-red-200">Reject</button>
                    </div>
                  ) : <p className="text-ink-500 mt-2">Payment already {active.payment.status}.</p>}
                </div>
              )}

              <div>
                <p className="font-bold mb-2">Update status</p>
                <div className="flex flex-wrap gap-2">
                  {[...STATUS_FLOW, 'Cancelled', 'Returned'].map((s) => (
                    <button key={s} disabled={busy} onClick={() => status.mutate({ id: active._id, status: s })}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${active.status === s ? 'bg-brand-500 text-white border-brand-500' : 'border-[#e5e5e0] hover:border-brand-300'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="card p-4">
                <p className="font-bold mb-2">Items</p>
                {active.items.map((it) => (
                  <div key={it.variantSku + it.name} className="flex justify-between py-1 text-ink-700">
                    <span>{it.name} · {it.size} × {it.qty}</span><span className="font-semibold">{inr(it.price * it.qty)}</span>
                  </div>
                ))}
                <div className="border-t border-[#ecece7] mt-2 pt-2 flex justify-between font-extrabold"><span>Total</span><span>{inr(active.total)}</span></div>
              </div>

              <div className="card p-4">
                <p className="font-bold mb-1">Ship to</p>
                <p className="text-ink-700">{active.shippingAddress?.name}, {active.shippingAddress?.line1}, {active.shippingAddress?.city}, {active.shippingAddress?.state} {active.shippingAddress?.pincode} · 📞 <a className="font-semibold" href={`tel:${active.shippingAddress?.phone}`}>{active.shippingAddress?.phone}</a></p>
                <p className="text-ink-500 text-xs mt-1">{active.user?.email || active.guestEmail || 'Guest checkout'}</p>
              </div>

              <div>
                <p className="font-bold mb-2">History</p>
                <ol className="space-y-1.5">
                  {active.statusHistory.map((h, i) => (
                    <li key={i} className="flex justify-between text-ink-600">
                      <span>{h.status}{h.note ? ` — ${h.note}` : ''}</span>
                      <span className="text-xs">{new Date(h.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Select({ value, onChange, options, label }) {
  return (
    <label className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-white border border-[#e5e5e0] rounded-lg pl-3 pr-8 py-2 text-sm font-semibold">
        {options.map((o) => <option key={o} value={o}>{o === 'all' ? `All ${label}` : o}</option>)}
      </select>
      <ChevronDown size={15} className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none" />
    </label>
  )
}
const Th = ({ children }) => <th className="px-4 py-3 font-semibold whitespace-nowrap">{children}</th>
const Td = ({ children, className = '' }) => <td className={`px-4 py-3 whitespace-nowrap ${className}`}>{children}</td>
