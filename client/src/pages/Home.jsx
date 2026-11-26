import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Truck, ShieldCheck, Leaf, HeartHandshake, ChevronLeft, ChevronRight } from 'lucide-react'
import { products, categories } from '@/data/products'
import ProductCard from '@/components/ProductCard'

const CAT_EMOJI = {
  'dry-food': '🦴', 'wet-food': '🍲', treats: '🍪',
  'collars-leashes': '🦮', health: '💊', apparel: '🧥', bedding: '🛏️',
}
const CAT_TINT = ['bg-brand-50', 'bg-pine-50', 'bg-sand-100', 'bg-brand-50', 'bg-pine-50', 'bg-sand-100', 'bg-brand-50']

const HERO = [
  { eyebrow: '✦ Winter Comfort Collection', title: 'Feels like a hug', sub: 'Cosy beds, warm sweaters & hearty winter meals.', cta: 'Shop winter', to: '/shop?cat=apparel', grad: 'from-pine-100 to-sand-100', img: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1100&q=70' },
  { eyebrow: '✦ Everyday Nutrition', title: 'Food they’ll wag for', sub: 'Vet-approved meals made with real meat, first.', cta: 'Shop food', to: '/shop?cat=dry-food', grad: 'from-brand-100 to-sand-100', img: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=1100&q=70' },
  { eyebrow: '✦ Treats & Rewards', title: 'Good boys deserve more', sub: 'Tasty, healthy and tail-wag approved.', cta: 'Shop treats', to: '/shop?cat=treats', grad: 'from-sand-200 to-brand-50', img: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1100&q=70' },
]

const NEED_TILES = [
  { to: '/shop?cat=dry-food', title: 'Everyday Meals', copy: 'Complete dry nutrition', emoji: '🥣', from: 'bg-gradient-to-br from-brand-100 to-brand-50' },
  { to: '/shop?cat=wet-food', title: 'Wet & Gravy', copy: 'Tempting, tender meals', emoji: '🍲', from: 'bg-gradient-to-br from-pine-100 to-pine-50' },
  { to: '/shop?cat=treats', title: 'Treats & Rewards', copy: 'For the very good boys', emoji: '🍪', from: 'bg-gradient-to-br from-sand-200 to-sand-100' },
  { to: '/shop?cat=bedding', title: 'Comfort & Beds', copy: 'Cosy naps, happy pups', emoji: '🛏️', from: 'bg-gradient-to-br from-brand-100 to-sand-100' },
]

const PROMOS = [
  { to: '/shop?cat=dry-food', label: 'Dry Food', from: 'From ₹299', emoji: '🦴' },
  { to: '/shop?cat=treats', label: 'Treats', from: 'From ₹99', emoji: '🍪' },
  { to: '/shop?cat=health', label: 'Health & Recovery', from: 'From ₹199', emoji: '💊' },
  { to: '/shop?cat=apparel', label: 'Winter Apparel', from: 'From ₹449', emoji: '🧥' },
]

export default function Home() {
  const picked = products.filter((p) => p.tags?.includes('bestseller'))
  const bestsellers = (picked.length ? picked : products).slice(0, 4)
  const fresh = products.slice(0, 8)

  const [slide, setSlide] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % HERO.length), 5500)
    return () => clearInterval(t)
  }, [])
  const go = (d) => setSlide((s) => (s + d + HERO.length) % HERO.length)

  return (
    <div>
      {/* ---------- Hero banner carousel ---------- */}
      <section className="container-x pt-5">
        <div className="relative rounded-[2rem] overflow-hidden h-[320px] sm:h-[420px] shadow-sm">
          {HERO.map((h, i) => (
            <div key={i}
              className={`absolute inset-0 bg-gradient-to-r ${h.grad} transition-opacity duration-700 ${i === slide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
              <img src={h.img} alt="" aria-hidden="true"
                className="absolute right-0 top-0 h-full w-[62%] object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-sand-100)] via-[var(--color-sand-100)]/85 to-transparent" />
              <div className="relative h-full flex flex-col justify-center max-w-md px-7 sm:px-12">
                <span className="text-xs font-extrabold tracking-wide text-pine-700 mb-2">{h.eyebrow}</span>
                <h1 className="font-display text-4xl sm:text-6xl font-semibold leading-[1.02] text-ink-900">{h.title}</h1>
                <p className="mt-3 text-ink-700 sm:text-lg max-w-xs">{h.sub}</p>
                <Link to={h.to} className="btn-primary mt-6 w-fit">{h.cta} <ArrowRight size={18} /></Link>
              </div>
            </div>
          ))}

          <button onClick={() => go(-1)} aria-label="Previous"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center rounded-full bg-white/85 hover:bg-white shadow-md transition">
            <ChevronLeft size={22} />
          </button>
          <button onClick={() => go(1)} aria-label="Next"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 grid place-items-center rounded-full bg-white/85 hover:bg-white shadow-md transition">
            <ChevronRight size={22} />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {HERO.map((_, i) => (
              <button key={i} onClick={() => setSlide(i)} aria-label={`Slide ${i + 1}`}
                className={`h-2 rounded-full transition-all ${i === slide ? 'w-6 bg-brand-500' : 'w-2 bg-white/80'}`} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Category circles overlapping the banner ---------- */}
      <section className="container-x">
        <div className="relative -mt-8 sm:-mt-10 bg-white rounded-[1.75rem] ring-1 ring-ink-100 shadow-[0_18px_40px_-28px_rgba(26,26,23,.4)] px-4 sm:px-6 pt-5 pb-5">
          <div className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar sm:grid sm:grid-cols-7">
            {categories.map((c, i) => (
              <Link key={c.slug} to={`/shop?cat=${c.slug}`} className="group flex flex-col items-center gap-2 shrink-0 w-[76px] sm:w-auto">
                <span className={`w-[68px] h-[68px] sm:w-[72px] sm:h-[72px] rounded-full grid place-items-center text-3xl ${CAT_TINT[i % CAT_TINT.length]} ring-1 ring-ink-100 group-hover:ring-brand-300 group-hover:-translate-y-1 transition shadow-sm`}>
                  {CAT_EMOJI[c.slug] || '🐾'}
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-center text-ink-700 group-hover:text-brand-600 leading-tight">{c.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Shop by need ---------- */}
      <section className="container-x py-12">
        <h2 className="text-2xl sm:text-3xl font-semibold mb-7">Who are we shopping for today?</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {NEED_TILES.map((t) => (
            <Link key={t.title} to={t.to}
              className={`group relative rounded-[1.4rem] p-6 overflow-hidden ${t.from} ring-1 ring-ink-100 hover:shadow-lg transition min-h-[160px] flex flex-col justify-between`}>
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
        <div className="flex items-end justify-between mb-7">
          <div>
            <p className="eyebrow mb-1">Loved by pups</p>
            <h2 className="text-2xl sm:text-3xl font-semibold">Bestsellers</h2>
          </div>
          <Link to="/shop" className="text-brand-600 font-bold text-sm flex items-center gap-1 shrink-0">View all <ArrowRight size={16} /></Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {bestsellers.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* ---------- Why PawStore ---------- */}
      <section className="container-x py-14">
        <div className="relative overflow-hidden rounded-[2rem] bg-pine-900 text-white p-8 sm:p-12">
          <div className="absolute -bottom-20 -right-16 w-80 h-80 rounded-full bg-pine-700/40 blur-3xl" />
          <div className="relative">
            <p className="eyebrow !text-brand-300 mb-2">Why PawStore</p>
            <h2 className="font-display text-2xl sm:text-4xl font-semibold max-w-xl leading-tight">Good food, great comfort, zero nasties.</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mt-9">
              {[
                [Leaf, 'Real ingredients', 'Meat first, no artificial colours or fillers'],
                [ShieldCheck, 'Vet-approved', 'Formulated with canine nutritionists'],
                [Truck, 'Fast, free delivery', 'Across India, free over ₹999'],
                [HeartHandshake, 'Pet-parent support', 'Mon–Sat, 10am–7pm on call'],
              ].map(([Icon, h, s]) => (
                <div key={h} className="bg-white/5 rounded-2xl p-5 ring-1 ring-white/10">
                  <span className="grid place-items-center w-11 h-11 rounded-xl bg-brand-500 text-white mb-3"><Icon size={21} /></span>
                  <p className="font-bold text-white">{h}</p>
                  <p className="text-sm text-white/60 mt-1">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Promo rail ---------- */}
      <section className="container-x pb-4">
        <h2 className="text-2xl sm:text-3xl font-semibold mb-7">Deals worth a tail wag</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {PROMOS.map((p) => (
            <Link key={p.label} to={p.to}
              className="card p-5 flex items-center gap-4 hover:border-brand-300 hover:shadow-md transition">
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
        <div className="flex items-end justify-between mb-7">
          <div>
            <p className="eyebrow mb-1">Just in</p>
            <h2 className="text-2xl sm:text-3xl font-semibold">Fresh picks</h2>
          </div>
          <Link to="/shop" className="text-brand-600 font-bold text-sm flex items-center gap-1 shrink-0">View all <ArrowRight size={16} /></Link>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {fresh.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* ---------- Newsletter CTA ---------- */}
      <section className="container-x py-14">
        <div className="rounded-[2rem] bg-brand-500 text-white p-8 sm:p-12 grid lg:grid-cols-2 gap-6 items-center">
          <div>
            <p className="eyebrow !text-white/80 mb-2">Join the pack</p>
            <h3 className="font-display text-2xl sm:text-4xl font-semibold leading-tight">Get 10% off your first order.</h3>
            <p className="text-white/85 mt-2">Use code <b className="bg-white/20 px-2 py-0.5 rounded">WAGGY10</b> at checkout. New pet parents only.</p>
          </div>
          <div className="lg:text-right">
            <Link to="/shop" className="inline-flex items-center gap-2 bg-white text-brand-600 font-bold px-6 py-3 rounded-full hover:bg-sand-50 transition">
              Start shopping <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
