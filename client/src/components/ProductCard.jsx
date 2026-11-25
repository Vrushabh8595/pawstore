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
    <div className="card group overflow-hidden flex flex-col">
      <div className="relative">
        <Link to={`/product/${product.slug}`}>
          <img src={product.images[0]} alt={product.name} loading="lazy"
            className="aspect-square w-full object-cover group-hover:scale-105 transition duration-300" />
        </Link>
        {off > 0 && <span className="absolute top-3 left-3 bg-brand-600 text-white text-xs font-bold px-2 py-1 rounded-md">{off}% OFF</span>}
        <button onClick={() => toggle(product.id)} aria-label="Wishlist"
          className="absolute top-3 right-3 w-9 h-9 grid place-items-center rounded-full bg-white/90 hover:bg-white shadow-sm">
          <Heart size={17} className={wished ? 'fill-brand-500 text-brand-500' : 'text-ink-700'} />
        </button>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center gap-1 text-xs text-ink-500 mb-1">
          <Star size={13} className="fill-brand-400 text-brand-400" />
          <span className="font-semibold text-ink-700">{product.rating}</span>
          <span>· {product.reviews}</span>
          <span className="ml-auto uppercase tracking-wide">{product.brand}</span>
        </div>
        <Link to={`/product/${product.slug}`} className="font-bold text-ink-900 leading-snug hover:text-brand-600 line-clamp-2">
          {product.name}
        </Link>
        <p className="text-sm text-ink-500 mt-1 line-clamp-2 flex-1">{product.short}</p>
        <div className="flex items-end justify-between mt-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-ink-900">{inr(v.price)}</span>
              {v.mrp > v.price && <span className="text-sm text-ink-500 line-through">{inr(v.mrp)}</span>}
            </div>
            <span className="text-xs text-ink-500">{v.size}</span>
          </div>
          <button onClick={() => add(product.id, v.sku, 1)} className="btn-primary !px-3 !py-2 text-sm" aria-label="Add to cart">
            <Plus size={16} /> Add
          </button>
        </div>
      </div>
    </div>
  )
}
