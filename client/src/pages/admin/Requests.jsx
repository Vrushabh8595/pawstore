import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Phone, MessageCircle, X } from 'lucide-react'
import { api } from '@/lib/api'

const STATUSES = ['New', 'Contacted', 'Sourcing', 'Quoted', 'Fulfilled', 'Unavailable']
const TONE = {
  New: 'bg-brand-100 text-brand-800', Contacted: 'bg-pine-100 text-pine-800', Sourcing: 'bg-amber-100 text-amber-800',
  Quoted: 'bg-violet-100 text-violet-800', Fulfilled: 'bg-green-100 text-green-800', Unavailable: 'bg-ink-100 text-ink-700',
}

export default function Requests() {
  const qc = useQueryClient()
  const [status, setStatus] = useState('')
  const [zoom, setZoom] = useState(null)
  const q = useQuery({ queryKey: ['requests', status], queryFn: () => api.get(`/admin/requests${status ? `?status=${encodeURIComponent(status)}` : ''}`) })
  const upd = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/requests/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requests'] }),
  })
  const list = q.data?.requests || []

  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-1">Product requests</h1>
      <p className="text-ink-500 text-sm mb-5">Medicines / food / custom items customers asked us to source.</p>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-5">
        {['', ...STATUSES].map((s) => (
          <button key={s || 'all'} onClick={() => setStatus(s)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-bold border ${status === s ? 'bg-pine-800 text-white border-pine-800' : 'bg-white border-ink-200'}`}>{s || 'All'}</button>
        ))}
      </div>

      {q.isLoading && <p className="text-ink-500">Loading…</p>}
      {q.isError && <p className="text-red-600 text-sm">Couldn’t load requests: {q.error.message}</p>}
      {!q.isLoading && !q.isError && list.length === 0 && <div className="card p-10 text-center text-ink-500">No requests yet.</div>}

      <div className="grid gap-4 xl:grid-cols-2">
        {list.map((r) => (
          <div key={r._id} className="card p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-ink-500 font-mono">{r.ref} · {new Date(r.createdAt).toLocaleString('en-IN')}</p>
                <p className="font-extrabold text-lg leading-tight mt-0.5">{r.product || 'Photo request'}</p>
                <p className="text-sm text-ink-700">{r.need} for {r.animal}{r.brand ? ` · ${r.brand}` : ''}{r.strength ? ` · ${r.strength}` : ''}{r.quantity ? ` · qty ${r.quantity}` : ''}</p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TONE[r.status]}`}>{r.status}</span>
                {r.urgency === 'Urgent' && <span className="text-xs font-bold text-red-600">⚡ Urgent</span>}
              </div>
            </div>
            {r.details && <p className="text-sm text-ink-700 bg-sand-50 rounded-xl p-3 mt-3 whitespace-pre-wrap">{r.details}</p>}
            {r.photos?.length > 0 && (
              <div className="flex gap-2 mt-3">
                {r.photos.map((src, i) => (
                  <button key={i} onClick={() => setZoom(src)}><img src={src} alt="" className="w-20 h-20 rounded-xl object-cover ring-1 ring-ink-100" /></button>
                ))}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-ink-100">
              <span className="text-sm font-semibold mr-auto">{r.name} · {r.phone}{r.city ? ` · ${r.city}` : ''} {r.pincode}</span>
              <a href={`tel:${r.phone}`} className="btn-ghost !py-1.5 !px-3 text-sm"><Phone size={14} /> Call</a>
              <a href={`https://wa.me/91${r.phone}`} target="_blank" rel="noreferrer" className="btn-ghost !py-1.5 !px-3 text-sm"><MessageCircle size={14} /> WhatsApp</a>
              <select value={r.status} onChange={(e) => upd.mutate({ id: r._id, status: e.target.value })}
                className="border border-ink-200 rounded-full px-3 py-1.5 text-sm font-semibold bg-white">
                {STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>

      {zoom && (
        <div className="fixed inset-0 z-50 bg-black/80 grid place-items-center p-4" onClick={() => setZoom(null)}>
          <button className="absolute top-4 right-4 text-white" aria-label="Close"><X /></button>
          <img src={zoom} alt="" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </div>
  )
}
