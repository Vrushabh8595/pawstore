import { Link } from 'react-router-dom'
import { Dog } from 'lucide-react'

export default function Footer() {
  const cols = [
    { h: 'Shop', links: [['All Products', '/shop'], ['Dry Food', '/shop?cat=dry-food'], ['Wet Food', '/shop?cat=wet-food'], ['Treats', '/shop?cat=treats'], ['Puppy', '/shop?cat=puppy']] },
    { h: 'Help', links: [['Track Order', '/account'], ['Shipping Policy', '/policy/shipping'], ['Refund Policy', '/policy/refund'], ['Contact', '/policy/contact']] },
    { h: 'Company', links: [['About Us', '/policy/about'], ['Privacy Policy', '/policy/privacy'], ['Terms', '/policy/terms']] },
  ]
  return (
    <footer className="mt-20 bg-ink-900 text-white/80">
      <div className="container-x py-12 grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2 font-extrabold text-xl text-white mb-3">
            <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-500"><Dog size={20} /></span>
            PawStore
          </div>
          <p className="text-sm text-white/60 max-w-xs">Premium, vet-approved dog food and treats delivered across India. Happy tummies, waggy tails.</p>
        </div>
        {cols.map((c) => (
          <div key={c.h}>
            <h4 className="text-white font-bold mb-3 text-sm">{c.h}</h4>
            <ul className="space-y-2 text-sm">
              {c.links.map(([label, to]) => (
                <li key={label}><Link to={to} className="hover:text-brand-300">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-x py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/50">
          <span>© {new Date().getFullYear()} PawStore. Demo store with dummy products.</span>
          <span>Pay with UPI · COD · Cards (coming soon)</span>
        </div>
      </div>
    </footer>
  )
}
