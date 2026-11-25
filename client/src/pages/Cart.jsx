import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCart, detailCart } from '@/store/cart'
import { inr, SHIPPING_FEE, FREE_SHIP_ABOVE } from '@/lib/format'

export default function Cart() {
  const rawItems = useCart((s) => s.items)
  const setQty = useCart((s) => s.setQty)
  const remove = useCart((s) => s.remove)
  const items = useMemo(() => detailCart(rawItems), [rawItems])
  const subtotal = useMemo(() => items.reduce((n, it) => n + it.lineTotal, 0), [items])

  if (items.length === 0)
    return (
      <div className="container-x py-20 text-center">
        <ShoppingBag size={48} className="mx-auto text-ink-500 mb-4" />
        <h1 className="text-2xl font-extrabold">Your cart is empty</h1>
        <p className="text-ink-500 mt-2">Add some tasty food for your pup.</p>
        <Link to="/shop" className="btn-primary mt-6">Browse products</Link>
      </div>
    )

  const shipping = subtotal >= FREE_SHIP_ABOVE ? 0 : SHIPPING_FEE
  const total = subtotal + shipping

  return (
    <div className="container-x py-8">
      <h1 className="text-3xl font-extrabold mb-6">Your cart ({items.length})</h1>
      <div className="grid lg:grid-cols-[1fr_360px] gap-8">
        <div className="space-y-4">
          {items.map((it) => (
            <div key={it.id + it.sku} className="card p-4 flex gap-4">
              <Link to={`/product/${it.product.slug}`} className="shrink-0">
                <img src={it.product.images[0]} alt="" className="w-24 h-24 rounded-xl object-cover" />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between gap-3">
                  <Link to={`/product/${it.product.slug}`} className="font-bold hover:text-brand-600 line-clamp-2">{it.product.name}</Link>
                  <button onClick={() => remove(it.id, it.sku)} className="text-ink-500 hover:text-red-500 shrink-0"><Trash2 size={18} /></button>
                </div>
                <p className="text-sm text-ink-500">{it.variant.size} · {it.variant.flavour}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-[#e5e5e0] rounded-lg">
                    <button onClick={() => setQty(it.id, it.sku, it.qty - 1)} className="p-2"><Minus size={14} /></button>
                    <span className="w-8 text-center text-sm font-bold">{it.qty}</span>
                    <button onClick={() => setQty(it.id, it.sku, it.qty + 1)} className="p-2"><Plus size={14} /></button>
                  </div>
                  <span className="font-extrabold">{inr(it.lineTotal)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="card p-5 h-fit lg:sticky lg:top-24">
          <h2 className="font-extrabold text-lg mb-4">Order summary</h2>
          <Row label="Subtotal" value={inr(subtotal)} />
          <Row label="Shipping" value={shipping === 0 ? 'FREE' : inr(shipping)} />
          {shipping > 0 && <p className="text-xs text-brand-600 mt-1">Add {inr(FREE_SHIP_ABOVE - subtotal)} more for free delivery</p>}
          <div className="border-t border-[#ecece7] my-3" />
          <Row label="Total" value={inr(total)} big />
          <Link to="/checkout" className="btn-primary w-full mt-5">Checkout <ArrowRight size={18} /></Link>
          <Link to="/shop" className="block text-center text-sm text-brand-600 font-semibold mt-3">Continue shopping</Link>
        </aside>
      </div>
    </div>
  )
}

function Row({ label, value, big }) {
  return (
    <div className={`flex justify-between ${big ? 'text-lg font-extrabold' : 'text-sm text-ink-700 py-0.5'}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  )
}
