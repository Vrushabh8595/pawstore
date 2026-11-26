import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Heart, Star, Truck, ShieldCheck, Minus, Plus, ChevronRight } from 'lucide-react'
import { getProduct, products } from '@/data/products'
import { inr, discountPct } from '@/lib/format'
import { useCart } from '@/store/cart'
import { useWishlist } from '@/store/wishlist'
import ProductRail from '@/components/ProductRail'
import { useAddToCart } from '@/lib/useAddToCart'

export default function Product() {
  const { slug } = useParams()
  const product = getProduct(slug)
  const nav = useNavigate()
  const add = useCart((s) => s.add)
  const addToCart = useAddToCart()
  const imgRef = useRef(null)
  const toggle = useWishlist((s) => s.toggle)
  const wished = useWishlist((s) => product && s.ids.includes(product.id))
  const [variant, setVariant] = useState(product?.variants[0])
  const [qty, setQty] = useState(1)
  const [img, setImg] = useState(0)
  const [tab, setTab] = useState('desc')

  if (!product) return <div className="container-x py-20 text-center text-ink-500">Product not found. <Link to="/shop" className="text-brand-600 font-semibold">Back to shop</Link></div>

  const off = discountPct(variant.price, variant.mrp)
  const related = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4)

  const buyNow = () => { add(product.id, variant.sku, qty); nav('/checkout') }

  return (
    <div className="container-x py-5 sm:py-8">
      <nav className="flex items-center gap-1 text-sm text-ink-500 mb-6">
        <Link to="/" className="hover:text-brand-600">Home</Link><ChevronRight size={14} />
        <Link to="/shop" className="hover:text-brand-600">Shop</Link><ChevronRight size={14} />
        <span className="text-ink-900 font-medium truncate">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        {/* Gallery */}
        <div>
          <div className="card overflow-hidden">
            <img ref={imgRef} src={product.images[img]} alt={product.name} className="w-full aspect-square object-cover" />
          </div>
          <div className="flex gap-3 mt-3">
            {product.images.map((src, i) => (
              <button key={i} onClick={() => setImg(i)}
                className={`w-20 h-20 rounded-xl overflow-hidden border-2 ${i === img ? 'border-brand-500' : 'border-transparent'}`}>
                <img src={src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xs font-bold uppercase text-brand-600 tracking-wide">{product.brand}</span>
            <span className="flex items-center gap-1 text-ink-500"><Star size={14} className="fill-brand-400 text-brand-400" /> {product.rating} ({product.reviews})</span>
          </div>
          <h1 className="text-3xl font-extrabold mt-1">{product.name}</h1>
          <p className="text-ink-500 mt-2">{product.short}</p>

          <div className="flex items-end gap-3 mt-4">
            <span className="text-3xl font-extrabold">{inr(variant.price)}</span>
            {variant.mrp > variant.price && <span className="text-lg text-ink-500 line-through mb-0.5">{inr(variant.mrp)}</span>}
            {off > 0 && <span className="mb-1 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded">Save {off}%</span>}
          </div>
          <p className="text-xs text-ink-500 mt-1">Inclusive of all taxes</p>

          {/* Variant picker */}
          <div className="mt-6">
            <p className="font-bold text-sm mb-2">Pack size</p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <button key={v.sku} onClick={() => setVariant(v)}
                  className={`px-4 py-2 rounded-xl border text-sm font-semibold ${variant.sku === v.sku ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-[#e5e5e0] hover:border-brand-300'} ${v.stock === 0 ? 'opacity-40 line-through' : ''}`}
                  disabled={v.stock === 0}>
                  {v.size} · {inr(v.price)}
                </button>
              ))}
            </div>
            <p className={`text-sm mt-2 font-semibold ${variant.stock > 10 ? 'text-green-600' : variant.stock > 0 ? 'text-orange-500' : 'text-red-500'}`}>
              {variant.stock > 10 ? 'In stock' : variant.stock > 0 ? `Only ${variant.stock} left` : 'Out of stock'}
            </p>
          </div>

          {/* Qty + actions */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <div className="flex items-center border border-[#e5e5e0] rounded-xl">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-3"><Minus size={16} /></button>
              <span className="w-10 text-center font-bold">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} className="p-3"><Plus size={16} /></button>
            </div>
            <button onClick={(e) => addToCart(product, variant, qty, imgRef.current, e.currentTarget)} className="ripple btn-ghost flex-1 min-w-[120px] active:scale-95">Add to cart</button>
            <button onClick={buyNow} className="btn-primary flex-1 min-w-[120px] active:scale-95">Buy now</button>
            <button onClick={() => toggle(product.id)} className="btn-ghost !px-3" aria-label="Wishlist">
              <Heart size={18} className={wished ? 'fill-brand-500 text-brand-500' : ''} />
            </button>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6 text-sm text-ink-500">
            <span className="flex items-center gap-2"><Truck size={18} className="text-brand-600" /> Free over ₹999</span>
            <span className="flex items-center gap-2"><ShieldCheck size={18} className="text-brand-600" /> UPI & COD</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-12 max-w-3xl">
        <div className="flex gap-1 border-b border-[#ecece7] overflow-x-auto no-scrollbar">
          {[['desc', 'Description'], ['ingredients', 'Ingredients'], ['feeding', 'Feeding'], ['nutrition', 'Nutrition']].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`shrink-0 whitespace-nowrap px-4 py-3 text-sm font-bold border-b-2 -mb-px ${tab === k ? 'border-brand-500 text-brand-600' : 'border-transparent text-ink-500'}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="py-5 text-ink-700 leading-relaxed">
          {tab === 'desc' && <p>{product.description}</p>}
          {tab === 'ingredients' && <p>{product.ingredients}</p>}
          {tab === 'feeding' && <p>{product.feeding}</p>}
          {tab === 'nutrition' && (
            <table className="w-full max-w-sm text-sm">
              <tbody>
                {Object.entries(product.nutrition).map(([k, v]) => (
                  <tr key={k} className="border-b border-[#f0f0ec]">
                    <td className="py-2 capitalize text-ink-500">{k}</td>
                    <td className="py-2 font-bold text-right">{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-10 sm:mt-14">
          <h2 className="text-xl sm:text-2xl font-extrabold mb-4 sm:mb-6">You may also like</h2>
          <ProductRail products={related} />
        </div>
      )}
    </div>
  )
}
