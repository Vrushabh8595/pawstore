import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ShoppingCart, Heart, User, Search, Menu, X, PawPrint, Phone, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '@/store/cart'
import { useWishlist } from '@/store/wishlist'
import { useAuth } from '@/store/auth'

const PHONES = ['7620377278', '8982826363']

const catNav = [
  { to: '/shop', label: 'All Products', end: false },
  { to: '/shop?cat=dry-food', label: 'Dry Food' },
  { to: '/shop?cat=wet-food', label: 'Wet Food' },
  { to: '/shop?cat=treats', label: 'Treats' },
  { to: '/shop?cat=health', label: 'Health' },
  { to: '/shop?cat=apparel', label: 'Apparel' },
  { to: '/shop?cat=bedding', label: 'Beds' },
]

export default function Header() {
  const count = useCart((s) => s.count())
  const wish = useWishlist((s) => s.ids.length)
  const user = useAuth((s) => s.user)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const nav = useNavigate()

  const submit = (e) => {
    e.preventDefault()
    nav(`/shop?q=${encodeURIComponent(q)}`)
    setOpen(false)
  }

  return (
    <header className="sticky top-0 z-40">
      {/* Utility bar */}
      <div className="bg-pine-800 text-white/90 text-xs">
        <div className="container-x flex items-center justify-between h-9">
          <span className="hidden sm:inline font-medium">Free delivery over ₹999 · COD & UPI available</span>
          <span className="sm:hidden font-medium">Free delivery over ₹999</span>
          <a href={`tel:${PHONES[0]}`} className="flex items-center gap-1.5 font-semibold hover:text-brand-300">
            <Phone size={13} />
            <span className="hidden sm:inline">Call us:</span>
            <span>{PHONES[0]}</span>
            <span className="hidden md:inline text-white/50">·</span>
            <span className="hidden md:inline">{PHONES[1]}</span>
          </a>
        </div>
      </div>

      {/* Main bar */}
      <div className="bg-white/95 backdrop-blur border-b border-ink-100">
        <div className="container-x flex items-center gap-4 h-[68px]">
          <button onClick={() => setOpen((o) => !o)} className="lg:hidden p-2 -ml-1 rounded-lg hover:bg-ink-50" aria-label="Menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/" className="flex items-center gap-2 font-display font-bold text-2xl text-ink-900 shrink-0">
            <span className="grid place-items-center w-10 h-10 rounded-2xl bg-brand-500 text-white shadow-[0_6px_16px_-6px_rgba(248,131,11,.7)]">
              <PawPrint size={21} />
            </span>
            Paw<span className="text-brand-600">Store</span>
          </Link>

          <form onSubmit={submit} className="hidden md:flex items-center flex-1 max-w-xl mx-2">
            <div className="flex items-center w-full bg-sand-100 rounded-full px-4 ring-1 ring-transparent focus-within:ring-brand-300 transition">
              <Search size={19} className="text-ink-500" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dog food, treats, beds…"
                className="w-full bg-transparent py-2.5 px-2.5 text-sm outline-none" />
              <button type="submit" className="text-sm font-bold text-brand-600 shrink-0 pl-2">Search</button>
            </div>
          </form>

          <div className="flex items-center gap-0.5 ml-auto">
            <Link to="/wishlist" className="relative p-2.5 rounded-xl hover:bg-sand-100" aria-label="Wishlist">
              <Heart size={21} />
              {wish > 0 && <Badge>{wish}</Badge>}
            </Link>
            <Link to="/cart" className="relative p-2.5 rounded-xl hover:bg-sand-100" aria-label="Cart">
              <ShoppingCart size={21} />
              {count > 0 && <Badge>{count}</Badge>}
            </Link>
            <Link to={user ? (user.role === 'admin' ? '/admin' : '/account') : '/login'}
              className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-sand-100" aria-label="Account">
              <User size={21} />
              <span className="hidden sm:block text-sm font-semibold max-w-[90px] truncate">{user ? user.name.split(' ')[0] : 'Login'}</span>
            </Link>
          </div>
        </div>

        {/* Category strip */}
        <div className="hidden lg:block border-t border-ink-100">
          <div className="container-x flex items-center gap-1 h-11">
            <NavLink to="/" end className={({ isActive }) =>
              `px-3 py-1.5 rounded-full text-sm font-bold ${isActive ? 'text-brand-600' : 'text-ink-700 hover:text-brand-600'}`}>
              Home
            </NavLink>
            {catNav.map((l) => (
              <NavLink key={l.label} to={l.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-full text-sm font-semibold ${isActive ? 'text-brand-600' : 'text-ink-700 hover:text-brand-600'}`}>
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden border-b border-ink-100 bg-white px-4 py-3 space-y-1 shadow-sm">
          <form onSubmit={submit} className="flex items-center bg-sand-100 rounded-full px-4 mb-2">
            <Search size={18} className="text-ink-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
              className="w-full bg-transparent py-2.5 px-2 text-sm outline-none" />
          </form>
          {[{ to: '/', label: 'Home', end: true }, ...catNav].map((l) => (
            <Link key={l.label} to={l.to} onClick={() => setOpen(false)}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-ink-700 hover:bg-sand-100">
              {l.label} <ChevronRight size={16} className="text-ink-500" />
            </Link>
          ))}
          <a href={`tel:${PHONES[0]}`} className="flex items-center gap-2 px-3 py-2.5 rounded-xl font-semibold text-pine-700">
            <Phone size={16} /> {PHONES[0]} · {PHONES[1]}
          </a>
        </div>
      )}
    </header>
  )
}

function Badge({ children }) {
  return (
    <span className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-brand-500 text-white text-[10px] font-bold ring-2 ring-white">
      {children}
    </span>
  )
}
