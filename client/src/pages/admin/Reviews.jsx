import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, X, Trash2, BadgeCheck, Undo2 } from 'lucide-react'
import { api } from '@/lib/api'
import Stars from '@/components/Stars'
import { PageHead, Loading, ErrorBox, timeAgo, ItemImg } from './ui'

const TABS = [['pending', 'Waiting for approval'], ['approved', 'Published'], ['rejected', 'Rejected'], ['all', 'All']]

// Approve / reject customer reviews. Only approved reviews show on product pages.
export default function AdminReviews() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('pending')
  const q = useQuery({ queryKey: ['admin-reviews', tab], queryFn: () => api.get(`/admin/reviews${tab === 'all' ? '' : `?status=${tab}`}`), refetchInterval: 30_000 })
  const refresh = () => { qc.invalidateQueries({ queryKey: ['admin-reviews'] }); qc.invalidateQueries({ queryKey: ['review-summary'] }) }
  const set = useMutation({ mutationFn: ({ id, status }) => api.patch(`/admin/reviews/${id}`, { status }), onSuccess: refresh })
  const del = useMutation({ mutationFn: (id) => api.del(`/admin/reviews/${id}`), onSuccess: refresh })
  const counts = q.data?.counts || {}
  const list = q.data?.reviews || []

  return (
    <div>
      <PageHead title="Reviews" sub="Customer reviews show on the product page only after you approve them." />
      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap mb-4">
        {TABS.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`shrink-0 inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold border transition ${tab === k ? 'bg-pine-900 text-white border-pine-900' : 'bg-white border-ink-200 text-ink-700 hover:border-brand-300'}`}>
            {label}
            {k !== 'all' && <span className={`text-[11px] font-extrabold rounded-full px-1.5 min-w-[20px] ${tab === k ? 'bg-white/15' : k === 'pending' && counts.pending ? 'bg-amber-400 text-pine-900' : 'bg-sand-100 text-ink-500'}`}>{counts[k] || 0}</span>}
          </button>
        ))}
      </div>

      {q.isLoading ? <Loading label="Loading reviews…" /> : q.isError ? <ErrorBox error={q.error} /> : (
        <div className="space-y-3">
          {list.map((r) => (
            <article key={r._id} className="card p-4 sm:p-5">
              <div className="flex gap-3 sm:gap-4">
                <ItemImg src={r.productImage} alt={r.productName} className="w-14 h-14 sm:w-16 sm:h-16" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Stars value={r.rating} size={16} />
                    <b className="text-ink-900">{r.rating}/5</b>
                    <span className={`text-[11px] font-extrabold uppercase tracking-wider rounded-full px-2 py-0.5 ${r.status === 'approved' ? 'bg-green-100 text-green-700' : r.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>{r.status === 'pending' ? 'Waiting' : r.status}</span>
                    {r.verifiedPurchase && <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-green-700"><BadgeCheck size={13} /> Verified purchase</span>}
                  </div>
                  <Link to={`/product/${r.productSlug}`} target="_blank" className="block text-sm font-semibold text-brand-600 truncate mt-1">{r.productName || r.productSlug}</Link>
                  {r.title && <p className="font-bold text-ink-900 mt-2">{r.title}</p>}
                  <p className="text-ink-700 mt-1 whitespace-pre-line break-words">{r.comment}</p>
                  <p className="text-xs text-ink-500 mt-2">
                    by {r.user ? <Link to={`/admin/users/${r.user._id}`} className="font-semibold hover:text-brand-600">{r.name || r.user.name}</Link> : r.name} · {timeAgo(r.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-3 sm:pl-20">
                {r.status !== 'approved' && (
                  <button disabled={set.isPending} onClick={() => set.mutate({ id: r._id, status: 'approved' })} className="btn-primary !py-1.5 !px-3.5 text-sm !bg-green-600 hover:!bg-green-700"><Check size={15} /> Approve</button>
                )}
                {r.status !== 'rejected' && (
                  <button disabled={set.isPending} onClick={() => set.mutate({ id: r._id, status: 'rejected' })} className="btn-ghost !py-1.5 !px-3.5 text-sm !text-red-600 !border-red-200">
                    {r.status === 'approved' ? <><Undo2 size={15} /> Unpublish</> : <><X size={15} /> Reject</>}
                  </button>
                )}
                <button disabled={del.isPending} onClick={() => { if (window.confirm('Delete this review permanently? This can’t be undone.')) del.mutate(r._id) }} className="btn-ghost !py-1.5 !px-3 text-sm !text-ink-500"><Trash2 size={15} /> Delete</button>
              </div>
            </article>
          ))}
          {list.length === 0 && <div className="card p-12 text-center text-ink-500">{tab === 'pending' ? 'No reviews waiting. You’re all caught up! 🎉' : 'Nothing here yet.'}</div>}
        </div>
      )}
    </div>
  )
}
