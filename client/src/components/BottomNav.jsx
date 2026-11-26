import { NavLink } from 'react-router-dom'
import { Home, LayoutGrid, Percent, ShoppingCart, User } from 'lucide-react'
import { useCart } from '@/store/cart'
import { useAuth } from '@/store/auth'

const items = [
  { to: '/', label: 'Home', Icon: Home, end: true },
  { to: '/shop', label: 'Shop', Icon: LayoutGrid },
  { to: '/shop?sort=price-asc', label: 'Offers', Icon: Percent },
  { to: '/cart', label: 'Cart', Icon: ShoppingCart, cart: true },
]

export default function BottomNav() {
  const count = useCart((s) => s.count())
  const user = useAuth((s) => s.user)
  const accountTo = user ? (user.role === 'admin' ? '/admin' : '/account') : '/login'

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-ink-100 shadow-[0_-4px_20px_-8px_rgba(26,26,23,.15)]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="grid grid-cols-5 h-16">
        {items.map(({ to, label, Icon, end, cart }) => (
          <NavLink key={label} to={to} end={end}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${isActive ? 'text-brand-600' : 'text-ink-500'}`}>
            {({ isActive }) => (
              <>
                <span className="relative">
                  <Icon size={22} strokeWidth={isActive ? 2.4 : 2} />
                  {cart && count > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 grid place-items-center rounded-full bg-brand-500 text-white text-[9px] font-bold ring-2 ring-white">{count}</span>
                  )}
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
        <NavLink to={accountTo}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${isActive ? 'text-brand-600' : 'text-ink-500'}`}>
          {({ isActive }) => (
            <>
              <User size={22} strokeWidth={isActive ? 2.4 : 2} />
              Account
            </>
          )}
        </NavLink>
      </div>
    </nav>
  )
}
