import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import { products, categories, filterOptions } from '@/data/products'
import ProductCard from '@/components/ProductCard'

const sorts = {
  popular: (a, b) => b.reviews - a.reviews,
  'price-asc': (a, b) => a.variants[0].price - b.variants[0].price,
  'price-desc': (a, b) => b.variants[0].price - a.variants[0].price,
  rating: (a, b) => b.rating - a.rating,
}

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const q = (params.get('q') || '').toLowerCase()
  const cat = params.get('cat') || ''
  const [sort, setSort] = useState('popular')
  const [f, setF] = useState({ lifeStage: [], breedSize: [], foodType: [], diet: [] })
  const [mobileFilters, setMobileFilters] = useState(false)

  const toggle = (group, val) =>
    setF((s) => ({ ...s, [group]: s[group].includes(val) ? s[group].filter((x) => x !== val) : [...s[group], val] }))

  const list = useMemo(() => {
    let out = products.filter((p) => {
      if (cat && p.category !== cat) return false
      if (q && !(`${p.name} ${p.short} ${p.brand}`.toLowerCase().includes(q))) return false
      if (f.lifeStage.length && !f.lifeStage.includes(p.lifeStage)) return false
      if (f.breedSize.length && !f.breedSize.includes(p.breedSize)) return false
      if (f.foodType.length && !f.foodType.includes(p.foodType)) return false
      if (f.diet.length && !f.diet.some((d) => p.diet.includes(d))) return false
      return true
    })
    return out.sort(sorts[sort])
  }, [cat, q, f, sort])

  const catName = categories.find((c) => c.slug === cat)?.name

  const FilterPanel = () => (
    <div className="space-y-6">
      {Object.entries(filterOptions).map(([group, vals]) => (
        <div key={group}>
          <h4 className="font-bold text-sm capitalize mb-2">{group.replace(/([A-Z])/g, ' $1')}</h4>
          <div className="space-y-1.5">
            {vals.map((v) => (
              <label key={v} className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer capitalize">
                <input type="checkbox" checked={f[group].includes(v)} onChange={() => toggle(group, v)}
                  className="w-4 h-4 accent-brand-500" />
                {v}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button onClick={() => setF({ lifeStage: [], breedSize: [], foodType: [], diet: [] })}
        className="text-sm text-brand-600 font-semibold">Clear filters</button>
    </div>
  )

  return (
    <div className="container-x py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">{catName || 'All Products'}</h1>
        <p className="text-ink-500 mt-1">{list.length} product{list.length !== 1 && 's'}{q && <> for “{q}”</>}</p>
        {cat && <button onClick={() => { params.delete('cat'); setParams(params) }} className="mt-2 text-sm text-brand-600 font-semibold inline-flex items-center gap-1">Clear category <X size={14} /></button>}
      </div>

      <div className="flex gap-8">
        <aside className="hidden lg:block w-56 shrink-0">
          <FilterPanel />
        </aside>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-4 gap-3">
            <button onClick={() => setMobileFilters(true)} className="lg:hidden btn-ghost !py-2 !px-3 text-sm">
              <SlidersHorizontal size={16} /> Filters
            </button>
            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="ml-auto bg-white border border-[#e5e5e0] rounded-lg px-3 py-2 text-sm font-semibold">
              <option value="popular">Most popular</option>
              <option value="rating">Top rated</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </div>

          {list.length === 0 ? (
            <div className="card p-12 text-center text-ink-500">No products match your filters.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {list.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilters(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[85%] bg-white p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg">Filters</h3>
              <button onClick={() => setMobileFilters(false)}><X size={22} /></button>
            </div>
            <FilterPanel />
            <button onClick={() => setMobileFilters(false)} className="btn-primary w-full mt-6">Show {list.length} results</button>
          </div>
        </div>
      )}
    </div>
  )
}
