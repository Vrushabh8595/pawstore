import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Star, Plus, Minus, ShoppingCart } from 'lucide-react'
import { inr, discountPct } from '@/lib/format'
import { useCart, MAX_PER_PRODUCT, productQty } from '@/store/cart'
import { useWishlist } from '@/store/wishlist'
import { useAddToCart } from '@/lib/useAddToCart'
import { cartFeedback } from '@/lib/feedback'

/**
 * size: 'default' (grid / desktop) | 'compact' (3-up mobile grid & tight rails)
 */
export default function ProductCard({ product, size = 'default' }) {
  const v = product.variants[0]
  const addToCart = useAddToCart()
  const setQty = useCart((s) => s.setQty)
  const remove = useCart((s) => s.remove)
  const qty = useCart((s) => s.items.find((it) => it.id === product.id && it.sku === v.sku)?.qty || 0)
  const total = useCart((s) => productQty(s.items, product.id))
  const toggle = useWishlist((s) => s.toggle)
  const wished = useWishlist((s) => s.ids.includes(product.id))
  const [heartKey, setHeartKey] = useState(0)
  const imgRef = useRef(null)
  const off = discountPct(v.price, v.mrp)
  const compact = size === 'compact'

  const dec = (e) => {
    const btn = e.currentTarget
    if (qty <= 1) { cartFeedback('remove', { button: btn }); remove(product.id, v.sku) }
    else { cartFeedback('dec', { button: btn }); setQty(product.id, v.sku, qty - 1) }
  }
  const inc = (e) => {
    if (total >= MAX_PER_PRODUCT) return cartFeedback('limit', { button: e.currentTarget })
    setQty(product.id, v.sku, qty + 1); cartFeedback('inc', { button: e.currentTarget })
  }

  return (
    <div className="group card overflow-hidden flex flex-col h-full transition duration-200 hover:shadow-[0_16px_40px_-20px_rgba(26,26,23,.3)] lg:hover:-translate-y-0.5 !rounded-2xl sm:!rounded-[1.25rem]">
      <div className="relative bg-sand-100">
        <Link to={`/product/${product.slug}`} className="block aspect-square overflow-hidden">
          <img ref={imgRef} src={product.images[0]} alt={product.name} loading="lazy"
            className="block w-full h-full object-cover text-transparent group-hover:scale-[1.04] transition duration-500" />
        </Link>
        {off > 0 && (
          <span className={`absolute top-2 left-2 sm:top-3 sm:left-3 bg-brand-600 text-white font-extrabold rounded-full shadow-sm ${compact ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] sm:text-[11px] px-2 sm:px-2.5 py-0.5 sm:py-1'}`}>
            {off}% OFF
          </span>
        )}
        <button onClick={() => { toggle(product.id); setHeartKey((k) => k + 1) }} aria-label="Wishlist"
          className={`absolute grid place-items-center rounded-full bg-white/95 hover:bg-white shadow-sm transition active:scale-90 ${compact ? 'top-1.5 right-1.5 w-7 h-7' : 'top-2 right-2 sm:top-3 sm:right-3 w-8 h-8 sm:w-9 sm:h-9'}`}>
          <Heart key={heartKey} size={compact ? 14 : 17} className={`${heartKey ? 'animate-pop' : ''} ${wished ? 'fill-brand-500 text-brand-500' : 'text-ink-700'}`} />
        </button>
      </div>

      <div className={`flex flex-col flex-1 ${compact ? 'p-2' : 'p-2.5 sm:p-4'}`}>
        <div className={`flex items-center gap-1.5 mb-1 sm:mb-1.5 ${compact ? 'text-[10px]' : 'text-[11px] sm:text-xs'}`}>
          <span className="inline-flex items-center gap-0.5 bg-pine-50 text-pine-700 font-bold px-1.5 py-0.5 rounded-md">
            <Star size={compact ? 9 : 11} className="fill-pine-500 text-pine-500" />{product.rating}
          </span>
          {!compact && <span className="text-ink-500">({product.reviews})</span>}
          {!compact && <span className="hidden sm:inline ml-auto uppercase tracking-wide text-ink-500 font-semibold text-[10px] truncate">{product.brand}</span>}
        </div>

        <Link to={`/product/${product.slug}`}
          className={`font-bold text-ink-900 leading-snug hover:text-brand-600 line-clamp-2 ${compact ? 'text-[11px]' : 'text-[13px] sm:text-base'}`}>
          {product.name}
        </Link>
        {!compact && <p className="hidden sm:block text-sm text-ink-500 mt-1 line-clamp-2">{product.short}</p>}
        <span className={`text-ink-500 mt-0.5 truncate ${compact ? 'text-[10px]' : 'text-[11px] sm:text-xs'}`}>{v.size}</span>

        <div className="mt-auto pt-2 sm:pt-3">
          <div className="flex items-baseline flex-wrap gap-x-1.5">
            <span className={`font-extrabold text-ink-900 ${compact ? 'text-xs' : 'text-sm sm:text-lg'}`}>{inr(v.price)}</span>
            {v.mrp > v.price && <span className={`text-ink-500 line-through ${compact ? 'text-[10px]' : 'text-[11px] sm:text-sm'}`}>{inr(v.mrp)}</span>}
          </div>

          {/* Add → morphs into a qty stepper */}
          <div className={`mt-2 ${compact ? 'h-8' : 'h-9 sm:h-10'}`}>
            {qty === 0 ? (
              <button onClick={(e) => addToCart(product, v, 1, imgRef.current, e.currentTarget)}
                className={`ripple w-full h-full inline-flex items-center justify-center gap-1.5 rounded-full border-[1.5px] border-brand-500 text-brand-600 font-extrabold hover:bg-brand-500 hover:text-white active:scale-95 transition ${compact ? 'text-[11px]' : 'text-xs sm:text-sm'}`}
                aria-label={`Add ${product.name} to cart`}>
                {compact ? <Plus size={14} strokeWidth={3} /> : <ShoppingCart size={15} />} Add
              </button>
            ) : (
              <div key="stepper" className="animate-pop w-full h-full flex items-center justify-between rounded-full bg-brand-500 text-white shadow-[0_6px_16px_-8px_rgba(248,131,11,.9)]">
                <button onClick={dec} aria-label="Decrease" className="h-full px-2.5 sm:px-3 grid place-items-center active:scale-75 transition"><Minus size={compact ? 13 : 15} strokeWidth={3} /></button>
                <span key={qty} className={`animate-pop font-extrabold ${compact ? 'text-xs' : 'text-sm'}`}>{qty}</span>
                <button onClick={inc} aria-label="Increase" aria-disabled={total >= MAX_PER_PRODUCT} className={`${total >= MAX_PER_PRODUCT ? 'opacity-50' : ''} h-full px-2.5 sm:px-3 grid place-items-center active:scale-75 transition`}><Plus size={compact ? 13 : 15} strokeWidth={3} /></button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
