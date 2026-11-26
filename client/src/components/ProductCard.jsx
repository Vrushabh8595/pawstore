import { Link } from 'react-router-dom'
import { Heart, Star, Plus } from 'lucide-react'
import { inr, discountPct } from '@/lib/format'
import { useCart } from '@/store/cart'
import { useWishlist } from '@/store/wishlist'

export default function ProductCard({ product }) {
  const v = product.variants[0]
  const add = useCart((s) => s.add)
  const toggle = useWishlist((s) => s.toggle)
  const wished = useWishlist((s) => s.ids.includes(product.id))
  const off = discountPct(v.price, v.mrp)

  return (
    <div className="group card overflow-hidden flex flex-col transition duration-200 hover:shadow-[0_16px_40px_-20px_rgba(26,26,23,.3)] hover:-translate-y-0.5">
      <div className="relative bg-sand-100">
        <Link to={`/product/${product.slug}`} className="block">
          <img src={product.images[0]} alt={product.name} loading="lazy"
            className="aspect-square w-full object-cover group-hover:scale-[1.04] transition duration-500" />
        </Link>
        {off > 0 && (
          <span className="absolute top-3 left-3 bg-brand-600 text-white text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-sm">
            {off}% OFF
          </span>
        )}
        <button onClick={() => toggle(product.id)} aria-label="Wishlist"
          className="absolute top-3 right-3 w-9 h-9 grid place-items-center rounded-full bg-white/95 hover:bg-white shadow-sm transition">
          <Heart size={17} className={wished ? 'fill-brand-500 text-brand-500' : 'text-ink-700'} />
        </button>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1.5 text-xs mb-1.5">
          <span className="inline-flex items-center gap-1 bg-pine-50 text-pine-700 font-bold px-1.5 py-0.5 rounded-md">
            <Star size={11} className="fill-pine-500 text-pine-500" />{product.rating}
          </span>
          <span className="text-ink-500">({product.reviews})</span>
          <span className="ml-auto uppercase tracking-wide text-ink-500 font-semibold text-[10px]">{product.brand}</span>
        </div>

        <Link to={`/product/${product.slug}`} className="font-bold text-ink-900 leading-snug hover:text-brand-600 line-clamp-2">
          {product.name}
        </Link>
        <p className="text-sm text-ink-500 mt-1 line-clamp-2 flex-1">{product.short}</p>

        <div className="flex items-end justify-between mt-3.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-ink-900 text-lg">{inr(v.price)}</span>
              {v.mrp > v.price && <span className="text-sm text-ink-500 line-through">{inr(v.mrp)}</span>}
            </div>
            <span className="text-xs text-ink-500">{v.size}</span>
          </div>
          <button onClick={() => add(product.id, v.sku, 1)}
            className="w-10 h-10 grid place-items-center rounded-full bg-brand-500 text-white hover:bg-brand-600 transition shadow-[0_6px_16px_-8px_rgba(248,131,11,.8)]"
            aria-label="Add to cart">
            <Plus size={19} />
          </button>
        </div>
      </div>
    </div>
  )
}
