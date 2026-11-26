import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Phone, Mail, Clock, MessageCircle, Share2, Check, Camera, ArrowRight, ShieldCheck, Truck, RotateCcw, Stethoscope } from 'lucide-react'
import Logo from './Logo'
import { categories } from '@/data/products'

const PHONES = ['7620377278', '8982826363']
const CAT_EMOJI = { 'dry-food': '🦴', 'wet-food': '🍲', treats: '🍪', 'collars-leashes': '🦮', health: '💊', apparel: '🧥', bedding: '🛏️' }

const COLS = [
  { h: 'Quick links', links: [['All products', '/products'], ['Today’s offers', '/offers'], ['Request a medicine', '/request-medicine'], ['Under ₹300', '/products?sort=price-asc'], ['My orders', '/account'], ['Wishlist', '/wishlist']] },
  { h: 'Help', links: [['Track order', '/account'], ['Shipping policy', '/shipping-policy'], ['Refund & returns', '/refund-policy'], ['Contact us', '/contact-us']] },
  { h: 'Company', links: [['About AnimalVeda', '/about-us'], ['Privacy policy', '/privacy-policy'], ['Terms & conditions', '/terms-and-conditions']] },
]
const ANIMALS = [['🐕', 'Dogs'], ['🐈', 'Cats'], ['🐄', 'Cattle'], ['🐐', 'Goats'], ['🐓', 'Poultry'], ['🐎', 'Horses'], ['🦜', 'Birds']]

export default function Footer() {
  return (
    <footer className="mt-32 bg-pine-900 text-white/75">
      {/* Request CTA band */}
      <div className="container-x relative -mt-16 sm:-mt-12">
        <Link to="/request-medicine"
          className="group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 rounded-[1.6rem] bg-gradient-to-r from-brand-500 to-brand-600 text-white p-5 sm:px-8 sm:py-6 shadow-[0_20px_40px_-20px_rgba(224,100,2,.8)]">
          <span className="grid place-items-center w-12 h-12 rounded-2xl bg-white/20 shrink-0"><Camera size={22} /></span>
          <div className="flex-1">
            <p className="font-display text-xl sm:text-2xl font-semibold leading-tight">Can’t find a medicine for your animal?</p>
            <p className="text-white/85 text-sm mt-0.5">Send us a photo of the label or prescription. We’ll source it and call you back.</p>
          </div>
          <span className="inline-flex items-center gap-2 bg-white text-brand-700 font-extrabold text-sm px-5 py-2.5 rounded-full w-fit group-hover:gap-3 transition-all">
            Request now <ArrowRight size={16} />
          </span>
        </Link>
      </div>

      <div className="container-x pt-8">
        {/* Trust strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 pb-10 border-b border-white/10">
          {[[Truck, 'Free delivery', 'On orders over ₹999'], [RotateCcw, 'Easy returns', 'Within 7 days'], [ShieldCheck, 'Secure payments', 'UPI & Cash on delivery'], [Stethoscope, 'Vet-approved', 'Genuine products only']].map(([Icon, h, s]) => (
            <div key={h} className="flex items-center gap-3 rounded-2xl bg-white/5 ring-1 ring-white/10 p-3 sm:p-4">
              <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand-500/15 text-brand-300 shrink-0"><Icon size={19} /></span>
              <div className="min-w-0"><p className="font-bold text-white text-sm">{h}</p><p className="text-white/55 text-xs">{s}</p></div>
            </div>
          ))}
        </div>

        {/* Main grid */}
        <div className="py-12 grid gap-10 grid-cols-2 md:grid-cols-4 lg:grid-cols-[1.4fr_1.1fr_1fr_.8fr_1fr_1.3fr]">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <Logo light className="h-10" />
            <p className="text-sm text-white/60 max-w-sm mt-4 leading-relaxed">
              Vet medicines, nutrition and everyday care for pets, livestock and every animal you love, delivered across India.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              {ANIMALS.map(([e, a]) => (
                <span key={a} className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/5 ring-1 ring-white/10 rounded-full px-2.5 py-1">{e} {a}</span>
              ))}
            </div>
            <SocialButtons />
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 text-sm">Shop by category</h4>
            <ul className="space-y-2.5 text-sm">
              {categories.map((c) => (
                <li key={c.slug}>
                  <Link to={`/category/${c.slug}`} className="inline-flex items-center gap-2 hover:text-brand-300 transition">
                    <span className="text-base leading-none">{CAT_EMOJI[c.slug] || '🐾'}</span>{c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {COLS.map((c) => (
            <div key={c.h}>
              <h4 className="text-white font-bold mb-4 text-sm">{c.h}</h4>
              <ul className="space-y-2.5 text-sm">
                {c.links.map(([label, to]) => (
                  <li key={label}><Link to={to} className="hover:text-brand-300 transition">{label}</Link></li>
                ))}
              </ul>
            </div>
          ))}

          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <h4 className="text-white font-bold mb-4 text-sm">Get in touch</h4>
            <div className="inline-flex items-center gap-2 bg-green-500/15 text-green-300 ring-1 ring-green-400/30 rounded-full px-3 py-1 text-xs font-bold mb-4">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Open all 7 days · weekends too
            </div>
            <p className="text-xs text-white/55 -mt-2 mb-4 leading-relaxed max-w-xs">Missed us on call or no reply yet? We usually get back to you within 2 to 3 days.</p>
            <ul className="space-y-3 text-sm">
              {PHONES.map((p) => (
                <li key={p}>
                  <a href={`tel:${p}`} className="flex items-center gap-2.5 hover:text-brand-300 transition">
                    <span className="w-8 h-8 grid place-items-center rounded-full bg-white/10 shrink-0"><Phone size={14} /></span>
                    <span className="font-semibold text-white">+91 {p}</span>
                  </a>
                </li>
              ))}
              <li>
                <a href="mailto:care@animalveda.com" className="flex items-center gap-2.5 hover:text-brand-300 transition">
                  <span className="w-8 h-8 grid place-items-center rounded-full bg-white/10 shrink-0"><Mail size={14} /></span>
                  care@animalveda.com
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-8 h-8 grid place-items-center rounded-full bg-white/10 shrink-0"><Clock size={14} /></span>
                <span className="text-white/60 text-xs leading-relaxed">Support & orders: 24 hours a day, 365 days a year<br />Delivering across India</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x py-5 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/50">
          <span>© {new Date().getFullYear()} AnimalVeda. All rights reserved. Made with ❤️ in India.</span>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <span className="mr-1">We accept</span>
            {['UPI', 'GPay', 'PhonePe', 'Paytm', 'Cash on delivery'].map((m) => (
              <span key={m} className="bg-white/10 text-white/80 font-bold rounded-md px-2 py-1">{m}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

// Chat on WhatsApp · share the website · email us
function SocialButtons() {
  const [copied, setCopied] = useState(false)
  const site = typeof window !== 'undefined' ? window.location.origin : 'https://animalveda.com'
  const share = async () => {
    const data = { title: 'AnimalVeda', text: 'Vet medicines, food and care for every animal, delivered across India 🐾', url: site }
    try {
      if (navigator.share) { await navigator.share(data); return }
    } catch (e) { if (e?.name === 'AbortError') return }
    try { await navigator.clipboard.writeText(site); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch { window.prompt('Copy this link:', site) }
  }
  const cls = 'relative w-9 h-9 grid place-items-center rounded-full bg-white/10 hover:bg-brand-500 transition'
  return (
    <div className="flex gap-2 mt-5">
      <a href={`https://wa.me/91${PHONES[0]}?text=${encodeURIComponent('Hi AnimalVeda! I have a question.')}`} target="_blank" rel="noopener noreferrer" className={cls} aria-label="Chat with us on WhatsApp" title="Chat on WhatsApp">
        <MessageCircle size={16} />
      </a>
      <button type="button" onClick={share} className={cls} aria-label="Share AnimalVeda" title={copied ? 'Link copied!' : 'Share this website'}>
        {copied ? <Check size={16} /> : <Share2 size={16} />}
        {copied && <span role="status" className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-white text-pine-900 text-[11px] font-bold px-2 py-1 animate-fade-in">Link copied!</span>}
      </button>
      <a href={`mailto:care@animalveda.com?subject=${encodeURIComponent('Hello AnimalVeda')}`} className={cls} aria-label="Email us" title="Email us">
        <Mail size={16} />
      </a>
    </div>
  )
}
