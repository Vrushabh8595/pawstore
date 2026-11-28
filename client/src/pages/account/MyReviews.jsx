import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Star, Loader2, PenLine, Package } from 'lucide-react'
import { api } from '@/lib/api'
import { useMyOrders } from '@/lib/myOrders'
import { ReviewForm } from '@/components/ProductReviews'

const STATUS = {
  pending: ['Waiting for approval', 'bg-amber-100 text-amber-800'],
  approved: ['Live on the product page', 'bg-green-100 text-green-800'],
  rejected: ['Not approved', 'bg-red-100 text-red-700'],
}
const Stars = ({ n }) => (
  <span className="inline-flex" aria-label={`${n} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={14} className={i <= n ? 'fill-amber-400 text-amber-400' : 'text-ink-200 fill-ink-50'} />)}
  </span>
)

// "My reviews": every product the customer has ordered, with a button to
// write (or edit) a review, and the status of reviews already sent.
export default function MyReviews() {
  const { orders, isLoading } = useMyOrders()
  const mine = useQuery({ queryKey: ['my-reviews'], queryFn: () => api.get('/reviews/mine') })
  const [open, setOpen] = useState(null) // slug being reviewed

  const products = useMemo(() => {
    const map = new Map()
    for (const o of orders) {
      if (['Cancelled', 'Payment Rejected'].includes(o.status)) continue
      for (const it of o.items || []) {
        if (!it.slug) continue
        const prev = map.get(it.slug)
        const delivered = o.status === 'Delivered'
        if (!prev) map.set(it.slug, { slug: it.slug, name: it.name, image: it.image, delivered })
        else if (delivered) prev.delivered = true
      }
    }
    // Delivered products first: those are the ones ready to review
    return [...map.values()].sort((a, b) => Number(b.delivered) - Number(a.delivered))
  }, [orders])
  const reviews = new Map((mine.data?.reviews || []).map((r) => [r.productSlug, r]))

  if (isLoading || mine.isLoading) return <div className="card p-10 text-center"><Loader2 className="mx-auto animate-spin text-ink-500" /></div>

  return (
    <div className="min-w-0">
      <h1 className="text-2xl sm:text-3xl mb-1">My reviews</h1>
      <p className="text-sm text-ink-500 mb-4 sm:mb-5">Tell other pet parents how the products worked for your animals. Reviews are checked by our team before they appear.</p>
      {!products.length ? (
        <div className="card p-10 text-center text-ink-500">
          <Package size={40} className="mx-auto mb-3 text-brand-400" />
          Products you order will show here so you can review them.
          <Link to="/products" className="block mt-3 text-brand-600 font-semibold">Start shopping</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => {
            const r = reviews.get(p.slug)
            return (
              <div key={p.slug} className="card p-4">
                <div className="flex items-start gap-3">
                  <Link to={`/product/${p.slug}`} className="w-16 h-16 rounded-xl bg-sand-100 overflow-hidden shrink-0">{p.image && <img src={p.image} alt="" className="w-full h-full object-cover" loading="lazy" />}</Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${p.slug}`} className="font-bold text-ink-900 line-clamp-2 hover:text-brand-700">{p.name}</Link>
                    {r ? (
                      <div className="mt-1">
                        <div className="flex flex-wrap items-center gap-2"><Stars n={r.rating} /><span className={`text-[11px] font-bold rounded-full px-2 py-0.5 ${STATUS[r.status]?.[1] || ''}`}>{STATUS[r.status]?.[0] || r.status}</span></div>
                        {r.title && <p className="text-sm font-semibold mt-1">{r.title}</p>}
                        <p className="text-sm text-ink-700 mt-0.5 line-clamp-3">{r.comment}</p>
                      </div>
                    ) : (
                      <p className="text-xs text-ink-500 mt-1">{p.delivered ? 'Delivered. How did your pet like it?' : 'You can review it now, or after it’s delivered.'}</p>
                    )}
                  </div>
                  {open !== p.slug && (
                    <button onClick={() => setOpen(p.slug)} className={`${r ? 'btn-ghost' : 'btn-primary'} !py-2 !px-3.5 text-sm shrink-0`}>
                      <PenLine size={15} /> <span className="max-[400px]:hidden">{r ? 'Edit' : 'Write review'}</span><span className="min-[401px]:hidden">{r ? 'Edit' : 'Review'}</span>
                    </button>
                  )}
                </div>
                {open === p.slug && (
                  <div className="mt-3">
                    <ReviewForm slug={p.slug} productName={p.name} existing={r} onDone={() => { setOpen(null); mine.refetch() }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
