import { Link, NavLink, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { ShoppingCart, Heart, User, Search, Menu, X, Phone, ChevronRight, Package, LogIn, Camera, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useCart } from '@/store/cart'
import { useWishlist } from '@/store/wishlist'
import { useAuth } from '@/store/auth'
import Logo, { LogoMark } from './Logo'
import { soundOn, setSoundOn, playSound } from '@/lib/feedback'

const PHONES = ['7620377278', '8982826363']

const catNav = [
  { to: '/products', label: 'All Products', slug: '', emoji: '🐾' },
  { to: '/category/dry-food', label: 'Dry Food', slug: 'dry-food', emoji: '🦴' },
  { to: '/category/wet-food', label: 'Wet Food', slug: 'wet-food', emoji: '🍲' },
  { to: '/category/treats', label: 'Treats', slug: 'treats', emoji: '🍪' },
  { to: '/category/health', label: 'Health', slug: 'health', emoji: '💊' },
  { to: '/category/apparel', label: 'Apparel', slug: 'apparel', emoji: '🧥' },
  { to: '/category/bedding', label: 'Beds', slug: 'bedding', emoji: '🛏️' },
]

const PROMO = ['🐾 Free delivery on orders over ₹999', '📸 Can’t find a medicine? Send us a photo', '🎁 Use WAGGY10 for 10% off your first order', '💵 COD & UPI available across India']

export default function Header() {
  const count = useCart((s) => s.count())
  const wish = useWishlist((s) => s.ids.length)
  const user = useAuth((s) => s.user)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [promo, setPromo] = useState(0)
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const activeCat = pathname.startsWith('/category/') ? pathname.split('/')[2] : pathname === '/products' ? '' : null
  const accountTo = user ? (user.role === 'admin' ? '/admin' : '/account') : '/login'

  useEffect(() => { setOpen(false) }, [pathname, params])
  useEffect(() => {
    const t = setInterval(() => setPromo((p) => (p + 1) % PROMO.length), 3500)
    return () => clearInterval(t)
  }, [])
  // On phones, tuck the search + category rows away while scrolling down
  const [tucked, setTucked] = useState(false)
  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (Math.abs(y - last) < 8) return
      setTucked(y > 140 && y > last)
      last = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const submit = (e) => {
    e.preventDefault()
    nav(`/search?q=${encodeURIComponent(q)}`)
    setOpen(false)
  }

  return (
    <>
      <header className="sticky top-0 z-40">
        {/* Utility bar — rotating promo on mobile */}
        <div className="bg-pine-800 text-white/90 text-xs">
          <div className="container-x flex items-center justify-between h-8 sm:h-9 gap-3">
            <span key={promo} className="animate-fade-in font-semibold truncate sm:hidden">{PROMO[promo]}</span>
            <span className="hidden sm:inline font-medium">Free delivery over ₹999 · COD & UPI available</span>
            <a href={`tel:${PHONES[0]}`} className="hidden sm:flex items-center gap-1.5 font-semibold hover:text-brand-300 shrink-0">
              <Phone size={13} /> Call us: {PHONES[0]}
              <span className="hidden md:inline text-white/50">·</span>
              <span className="hidden md:inline">{PHONES[1]}</span>
            </a>
          </div>
        </div>

        {/* Main bar */}
        <div className="bg-white/95 backdrop-blur border-b border-ink-100">
          <div className="container-x flex items-center gap-2 sm:gap-4 h-14 sm:h-[68px]">
            <button onClick={() => setOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-ink-50 active:scale-90 transition" aria-label="Open menu">
              <Menu size={22} />
            </button>

            <Link to="/" className="shrink-0 min-w-0 text-[1.3rem] min-[360px]:text-[1.4rem] sm:text-2xl" aria-label="AnimalVeda home">
              <Logo size={34} className="sm:[&>svg]:w-10 sm:[&>svg]:h-10" />
            </Link>

            <form onSubmit={submit} className="hidden md:flex items-center flex-1 max-w-xl mx-2">
              <div className="flex items-center w-full bg-sand-100 rounded-full px-4 ring-1 ring-transparent focus-within:ring-brand-300 focus-within:bg-white transition">
                <Search size={19} className="text-ink-500" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search dog food, treats, beds…"
                  className="w-full bg-transparent py-2.5 px-2.5 text-sm outline-none" />
                <button type="submit" className="text-sm font-bold text-brand-600 shrink-0 pl-2">Search</button>
              </div>
            </form>

            <div className="flex items-center ml-auto">
              {/* Cart lives in the bottom bar on phones; account stays up here */}
              <Link to="/wishlist" className="relative p-2 sm:p-2.5 rounded-xl hover:bg-sand-100" aria-label="Wishlist">
                <Heart size={21} />
                {wish > 0 && <Badge>{wish}</Badge>}
              </Link>
              <Link to="/cart" data-cart-target className="hidden lg:block relative p-2 sm:p-2.5 rounded-xl hover:bg-sand-100" aria-label={`Cart, ${count} items`}>
                <ShoppingCart size={22} />
                {count > 0 && <Badge key={count}>{count}</Badge>}
              </Link>
              <Link to={accountTo} className="relative flex items-center gap-2 p-2 sm:p-2.5 -mr-2 lg:mr-0 rounded-xl hover:bg-sand-100" aria-label={user ? 'My account' : 'Login'}>
                <User size={22} />
                {user && <span className="lg:hidden absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-green-500 ring-2 ring-white" aria-hidden="true" />}
                <span className="hidden lg:block text-sm font-semibold max-w-[90px] truncate">{user ? user.name.split(' ')[0] : 'Login'}</span>
              </Link>
            </div>
          </div>

          {/* Mobile: search row + category pills (collapse on scroll-down) */}
          <div className={`lg:hidden grid transition-[grid-template-rows,opacity] duration-300 ${tucked || pathname === '/checkout' ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}>
          <div className="overflow-hidden">
          <div className="md:hidden container-x pb-2.5 space-y-2.5">
            <form onSubmit={submit} className="flex items-center bg-sand-100 rounded-xl px-3 ring-1 ring-ink-100 focus-within:ring-brand-300 focus-within:bg-white transition">
              <Search size={18} className="text-ink-500 shrink-0" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ‘Dry Food’, ‘Treats’…"
                className="w-full min-w-0 bg-transparent py-2.5 px-2 outline-none" enterKeyHint="search" />
            </form>
          </div>
          <div className="lg:hidden">
            <div className="container-x flex gap-2 overflow-x-auto no-scrollbar pb-2.5">
              <Link to="/request-medicine"
                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition active:scale-95 ${pathname === '/request-medicine' ? 'bg-pine-800 border-pine-800 text-white' : 'bg-pine-50 border-pine-200 text-pine-800'}`}>
                <Camera size={13} /> Request
              </Link>
              {catNav.map((l) => {
                const on = activeCat === l.slug
                return (
                  <Link key={l.label} to={l.to}
                    className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition active:scale-95
                      ${on ? 'bg-brand-500 border-brand-500 text-white shadow-[0_6px_14px_-6px_rgba(248,131,11,.8)]' : 'bg-white border-ink-200 text-ink-700'}`}>
                    <span>{l.emoji}</span>{l.slug ? l.label : 'All'}
                  </Link>
                )
              })}
            </div>
          </div>
          </div>
          </div>

          {/* Desktop category strip */}
          <div className="hidden lg:block border-t border-ink-100">
            <div className="container-x flex items-center gap-1 h-11">
              <NavLink to="/" end className={({ isActive }) =>
                `relative px-3 py-1.5 text-sm font-bold transition ${isActive ? 'text-brand-600' : 'text-ink-700 hover:text-brand-600'}`}>
                Home
              </NavLink>
              {catNav.map((l) => {
                const on = activeCat === l.slug
                return (
                  <Link key={l.label} to={l.to}
                    className={`relative px-3 py-1.5 text-sm font-semibold transition after:absolute after:left-3 after:right-3 after:-bottom-[7px] after:h-[3px] after:rounded-full after:bg-brand-500 after:transition-transform after:origin-left
                      ${on ? 'text-brand-600 after:scale-x-100' : 'text-ink-700 hover:text-brand-600 after:scale-x-0 hover:after:scale-x-100'}`}>
                    {l.label}
                  </Link>
                )
              })}
              <Link to="/request-medicine" className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold bg-pine-800 text-white hover:bg-pine-700 transition">
                <Camera size={15} /> Request a medicine
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile slide-in drawer */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="animate-fade-in absolute inset-0 bg-ink-900/50 backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <aside className="animate-drawer absolute left-0 top-0 h-full w-[84%] max-w-[320px] bg-white flex flex-col shadow-2xl">
            <div className="bg-gradient-to-br from-pine-700 to-pine-900 text-white p-5 pb-6">
              <div className="flex items-start justify-between">
                <LogoMark size={44} />
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-full bg-white/15 active:scale-90 transition" aria-label="Close menu"><X size={20} /></button>
              </div>
              <p className="font-display text-xl font-semibold mt-3">{user ? `Hi, ${user.name.split(' ')[0]} 👋` : 'Welcome to AnimalVeda'}</p>
              {user
                ? <Link to={accountTo} className="text-sm text-white/85 font-semibold inline-flex items-center gap-1 mt-0.5"><Package size={14} /> My orders & account</Link>
                : <Link to="/login" className="mt-3 inline-flex items-center gap-1.5 bg-brand-500 text-white font-bold text-sm px-4 py-2 rounded-full"><LogIn size={15} /> Login / Sign up</Link>}
            </div>
            <nav className="flex-1 overflow-y-auto p-3">
              <Link to="/request-medicine" className="flex items-center gap-3 m-1 mb-3 p-3 rounded-2xl bg-brand-50 ring-1 ring-brand-200">
                <span className="w-10 h-10 rounded-xl bg-brand-500 text-white grid place-items-center shrink-0"><Camera size={19} /></span>
                <span className="min-w-0"><span className="block font-bold text-sm text-ink-900">Request a medicine / product</span>
                  <span className="block text-xs text-ink-500">Not on the site? Send a photo, we’ll source it.</span></span>
              </Link>
              <p className="px-3 pt-2 pb-1.5 text-[11px] font-extrabold tracking-widest text-ink-500 uppercase">Shop by category</p>
              {catNav.map((l, i) => (
                <Link key={l.label} to={l.to} style={{ animation: `fade-up .4s ${0.04 * i + 0.1}s both` }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold ${activeCat === l.slug ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-sand-100'}`}>
                  <span className="w-9 h-9 rounded-full bg-sand-100 grid place-items-center">{l.emoji}</span>
                  <span className="flex-1">{l.label}</span>
                  <ChevronRight size={16} className="text-ink-500" />
                </Link>
              ))}
            </nav>
            <div className="border-t border-ink-100 p-4 space-y-2">
              <SoundToggle />
              {PHONES.map((p) => (
                <a key={p} href={`tel:${p}`} className="flex items-center gap-2 text-sm font-semibold text-pine-700"><Phone size={15} /> {p}</a>
              ))}
            </div>
          </aside>
        </div>
      )}
    </>
  )
}

function Badge({ children }) {
  return (
    <span className="animate-pop absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full bg-brand-500 text-white text-[10px] font-bold ring-2 ring-white">
      {children}
    </span>
  )
}

function SoundToggle() {
  const [on, setOn] = useState(soundOn())
  const flip = () => { const v = !on; setOn(v); setSoundOn(v); if (v) playSound('inc') }
  return (
    <button onClick={flip} className="flex items-center gap-2 text-sm font-semibold text-ink-700">
      {on ? <Volume2 size={16} /> : <VolumeX size={16} />} Sound effects: {on ? 'On' : 'Off'}
    </button>
  )
}
