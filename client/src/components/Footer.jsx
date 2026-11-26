import Logo from './Logo'
import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, MessageCircle, Send, Globe } from 'lucide-react'

const PHONES = ['7620377278', '8982826363']

export default function Footer() {
  const cols = [
    { h: 'Shop', links: [['All Products', '/products'], ['Dry Food', '/category/dry-food'], ['Wet Food', '/category/wet-food'], ['Treats', '/category/treats'], ['Apparel', '/category/apparel'], ['Beds & Bedding', '/category/bedding']] },
    { h: 'Help', links: [['Track Order', '/account'], ['Shipping Policy', '/shipping-policy'], ['Refund Policy', '/refund-policy'], ['Contact Us', '/contact-us']] },
    { h: 'Company', links: [['About Us', '/about-us'], ['Privacy Policy', '/privacy-policy'], ['Terms', '/terms-and-conditions']] },
  ]
  return (
    <footer className="mt-24 bg-pine-900 text-white/75">
      {/* Trust strip */}
      <div className="border-b border-white/10">
        <div className="container-x grid grid-cols-2 md:grid-cols-4 gap-6 py-7 text-sm">
          {[['🚚', 'Free delivery', 'over ₹999'], ['🔄', 'Easy returns', 'within 7 days'], ['🔒', 'Secure payments', 'UPI · COD'], ['🐾', 'Vet-approved', 'real ingredients']].map(([e, h, s]) => (
            <div key={h} className="flex items-center gap-3">
              <span className="text-2xl">{e}</span>
              <div><p className="font-bold text-white">{h}</p><p className="text-white/55 text-xs">{s}</p></div>
            </div>
          ))}
        </div>
      </div>

      <div className="container-x py-14 grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)_1.3fr]">
        <div>
          <Logo size={56} className="mb-3" />
          <p className="text-sm text-white/55 max-w-xs">Vet medicines, nutrition and care for pets, livestock and every animal you love. Can’t find a medicine? Send us a photo — we’ll source it.</p>
          <div className="flex gap-2 mt-5">
            {[MessageCircle, Send, Globe].map((Icon, i) => (
              <a key={i} href="#" className="w-9 h-9 grid place-items-center rounded-full bg-white/10 hover:bg-brand-500 transition" aria-label="social">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        {cols.map((c) => (
          <div key={c.h}>
            <h4 className="text-white font-bold mb-4 text-sm">{c.h}</h4>
            <ul className="space-y-2.5 text-sm">
              {c.links.map(([label, to]) => (
                <li key={label}><Link to={to} className="hover:text-brand-300 transition">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h4 className="text-white font-bold mb-4 text-sm">Get in touch</h4>
          <ul className="space-y-3 text-sm">
            {PHONES.map((p) => (
              <li key={p}>
                <a href={`tel:${p}`} className="flex items-center gap-2.5 hover:text-brand-300 transition">
                  <span className="w-8 h-8 grid place-items-center rounded-full bg-white/10 shrink-0"><Phone size={14} /></span>
                  <span className="font-semibold text-white">{p}</span>
                </a>
              </li>
            ))}
            <li className="flex items-center gap-2.5">
              <span className="w-8 h-8 grid place-items-center rounded-full bg-white/10 shrink-0"><Mail size={14} /></span>
              <span>care@animalveda.com</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="w-8 h-8 grid place-items-center rounded-full bg-white/10 shrink-0"><MapPin size={14} /></span>
              <span className="text-white/55 text-xs leading-relaxed">Mon–Sat, 10am–7pm<br />Shipping across India</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/45">
          <span>© {new Date().getFullYear()} AnimalVeda. All rights reserved.</span>
          <span>Pay with UPI · COD · Cards (coming soon)</span>
        </div>
      </div>
    </footer>
  )
}
