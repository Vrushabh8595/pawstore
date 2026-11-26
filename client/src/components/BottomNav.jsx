import { Link, useLocation } from 'react-router-dom'
import { Home, LayoutGrid, BadgePercent, ShoppingCart } from 'lucide-react'
import { useCart } from '@/store/cart'
import { LogoMark } from './Logo'
import { haptic } from '@/lib/feedback'

// Bottom tab bar (phones only). Wishlist & account live in the top bar; the
// raised centre button opens "Request a medicine / product".
export default function BottomNav() {
  const count = useCart((s) => s.count())
  const { pathname } = useLocation()

  const items = [
    { to: '/', label: 'Home', Icon: Home, active: pathname === '/' },
    { to: '/products', label: 'Categories', Icon: LayoutGrid, active: ['/products', '/search'].includes(pathname) || pathname.startsWith('/category/') || pathname.startsWith('/product/') },
    { to: '/request-medicine', label: 'Request', center: true, active: pathname === '/request-medicine' },
    { to: '/offers', label: 'Offers', Icon: BadgePercent, active: pathname === '/offers' },
    { to: '/cart', label: 'Cart', Icon: ShoppingCart, active: pathname === '/cart' || pathname === '/checkout', badge: count, cartTarget: true },
  ]
  const activeIdx = items.findIndex((i) => i.active)

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-ink-100 shadow-[0_-6px_24px_-10px_rgba(17,37,58,.25)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} aria-label="Primary">
      <div className="relative grid grid-cols-5 h-16">
        {/* Sliding active indicator (hidden under the centre button) */}
        <span aria-hidden="true"
          className="absolute top-0 h-[3px] w-[20%] transition-[transform,opacity] duration-300 ease-[cubic-bezier(.34,1.56,.64,1)]"
          style={{ transform: `translateX(${Math.max(activeIdx, 0) * 100}%)`, opacity: activeIdx < 0 || items[activeIdx]?.center ? 0 : 1 }}>
          <span className="block mx-auto w-9 h-full rounded-b-full bg-brand-500" />
        </span>

        {items.map(({ to, label, Icon, active, center, badge, cartTarget }) => center ? (
          <Link key={label} to={to} aria-current={active ? 'page' : undefined} onClick={() => haptic(10)}
            className="relative flex flex-col items-center justify-end pb-1.5 text-[10.5px] font-bold text-pine-800">
            <span className={`absolute -top-5 grid place-items-center w-[58px] h-[58px] rounded-full bg-white p-[3px] shadow-[0_8px_20px_-6px_rgba(17,37,58,.55)] transition active:scale-90 ${active ? 'ring-4 ring-brand-400' : 'ring-4 ring-white'}`}>
              <LogoMark size={52} className={active ? 'animate-pop' : ''} />
              <span className="absolute -right-0.5 -top-0.5 w-5 h-5 rounded-full bg-pine-800 text-white text-[11px] font-black grid place-items-center ring-2 ring-white">+</span>
            </span>
            <span className={active ? 'text-brand-600' : ''}>{label}</span>
          </Link>
        ) : (
          <Link key={label} to={to} aria-current={active ? 'page' : undefined} onClick={() => haptic(6)}
            aria-label={badge ? `${label}, ${badge} items` : undefined}
            className={`relative flex flex-col items-center justify-center gap-0.5 text-[10.5px] font-bold transition-colors active:scale-90 ${active ? 'text-brand-600' : 'text-ink-500'}`}>
            <span {...(cartTarget ? { 'data-cart-target': '' } : {})}
              className={`relative grid place-items-center w-12 h-7 rounded-full transition-colors duration-300 ${active ? 'bg-brand-100' : ''}`}>
              <Icon key={active ? 'on' : 'off'} size={21} strokeWidth={active ? 2.4 : 1.9}
                className={active ? 'animate-pop fill-brand-500/20' : ''} />
              {badge > 0 && (
                <span key={badge} className="animate-pop absolute -top-1 right-1 min-w-[17px] h-[17px] px-1 grid place-items-center rounded-full bg-brand-500 text-white text-[9.5px] font-bold ring-2 ring-white">{badge}</span>
              )}
            </span>
            {label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
