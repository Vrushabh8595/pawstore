import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X, ChevronRight, LayoutGrid, Grid3x3 } from 'lucide-react'
import { products, categories, filterOptions } from '@/data/products'
import ProductCard from '@/components/ProductCard'

const sorts = {
  popular: (a, b) => b.reviews - a.reviews,
  'price-asc': (a, b) => a.variants[0].price - b.variants[0].price,
  'price-desc': (a, b) => b.variants[0].price - a.variants[0].price,
  rating: (a, b) => b.rating - a.rating,
}

const CAT_EMOJI = {
  'dry-food': '🦴', 'wet-food': '🍲', treats: '🍪',
  'collars-leashes': '🦮', health: '💊', apparel: '🧥', bedding: '🛏️',
}
const CAT_BANNER = {
  'dry-food': ['Complete everyday nutrition', 'from-brand-100 to-sand-100'],
  'wet-food': ['Tender, tempting meals', 'from-pine-100 to-sand-100'],
  treats: ['Rewards for the very good boys', 'from-sand-200 to-brand-50'],
  'collars-leashes': ['Walks & adventures, sorted', 'from-brand-100 to-pine-50'],
  health: ['Care, recovery & supplements', 'from-pine-100 to-sand-100'],
  apparel: ['Cosy winter warmers', 'from-brand-100 to-sand-100'],
  bedding: ['Dreamy, comfy naps', 'from-pine-100 to-brand-50'],
}

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const q = (params.get('q') || '').toLowerCase()
  const cat = params.get('cat') || ''
  const [sort, setSort] = useState(() => (sorts[params.get('sort')] ? params.get('sort') : 'popular'))
  const deal = params.get('deal')
  const [quickState, setQuick] = useState(null) // 'bestseller' | 'sale' | null
  const quick = quickState ?? (deal === 'sale' ? 'sale' : null)
  const [cols, setCols] = useState(() => { try { return localStorage.getItem('pawstore-cols') || '2' } catch { return '2' } })
  useEffect(() => { setQuick(null) }, [deal])
  const pickCols = (c) => { setCols(c); try { localStorage.setItem('pawstore-cols', c) } catch { /* ignore */ } }
  const [f, setF] = useState({ lifeStage: [], breedSize: [], foodType: [], diet: [] })
  const [mobileFilters, setMobileFilters] = useState(false)

  const toggle = (group, val) =>
    setF((s) => ({ ...s, [group]: s[group].includes(val) ? s[group].filter((x) => x !== val) : [...s[group], val] }))
  const clearAll = () => { setF({ lifeStage: [], breedSize: [], foodType: [], diet: [] }); setQuick(null); if (deal) { params.delete('deal'); setParams(params) } }

  const list = useMemo(() => {
    let out = products.filter((p) => {
      if (cat && p.category !== cat) return false
      if (q && !(`${p.name} ${p.short} ${p.brand}`.toLowerCase().includes(q))) return false
      if (quick === 'bestseller' && !p.tags?.includes('bestseller')) return false
      if (quick === 'sale' && !(p.variants[0].mrp > p.variants[0].price)) return false
      if (f.lifeStage.length && !f.lifeStage.includes(p.lifeStage)) return false
      if (f.breedSize.length && !f.breedSize.includes(p.breedSize)) return false
      if (f.foodType.length && !f.foodType.includes(p.foodType)) return false
      if (f.diet.length && !f.diet.some((d) => p.diet.includes(d))) return false
      return true
    })
    return out.sort(sorts[sort])
  }, [cat, q, f, sort, quick])

  const catName = categories.find((c) => c.slug === cat)?.name
  const title = catName || (q ? `Results for “${q}”` : 'All Products')
  const [tagline, grad] = CAT_BANNER[cat] || ['Everything your dog will love', 'from-brand-100 to-pine-50']
  const activeFilterCount = Object.values(f).flat().length + (quick && quick !== 'none' ? 1 : 0)

  const setCat = (slug) => {
    if (slug) params.set('cat', slug); else params.delete('cat')
    setParams(params)
    setMobileFilters(false)
  }

  const CategoryList = () => (
    <div className="space-y-1">
      <button onClick={() => setCat('')}
        className={`flex items-center gap-3 w-full text-left px-2.5 py-2 rounded-xl text-sm font-semibold transition ${!cat ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-sand-100'}`}>
        <span className="w-8 h-8 rounded-full bg-sand-100 grid place-items-center text-base shrink-0">🐾</span> All Products
      </button>
      {categories.map((c) => (
        <button key={c.slug} onClick={() => setCat(c.slug)}
          className={`flex items-center gap-3 w-full text-left px-2.5 py-2 rounded-xl text-sm font-semibold transition ${cat === c.slug ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-sand-100'}`}>
          <span className="w-8 h-8 rounded-full bg-sand-100 grid place-items-center text-base shrink-0">{CAT_EMOJI[c.slug] || '🐾'}</span> {c.name}
        </button>
      ))}
    </div>
  )

  const FilterGroups = () => (
    <div className="space-y-6">
      {Object.entries(filterOptions).map(([group, vals]) => (
        <div key={group}>
          <h4 className="font-bold text-sm capitalize mb-2.5">{group.replace(/([A-Z])/g, ' $1')}</h4>
          <div className="space-y-2">
            {vals.map((v) => (
              <label key={v} className="flex items-center gap-2.5 text-sm text-ink-700 cursor-pointer capitalize">
                <input type="checkbox" checked={f[group].includes(v)} onChange={() => toggle(group, v)}
                  className="w-4 h-4 rounded accent-brand-500" />
                {v}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className="container-x py-4 sm:py-6">
      {/* Breadcrumb */}
      <nav className="hidden sm:flex items-center gap-1.5 text-sm text-ink-500 mb-4">
        <Link to="/" className="hover:text-brand-600">Home</Link>
        <ChevronRight size={14} />
        <span className="font-semibold text-ink-900">{title}</span>
      </nav>

      {/* Category banner */}
      <div className={`relative overflow-hidden rounded-[1.6rem] bg-gradient-to-r ${grad} px-5 sm:px-10 py-5 sm:py-10 mb-4 sm:mb-6`}>
        <div className="absolute -right-4 -bottom-6 text-[5.5rem] sm:text-[11rem] opacity-20 leading-none select-none">{CAT_EMOJI[cat] || '🐾'}</div>
        <div className="relative">
          <h1 className="font-display text-2xl sm:text-5xl font-semibold text-ink-900">{title}</h1>
          <p className="text-ink-700 mt-1 text-sm sm:text-lg">{tagline}</p>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:block w-60 shrink-0 space-y-7">
          <div>
            <h3 className="font-display font-semibold text-lg mb-3">Categories</h3>
            <CategoryList />
          </div>
          <div className="border-t border-ink-100 pt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-semibold text-lg">Filters</h3>
              {activeFilterCount > 0 && <button onClick={clearAll} className="text-xs text-brand-600 font-bold">Clear</button>}
            </div>
            <FilterGroups />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center gap-2 mb-4 sm:mb-5 overflow-x-auto no-scrollbar -mx-[1.1rem] px-[1.1rem] sm:mx-0 sm:px-0 sm:flex-wrap sm:overflow-visible">
            <button onClick={() => setMobileFilters(true)} className="lg:hidden btn-ghost !py-2 !px-3.5 text-sm relative shrink-0">
              <SlidersHorizontal size={16} /> Filters
              {activeFilterCount > 0 && <span className="ml-1 bg-brand-500 text-white text-[10px] font-bold w-4 h-4 grid place-items-center rounded-full">{activeFilterCount}</span>}
            </button>
            <Chip active={quick === 'bestseller'} onClick={() => setQuick(quick === 'bestseller' ? 'none' : 'bestseller')}>⭐ Bestsellers</Chip>
            <Chip active={quick === 'sale'} onClick={() => setQuick(quick === 'sale' ? 'none' : 'sale')}>🏷️ On Sale</Chip>
            <span className="hidden sm:block text-sm text-ink-500 ml-1">{list.length} products</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort products"
              className="shrink-0 sm:ml-auto bg-white border border-ink-200 rounded-full px-4 py-2 text-sm font-semibold outline-none focus:border-brand-400">
              <option value="popular">Most popular</option>
              <option value="rating">Top rated</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </div>

          {list.length === 0 ? (
            <div className="card p-12 text-center">
              <p className="text-4xl mb-2">🐾</p>
              <p className="font-bold text-ink-900">No products match your filters.</p>
              <button onClick={clearAll} className="btn-ghost mt-4 mx-auto">Clear filters</button>
            </div>
          ) : (
            <>
              {/* Phone view toggle: 2-up (detailed) or 3-up (compact) */}
              <div className="sm:hidden flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-ink-500">{list.length} products</span>
                <div className="flex items-center gap-0.5 bg-white rounded-full p-0.5 ring-1 ring-ink-200">
                  {[['2', LayoutGrid], ['3', Grid3x3]].map(([c, Icon]) => (
                    <button key={c} onClick={() => pickCols(c)} aria-label={`${c} per row`} aria-pressed={cols === c}
                      className={`w-8 h-7 grid place-items-center rounded-full transition ${cols === c ? 'bg-brand-500 text-white' : 'text-ink-500'}`}>
                      <Icon size={15} />
                    </button>
                  ))}
                </div>
              </div>
              <div className={`grid md:grid-cols-3 ${cols === '3' ? 'grid-cols-3 gap-2' : 'grid-cols-2 gap-3'} sm:grid-cols-2 sm:gap-5`}>
                {list.map((p, i) => (
                  <div key={p.id} className="min-w-0" style={{ animation: `fade-up .45s ${Math.min(i, 8) * 0.04}s both` }}>
                    <ProductCard product={p} size={cols === '3' ? 'compact' : 'default'} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFilters(false)} />
          <div className="absolute right-0 top-0 h-full w-80 max-w-[88%] bg-white p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-semibold text-xl">Filter &amp; sort</h3>
              <button onClick={() => setMobileFilters(false)} className="p-1"><X size={22} /></button>
            </div>
            <h4 className="font-bold text-sm mb-2">Categories</h4>
            <CategoryList />
            <div className="border-t border-ink-100 my-5" />
            <FilterGroups />
            <div className="flex gap-3 mt-7 sticky bottom-0 bg-white pt-3">
              <button onClick={clearAll} className="btn-ghost flex-1">Clear</button>
              <button onClick={() => setMobileFilters(false)} className="btn-primary flex-1">Show {list.length}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick}
      className={`shrink-0 whitespace-nowrap px-3.5 py-2 rounded-full text-sm font-semibold border transition active:scale-95 ${active ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-ink-700 border-ink-200 hover:border-brand-300'}`}>
      {children}
    </button>
  )
}
