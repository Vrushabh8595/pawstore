import { Link } from 'react-router-dom'
import { ArrowRight, Truck, ShieldCheck, Leaf, HeartHandshake, Sparkles } from 'lucide-react'
import { products, categories } from '@/data/products'
import ProductCard from '@/components/ProductCard'

const CAT_EMOJI = {
  'dry-food': '🦴', 'wet-food': '🍲', treats: '🍪',
  'collars-leashes': '🦮', health: '💊', apparel: '🧥', bedding: '🛏️',
}
const CAT_TINT = ['bg-brand-50', 'bg-pine-50', 'bg-sand-100', 'bg-brand-50', 'bg-pine-50', 'bg-sand-100', 'bg-brand-50']

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

  return (
    <div>
      {/* ---------- Hero ---------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sand-100 to-sand-50">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-200/40 blur-3xl" />
        <div className="container-x relative grid lg:grid-cols-2 gap-10 items-center py-14 lg:py-20">
          <div>
            <span className="chip mb-5"><Sparkles size={13} /> New · Winter comfort collection</span>
            <h1 className="font-display text-[2.6rem] sm:text-6xl font-semibold leading-[1.05] text-ink-900">
              Food they’ll <span className="text-brand-600 italic">wag</span> for.
            </h1>
            <p className="mt-5 text-ink-500 text-lg max-w-md">
              Premium, vet-approved dry food, wet meals, treats and cosy comfort — made with real ingredients and delivered across India with COD &amp; UPI.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/shop" className="btn-primary">Shop now <ArrowRight size={18} /></Link>
              <Link to="/shop?cat=treats" className="btn-ghost">Explore treats</Link>
            </div>
            <div className="mt-8 flex items-center gap-7 text-sm text-ink-500">
              <span className="flex items-center gap-1.5">
                <span className="text-brand-400">{'★★★★★'}</span> <b className="text-ink-900">4.8</b>/5
              </span>
              <span><b className="text-ink-900">12,000+</b> happy dogs</span>
              <span className="hidden sm:inline"><b className="text-ink-900">100%</b> vet-approved</span>
            </div>
          </div>

          <div className="relative">
            <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=75"
              alt="Happy dog" className="rounded-[2rem] w-full aspect-[4/3] object-cover shadow-2xl" />
            <div className="absolute -bottom-5 -left-3 card p-4 shadow-xl flex items-center gap-3">
              <span className="grid place-items-center w-11 h-11 rounded-2xl bg-brand-100 text-brand-600"><Truck size={22} /></span>
              <div><p className="font-bold text-sm">Free delivery</p><p className="text-xs text-ink-500">on orders over ₹999</p></div>
            </div>
            <div className="absolute -top-4 -right-2 card px-4 py-3 shadow-xl hidden sm:flex items-center gap-2">
              <span className="text-xl">🐾</span>
              <div><p className="font-bold text-sm leading-none">Real meat</p><p className="text-xs text-ink-500 mt-0.5">first ingredient</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Category circles ---------- */}
      <section className="container-x py-12">
        <div className="flex items-end justify-between mb-7">
          <div>
            <p className="eyebrow mb-1">Browse</p>
            <h2 className="text-2xl sm:text-3xl font-semibold">Shop by category</h2>
          </div>
          <Link to="/shop" className="text-brand-600 font-bold text-sm flex items-center gap-1 shrink-0">View all <ArrowRight size={16} /></Link>
        </div>
        <div className="flex gap-4 sm:gap-6 overflow-x-auto no-scrollbar pb-2 sm:grid sm:grid-cols-7">
          {categories.map((c, i) => (
            <Link key={c.slug} to={`/shop?cat=${c.slug}`} className="group flex flex-col items-center gap-2.5 shrink-0 w-[88px] sm:w-auto">
              <span className={`w-[76px] h-[76px] sm:w-20 sm:h-20 rounded-full grid place-items-center text-3xl ${CAT_TINT[i % CAT_TINT.length]} ring-1 ring-ink-100 group-hover:ring-brand-300 group-hover:-translate-y-1 transition shadow-sm`}>
                {CAT_EMOJI[c.slug] || '🐾'}
              </span>
              <span className="text-xs font-bold text-center text-ink-700 group-hover:text-brand-600 leading-tight">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ---------- Shop by need ---------- */}
      <section className="container-x py-4">
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
      <section className="container-x pt-14 pb-4">
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
