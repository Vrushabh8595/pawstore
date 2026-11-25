import { Link } from 'react-router-dom'
import { ArrowRight, Truck, ShieldCheck, Headset, Leaf } from 'lucide-react'
import { products, categories } from '@/data/products'
import ProductCard from '@/components/ProductCard'

export default function Home() {
  const bestsellers = products.filter((p) => p.tags.includes('bestseller')).slice(0, 4)
  const fresh = products.slice(0, 8)

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-50 to-[#fff]">
        <div className="container-x grid md:grid-cols-2 gap-8 items-center py-14 md:py-20">
          <div>
            <span className="inline-block bg-brand-100 text-brand-700 text-xs font-bold px-3 py-1 rounded-full mb-4">
              Vet-approved nutrition
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold leading-[1.1] text-ink-900">
              Food your dog will <span className="text-brand-600">wag</span> for.
            </h1>
            <p className="mt-4 text-ink-500 text-lg max-w-md">
              Premium dry food, wet meals and treats — made with real meat, delivered to your door with COD & UPI.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/shop" className="btn-primary">Shop now <ArrowRight size={18} /></Link>
              <Link to="/shop?cat=puppy" className="btn-ghost">Puppy range</Link>
            </div>
            <div className="mt-6 flex items-center gap-6 text-sm text-ink-500">
              <span>★★★★★ <b className="text-ink-900">4.8</b>/5</span>
              <span><b className="text-ink-900">12,000+</b> happy dogs</span>
            </div>
          </div>
          <div className="relative">
            <img src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=75"
              alt="Happy dog" className="rounded-3xl w-full aspect-[4/3] object-cover shadow-xl" />
            <div className="absolute -bottom-5 -left-3 card p-4 shadow-lg flex items-center gap-3">
              <span className="grid place-items-center w-11 h-11 rounded-xl bg-brand-100 text-brand-600"><Truck size={22} /></span>
              <div><p className="font-bold text-sm">Free delivery</p><p className="text-xs text-ink-500">on orders over ₹999</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-[#ecece7] bg-white">
        <div className="container-x grid grid-cols-2 md:grid-cols-4 gap-6 py-6">
          {[
            [Truck, 'Fast delivery', 'Across India in 2–5 days'],
            [ShieldCheck, 'Safe payments', 'UPI, COD & cards soon'],
            [Leaf, 'Real ingredients', 'No artificial colours'],
            [Headset, 'Pet support', 'Mon–Sat, 10am–7pm'],
          ].map(([Icon, h, s]) => (
            <div key={h} className="flex items-center gap-3">
              <span className="grid place-items-center w-11 h-11 rounded-xl bg-brand-50 text-brand-600 shrink-0"><Icon size={20} /></span>
              <div><p className="font-bold text-sm">{h}</p><p className="text-xs text-ink-500">{s}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="container-x py-12">
        <h2 className="text-2xl font-extrabold mb-6">Shop by category</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map((c) => (
            <Link key={c.slug} to={`/shop?cat=${c.slug}`}
              className="card p-5 text-center hover:border-brand-300 hover:shadow-md transition">
              <div className="w-14 h-14 mx-auto rounded-full bg-brand-50 grid place-items-center text-2xl mb-2">
                {{ 'dry-food': '🦴', 'wet-food': '🍲', treats: '🍪', puppy: '🐶', supplements: '💊' }[c.slug]}
              </div>
              <p className="font-bold text-sm">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="container-x py-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-extrabold">Bestsellers</h2>
          <Link to="/shop" className="text-brand-600 font-bold text-sm flex items-center gap-1">View all <ArrowRight size={16} /></Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {bestsellers.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* CTA band */}
      <section className="container-x py-12">
        <div className="rounded-3xl bg-ink-900 text-white p-8 md:p-12 grid md:grid-cols-2 gap-6 items-center">
          <div>
            <h3 className="text-2xl md:text-3xl font-extrabold">New here? Get 10% off your first order.</h3>
            <p className="text-white/60 mt-2">Use code <b className="text-brand-300">WAGGY10</b> at checkout. Dummy demo code.</p>
          </div>
          <div className="md:text-right">
            <Link to="/shop" className="btn-primary">Start shopping <ArrowRight size={18} /></Link>
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="container-x py-4">
        <h2 className="text-2xl font-extrabold mb-6">Fresh picks</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {fresh.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </div>
  )
}
