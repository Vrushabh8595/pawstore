import { Link } from 'react-router-dom'
import { PawPrint, Phone, Mail, MapPin, MessageCircle, Send, Globe } from 'lucide-react'

const PHONES = ['7620377278', '8982826363']

export default function Footer() {
  const cols = [
    { h: 'Shop', links: [['All Products', '/shop'], ['Dry Food', '/shop?cat=dry-food'], ['Wet Food', '/shop?cat=wet-food'], ['Treats', '/shop?cat=treats'], ['Apparel', '/shop?cat=apparel'], ['Beds & Bedding', '/shop?cat=bedding']] },
    { h: 'Help', links: [['Track Order', '/account'], ['Shipping Policy', '/policy/shipping'], ['Refund Policy', '/policy/refund'], ['Contact Us', '/policy/contact']] },
    { h: 'Company', links: [['About Us', '/policy/about'], ['Privacy Policy', '/policy/privacy'], ['Terms', '/policy/terms']] },
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
          <div className="flex items-center gap-2 font-display font-bold text-2xl text-white mb-3">
            <span className="grid place-items-center w-10 h-10 rounded-2xl bg-brand-500"><PawPrint size={21} /></span>
            PawStore
          </div>
          <p className="text-sm text-white/55 max-w-xs">Premium, vet-approved food, treats and comfort for the good boys and girls of India. Happy tummies, waggy tails.</p>
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
              <span>care@pawstore.in</span>
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
          <span>© {new Date().getFullYear()} PawStore. All rights reserved.</span>
          <span>Pay with UPI · COD · Cards (coming soon)</span>
        </div>
      </div>
    </footer>
  )
}
