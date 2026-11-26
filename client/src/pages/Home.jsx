import { Link } from 'react-router-dom'
import { ArrowRight, Truck, ShieldCheck, Leaf, HeartHandshake, Camera } from 'lucide-react'
import { LogoMark } from '@/components/Logo'
import { products, categories } from '@/data/products'
import ProductCard from '@/components/ProductCard'
import ProductRail from '@/components/ProductRail'
import HeroCarousel from '@/components/HeroCarousel'
import DoorstepCare from '@/components/DoorstepCare'

const CAT_EMOJI = {
  'dry-food': '🦴', 'wet-food': '🍲', treats: '🍪',
  'collars-leashes': '🦮', health: '💊', apparel: '🧥', bedding: '🛏️',
}
const CAT_TINT = ['bg-brand-50', 'bg-pine-50', 'bg-sand-100', 'bg-brand-50', 'bg-pine-50', 'bg-sand-100', 'bg-brand-50']

const NEED_TILES = [
  { to: '/category/dry-food', title: 'Everyday Meals', copy: 'Complete dry nutrition', emoji: '🥣', from: 'bg-gradient-to-br from-brand-100 to-brand-50' },
  { to: '/category/wet-food', title: 'Wet & Gravy', copy: 'Tempting, tender meals', emoji: '🍲', from: 'bg-gradient-to-br from-pine-100 to-pine-50' },
  { to: '/category/treats', title: 'Treats & Rewards', copy: 'For the very good boys', emoji: '🍪', from: 'bg-gradient-to-br from-sand-200 to-sand-100' },
  { to: '/category/bedding', title: 'Comfort & Beds', copy: 'Cosy naps, happy pups', emoji: '🛏️', from: 'bg-gradient-to-br from-brand-100 to-sand-100' },
]

const PROMOS = [
  { to: '/category/dry-food', label: 'Dry Food', from: 'From ₹299', emoji: '🦴' },
  { to: '/category/treats', label: 'Treats', from: 'From ₹99', emoji: '🍪' },
  { to: '/category/health', label: 'Health & Recovery', from: 'From ₹199', emoji: '💊' },
  { to: '/category/apparel', label: 'Winter Apparel', from: 'From ₹449', emoji: '🧥' },
]

export default function Home() {
  const picked = products.filter((p) => p.tags?.includes('bestseller'))
  const bestsellers = (picked.length ? picked : products).slice(0, 8)
  const under300 = products.filter((p) => p.variants[0].price <= 300).slice(0, 6)
  const fresh = products.slice(0, 8)


  return (
    <div>
      <HeroCarousel />

      {/* ---------- Category circles overlapping the banner ---------- */}
      <section className="container-x">
        <div className="relative mt-5 sm:mt-6 bg-white rounded-[1.75rem] ring-1 ring-ink-100 shadow-[0_18px_40px_-28px_rgba(26,26,23,.4)] px-4 sm:px-6 pt-5 pb-5">
          <div className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar sm:grid sm:grid-cols-7">
            {categories.map((c, i) => (
              <Link key={c.slug} to={`/category/${c.slug}`} className="group flex flex-col items-center gap-2 shrink-0 w-[76px] sm:w-auto">
                <span className={`w-[68px] h-[68px] sm:w-[72px] sm:h-[72px] rounded-full grid place-items-center text-3xl ${CAT_TINT[i % CAT_TINT.length]} ring-1 ring-ink-100 group-hover:ring-brand-300 group-hover:-translate-y-1 transition shadow-sm`}>
                  {CAT_EMOJI[c.slug] || '🐾'}
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-center text-ink-700 group-hover:text-brand-600 leading-tight">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Request a product ---------- */}
      <section className="container-x pt-6 sm:pt-8">
        <Link to="/request-medicine" className="group relative flex items-center gap-4 sm:gap-6 overflow-hidden rounded-[1.6rem] bg-pine-800 text-white p-4 sm:p-7 active:scale-[.99] transition">
          <span aria-hidden="true" className="absolute -right-10 -top-12 w-44 h-44 rounded-full bg-pine-600/60" />
          <span aria-hidden="true" className="absolute right-24 -bottom-16 w-32 h-32 rounded-full bg-brand-500/25" />
          <LogoMark size={64} className="relative shrink-0 animate-float sm:w-20 sm:h-20" />
          <div className="relative flex-1 min-w-0">
            <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-[.14em] text-brand-300">Medicine · Food · Custom</p>
            <p className="font-display text-lg sm:text-3xl font-semibold leading-tight mt-0.5">Can’t find what your animal needs?</p>
            <p className="text-white/70 text-xs sm:text-base mt-1">Send us a photo. We’ll source it & get back with a price.</p>
          </div>
          <span className="relative hidden sm:inline-flex items-center gap-2 bg-brand-500 text-white font-extrabold px-5 py-3 rounded-full group-hover:gap-3 transition-all shrink-0">
            <Camera size={18} /> Request now
          </span>
          <span className="relative sm:hidden grid place-items-center w-10 h-10 rounded-full bg-brand-500 shrink-0"><Camera size={18} /></span>
        </Link>
      </section>

      {/* ---------- Shop by need ---------- */}
      <section className="container-x pt-8 pb-8 sm:pt-12 sm:pb-12">
        <h2 className="text-xl sm:text-3xl font-semibold mb-4 sm:mb-7">Who are we shopping for today?</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {NEED_TILES.map((t) => (
            <Link key={t.title} to={t.to}
              className={`group relative rounded-[1.4rem] p-4 sm:p-6 overflow-hidden ${t.from} ring-1 ring-ink-100 hover:shadow-lg active:scale-[.98] transition min-h-[140px] sm:min-h-[160px] flex flex-col justify-between`}>
              <span className="text-4xl">{t.emoji}</span>
              <div>
                <p className="font-display font-semibold text-lg text-ink-900 leading-tight">{t.title}</p>
                <p className="text-sm text-ink-500 mt-0.5">{t.copy}</p>
                <span className="inline-flex items-center gap-1 text-brand-700 font-bold text-sm mt-2 group-hover:gap-2 transition-all">Shop now <ArrowRight size={15} /></span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Bestsellers ---------- */}
      <section className="container-x pb-4">
        <div className="flex items-end justify-between mb-3 sm:mb-7">
          <div>
            <p className="eyebrow mb-1">Loved by pups</p>
            <h2 className="text-xl sm:text-3xl font-semibold">Bestsellers</h2>
          </div>
          <Link to="/products" className="text-brand-600 font-bold text-sm flex items-center gap-1 shrink-0">View all <ArrowRight size={16} /></Link>
        </div>
        <ProductRail products={bestsellers} scroll />
      </section>

      {/* ---------- Under ₹300: 3-up compact grid on phones ---------- */}
      {under300.length > 0 && (
        <section className="container-x pt-8 sm:pt-12">
          <div className="rounded-[1.75rem] bg-gradient-to-br from-brand-50 to-sand-100 ring-1 ring-brand-100 p-3.5 sm:p-7">
            <div className="flex items-end justify-between mb-3 sm:mb-5 px-0.5">
              <div>
                <p className="eyebrow mb-0.5">Pocket-friendly</p>
                <h2 className="text-xl sm:text-3xl font-semibold">Everything under ₹300</h2>
              </div>
              <Link to="/products?sort=price-asc" className="text-brand-600 font-bold text-sm flex items-center gap-1 shrink-0">See all <ArrowRight size={16} /></Link>
            </div>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
              {under300.map((p) => <ProductCard key={p.id} product={p} size="compact" />)}
            </div>
          </div>
        </section>
      )}

      {/* ---------- Why AnimalVeda ---------- */}
      <section className="container-x pt-14 pb-2">
        <div className="relative overflow-hidden rounded-[2rem] bg-pine-900 text-white p-5 sm:p-12">
          <div className="absolute -bottom-20 -right-16 w-80 h-80 rounded-full bg-pine-700/40 blur-3xl" />
          <div className="relative">
            <p className="eyebrow !text-brand-300 mb-2">Why AnimalVeda</p>
            <h2 className="font-display text-2xl sm:text-4xl font-semibold max-w-xl leading-tight">Good food, great comfort, zero nasties.</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mt-6 sm:mt-9">
              {[
                [Leaf, 'Real ingredients', 'Meat first, no artificial colours or fillers'],
                [ShieldCheck, 'Vet-approved', 'Formulated with canine nutritionists'],
                [Truck, 'Fast, free delivery', 'Across India, free over ₹999'],
                [HeartHandshake, 'Pet-parent support', 'All 7 days, weekends too'],
              ].map(([Icon, h, s]) => (
                <div key={h} className="bg-white/5 rounded-2xl p-3.5 sm:p-5 ring-1 ring-white/10 min-w-0">
                  <span className="grid place-items-center w-11 h-11 rounded-xl bg-brand-500 text-white mb-3"><Icon size={21} /></span>
                  <p className="font-bold text-white">{h}</p>
                  <p className="text-sm text-white/60 mt-1">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Coming soon: doorstep care ---------- */}
      <DoorstepCare />

      {/* ---------- Promo rail ---------- */}
      <section className="container-x pb-4">
        <h2 className="text-xl sm:text-3xl font-semibold mb-4 sm:mb-7">Deals worth a tail wag</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {PROMOS.map((p) => (
            <Link key={p.label} to={p.to}
              className="card p-3 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 hover:border-brand-300 hover:shadow-md transition">
              <span className="w-14 h-14 rounded-2xl bg-sand-100 grid place-items-center text-2xl shrink-0">{p.emoji}</span>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-ink-500">{p.label}</p>
                <p className="font-display font-semibold text-lg text-ink-900 leading-tight">{p.from}</p>
                <span className="text-brand-600 font-bold text-sm">Shop now →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Fresh picks ---------- */}
      <section className="container-x pt-10 pb-4">
        <div className="flex items-end justify-between mb-3 sm:mb-7">
          <div>
            <p className="eyebrow mb-1">Just in</p>
            <h2 className="text-xl sm:text-3xl font-semibold">Fresh picks</h2>
          </div>
          <Link to="/products" className="text-brand-600 font-bold text-sm flex items-center gap-1 shrink-0">View all <ArrowRight size={16} /></Link>
        </div>
        <ProductRail products={fresh} scroll />
      </section>

      {/* ---------- Newsletter CTA ---------- */}
      <section className="container-x py-14">
        <div className="rounded-[2rem] bg-brand-500 text-white p-6 sm:p-12 grid lg:grid-cols-2 gap-6 items-center">
          <div>
            <p className="eyebrow !text-white/80 mb-2">Join the pack</p>
            <h3 className="font-display text-2xl sm:text-4xl font-semibold leading-tight">Get 10% off your first order.</h3>
            <p className="text-white/85 mt-2">Use code <b className="bg-white/20 px-2 py-0.5 rounded">WAGGY10</b> at checkout. New pet parents only.</p>
          </div>
          <div className="lg:text-right">
            <Link to="/products" className="inline-flex items-center gap-2 bg-white text-brand-600 font-bold px-6 py-3 rounded-full hover:bg-sand-50 transition">
              Start shopping <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
