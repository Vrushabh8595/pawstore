import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Star, BadgeCheck, Loader2, PenLine, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { playSound, haptic } from '@/lib/feedback'
import { Field, useFieldErrors, errorFeedback } from './FormField'
import Stars from './Stars'

const LABELS = ['', 'Poor', 'Not great', 'Okay', 'Good', 'Loved it!']
const fmt = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

// Reviews block on the product page: rating summary, approved reviews,
// and a "write a review" form (signed-in customers; shown after admin approval).
export default function ProductReviews({ slug, productName }) {
  const user = useAuth((s) => s.user)
  const q = useQuery({ queryKey: ['reviews', slug], queryFn: () => api.get(`/reviews/product/${slug}`), staleTime: 60_000 })
  const mine = useQuery({ queryKey: ['my-review', slug], queryFn: () => api.get(`/reviews/mine/${slug}`), enabled: !!user && user.role !== 'admin' })
  const [writing, setWriting] = useState(false)
  const s = q.data?.summary || { avg: 0, count: 0, breakdown: {} }
  const reviews = q.data?.reviews || []
  const my = mine.data?.review

  return (
    <section id="reviews" className="mt-10 sm:mt-14 scroll-mt-28" aria-labelledby="reviews-title">
      <div className="flex items-end justify-between gap-3 mb-4 sm:mb-6">
        <h2 id="reviews-title" className="text-xl sm:text-2xl font-extrabold">Ratings & reviews</h2>
        {user?.role !== 'admin' && !writing && (
          <button type="button" onClick={() => setWriting(true)} className="btn-ghost !py-2 !px-4 text-sm"><PenLine size={15} /> {my ? 'Edit your review' : 'Write a review'}</button>
        )}
      </div>

      <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-5 sm:gap-8 items-start">
        {/* Summary */}
        <div className="card p-5">
          {s.count ? (
            <>
              <div className="flex items-end gap-3">
                <span className="font-display text-5xl font-semibold leading-none text-ink-900">{s.avg.toFixed(1)}</span>
                <span className="pb-1"><Stars value={s.avg} size={18} /><span className="block text-xs text-ink-500 mt-1">{s.count} review{s.count === 1 ? '' : 's'}</span></span>
              </div>
              <ul className="mt-4 space-y-1.5">
                {[5, 4, 3, 2, 1].map((n) => {
                  const c = s.breakdown?.[n] || 0
                  return (
                    <li key={n} className="flex items-center gap-2 text-xs">
                      <span className="w-6 font-bold text-ink-700 inline-flex items-center gap-0.5">{n}<Star size={10} className="fill-amber-400 text-amber-400" /></span>
                      <span className="flex-1 h-2 rounded-full bg-ink-100 overflow-hidden"><span className="block h-full rounded-full bg-amber-400" style={{ width: `${(c / s.count) * 100}%` }} /></span>
                      <span className="w-6 text-right text-ink-500">{c}</span>
                    </li>
                  )
                })}
              </ul>
            </>
          ) : (
            <div className="text-center py-2">
              <Stars value={0} size={22} />
              <p className="font-bold mt-2">No reviews yet</p>
              <p className="text-sm text-ink-500 mt-0.5">Be the first to share how your pet liked it.</p>
            </div>
          )}

          {my && !writing && (
            <div className={`mt-4 rounded-xl p-3 text-sm ${my.status === 'approved' ? 'bg-green-50 text-green-800' : my.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-900'}`}>
              <p className="font-bold flex items-center gap-1.5">
                {my.status === 'approved' ? <CheckCircle2 size={15} /> : my.status === 'rejected' ? <XCircle size={15} /> : <Clock size={15} />}
                Your review is {my.status === 'approved' ? 'live' : my.status === 'rejected' ? 'not published' : 'waiting for approval'}
              </p>
              <Stars value={my.rating} size={13} className="mt-1" />
            </div>
          )}
        </div>

        <div className="min-w-0 space-y-3">
          {writing && <ReviewForm slug={slug} productName={productName} existing={my} onDone={() => setWriting(false)} />}
          {q.isLoading && <div className="card p-6 animate-pulse h-24" />}
          {reviews.map((r) => (
            <article key={r._id} className="card p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white font-extrabold grid place-items-center shrink-0">{(r.name || '?')[0].toUpperCase()}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink-900 truncate">{r.name || 'Pet parent'}</p>
                  <p className="text-xs text-ink-500 flex items-center gap-2 flex-wrap">
                    {fmt(r.createdAt)}
                    {r.verifiedPurchase && <span className="inline-flex items-center gap-0.5 text-green-700 font-semibold"><BadgeCheck size={13} /> Verified purchase</span>}
                  </p>
                </div>
                <Stars value={r.rating} size={15} />
              </div>
              {r.title && <p className="font-bold text-ink-900 mt-3">{r.title}</p>}
              <p className="text-ink-700 mt-1.5 leading-relaxed whitespace-pre-line break-words">{r.comment}</p>
            </article>
          ))}
          {!q.isLoading && !reviews.length && !writing && (
            <div className="card p-6 text-center text-sm text-ink-500">Reviews from pet parents will appear here after our team checks them.</div>
          )}
        </div>
      </div>
    </section>
  )
}

function ReviewForm({ slug, productName, existing, onDone }) {
  const user = useAuth((s) => s.user)
  const loc = useLocation()
  const qc = useQueryClient()
  const [rating, setRating] = useState(existing?.rating || 0)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState(existing?.title || '')
  const [comment, setComment] = useState(existing?.comment || '')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')
  const fe = useFieldErrors()

  if (!user) {
    return (
      <div className="card p-5 text-center border-brand-200 bg-brand-50/50">
        <p className="font-bold">Log in to write a review</p>
        <p className="text-sm text-ink-500 mt-0.5">It only takes a moment with Google.</p>
        <Link to={`/login?next=${encodeURIComponent(loc.pathname + '#reviews')}`} className="btn-primary !py-2 mt-3 inline-flex">Log in</Link>
      </div>
    )
  }
  if (done) {
    return (
      <div role="status" className="card p-5 bg-green-50 border-green-200 animate-fade-in">
        <p className="font-bold text-green-800">Thank you for your review! 🐾</p>
        <p className="text-sm text-green-800 mt-1">Our team will check it shortly. Once approved it appears here, and you’ll get a notification.</p>
        <button type="button" onClick={onDone} className="mt-3 text-sm font-bold text-green-800 underline">Close</button>
      </div>
    )
  }

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!fe.validate({
      rating: !rating ? 'Tap the stars to rate this product.' : null,
      comment: comment.trim().length < 10 ? 'Tell other pet parents a little more (at least 10 characters).' : null,
    })) return
    setBusy(true)
    try {
      await api.post('/reviews', { slug, rating, title: title.trim(), comment: comment.trim() })
      qc.invalidateQueries({ queryKey: ['my-review', slug] })
      playSound('success'); haptic([20, 40, 20])
      setDone(true)
    } catch (e2) {
      setErr(e2.message || 'Couldn’t send your review. Please try again.'); errorFeedback()
    } finally { setBusy(false) }
  }

  const shown = hover || rating
  return (
    <form onSubmit={submit} noValidate className="card p-4 sm:p-5 border-brand-200 animate-fade-in">
      <p className="font-bold text-ink-900">Review {productName}</p>
      <div data-field="rating" className="mt-3">
        <span className="font-bold text-sm">Your rating<span className="text-red-500 ml-0.5">*</span></span>
        <div className="flex items-center gap-1 mt-1" role="radiogroup" aria-label="Rating" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`}
              onMouseEnter={() => setHover(n)} onClick={() => { setRating(n); fe.clear('rating'); haptic(8) }}
              className="p-0.5 transition active:scale-90 hover:scale-110">
              <Star size={30} className={n <= shown ? 'fill-amber-400 text-amber-400' : 'text-ink-200 fill-ink-50'} />
            </button>
          ))}
          <span className="ml-2 text-sm font-bold text-ink-700 min-w-[70px]">{LABELS[shown]}</span>
        </div>
        {fe.errors.rating && <p role="alert" className="mt-1 text-xs font-semibold text-red-600">{fe.errors.rating}</p>}
      </div>
      <div className="grid gap-3 mt-3">
        <Field name="title" optional label="Title" value={title} onChange={setTitle} maxLength={80} placeholder="e.g. My dog finishes the bowl every time" />
        <Field as="textarea" name="comment" required error={fe.errors.comment} label="Your review" rows={4} maxLength={1000} value={comment}
          onChange={(v) => { setComment(v); fe.clear('comment') }} placeholder="How did your pet like it? Quality, taste, results…" />
      </div>
      {err && <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{err}</p>}
      <div className="flex gap-2 mt-4">
        <button type="submit" disabled={busy} className="btn-primary !py-2.5 disabled:opacity-70">{busy && <Loader2 size={16} className="animate-spin" />} Submit review</button>
        <button type="button" onClick={onDone} className="btn-ghost !py-2.5">Cancel</button>
      </div>
      <p className="text-xs text-ink-500 mt-2">Reviews are checked by our team before they appear.</p>
    </form>
  )
}
