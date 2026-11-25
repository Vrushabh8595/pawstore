import { Link, NavLink, useNavigate } from 'react-router-dom'
import { ShoppingCart, Heart, User, Search, Menu, X, Dog } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '@/store/cart'
import { useWishlist } from '@/store/wishlist'
import { useAuth } from '@/store/auth'

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

  const links = [
    { to: '/', label: 'Home', end: true },
    { to: '/shop', label: 'Shop' },
    { to: '/shop?cat=treats', label: 'Treats' },
    { to: '/shop?cat=puppy', label: 'Puppy' },
  ]

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-[#ecece7]">
      <div className="bg-brand-600 text-white text-center text-xs py-1.5 font-medium">
        Free delivery on orders over ₹999 · COD & UPI available
      </div>
      <div className="container-x flex items-center gap-4 h-16">
        <Link to="/" className="flex items-center gap-2 font-extrabold text-xl text-ink-900 shrink-0">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-500 text-white"><Dog size={20} /></span>
          Paw<span className="text-brand-600">Store</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-2">
          {links.map((l) => (
            <NavLink key={l.label} to={l.to} end={l.end}
              className={({ isActive }) =>
                `px-3 py-2 rounded-lg text-sm font-semibold ${isActive ? 'text-brand-600' : 'text-ink-700 hover:text-brand-600'}`
              }>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={submit} className="hidden lg:flex items-center flex-1 max-w-sm ml-auto">
          <div className="flex items-center w-full bg-ink-50 rounded-xl px-3">
            <Search size={18} className="text-ink-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dog food, treats…"
              className="w-full bg-transparent py-2.5 px-2 text-sm outline-none" />
          </div>
        </form>

        <div className="flex items-center gap-1 ml-auto lg:ml-3">
          <Link to="/wishlist" className="relative p-2 rounded-lg hover:bg-ink-50" aria-label="Wishlist">
            <Heart size={21} />
            {wish > 0 && <Badge>{wish}</Badge>}
          </Link>
          <Link to="/cart" className="relative p-2 rounded-lg hover:bg-ink-50" aria-label="Cart">
            <ShoppingCart size={21} />
            {count > 0 && <Badge>{count}</Badge>}
          </Link>
          <Link to={user ? (user.role === 'admin' ? '/admin' : '/account') : '/login'}
            className="hidden sm:flex items-center gap-2 p-2 rounded-lg hover:bg-ink-50" aria-label="Account">
            <User size={21} />
            <span className="text-sm font-semibold max-w-[90px] truncate">{user ? user.name : 'Login'}</span>
          </Link>
          <button onClick={() => setOpen((o) => !o)} className="md:hidden p-2 rounded-lg hover:bg-ink-50" aria-label="Menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-[#ecece7] bg-white px-4 py-3 space-y-1">
          <form onSubmit={submit} className="flex items-center bg-ink-50 rounded-xl px-3 mb-2">
            <Search size={18} className="text-ink-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…"
              className="w-full bg-transparent py-2.5 px-2 text-sm outline-none" />
          </form>
          {links.map((l) => (
            <Link key={l.label} to={l.to} onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-lg font-semibold text-ink-700 hover:bg-ink-50">{l.label}</Link>
          ))}
          <Link to={user ? '/account' : '/login'} onClick={() => setOpen(false)}
            className="block px-3 py-2 rounded-lg font-semibold text-ink-700 hover:bg-ink-50">{user ? 'My Account' : 'Login / Register'}</Link>
        </div>
      )}
    </header>
  )
}

function Badge({ children }) {
  return (
    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-brand-500 text-white text-[10px] font-bold">
      {children}
    </span>
  )
}
