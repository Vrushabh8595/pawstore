import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import ProductCard from './ProductCard'

// Mobile: horizontal snap rail showing ~2.5 cards. Desktop: 4-up grid,
// or a scrollable row with arrows when `scroll` is set.
export default function ProductRail({ products, scroll = false }) {
  const ref = useRef(null)
  const by = (d) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.8, behavior: 'smooth' })
  return (
    <div className="relative">
      <div ref={ref} data-rail className={`rail ${scroll ? 'rail-scroll' : ''}`}>
        {products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
      {scroll && (
        <>
          <button onClick={() => by(-1)} aria-label="Scroll left"
            className="hidden lg:grid absolute -left-5 top-1/3 w-11 h-11 place-items-center rounded-full bg-white shadow-lg ring-1 ring-ink-100 hover:text-brand-600 transition"><ChevronLeft /></button>
          <button onClick={() => by(1)} aria-label="Scroll right"
            className="hidden lg:grid absolute -right-5 top-1/3 w-11 h-11 place-items-center rounded-full bg-white shadow-lg ring-1 ring-ink-100 hover:text-brand-600 transition"><ChevronRight /></button>
        </>
      )}
    </div>
  )
}
