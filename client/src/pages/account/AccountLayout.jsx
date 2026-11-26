import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Package, User, LogOut } from 'lucide-react'
import { useAuth } from '@/store/auth'

export default function AccountLayout() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const nav = useNavigate()

  const item = ({ isActive }) =>
    `flex items-center justify-center lg:justify-start gap-1.5 lg:gap-3 px-1.5 lg:px-4 py-2.5 rounded-xl font-semibold text-[13px] lg:text-sm whitespace-nowrap ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50'}`

  return (
    <div className="container-x py-5 sm:py-8 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-5 lg:gap-8">
      <aside className="h-fit min-w-0">
        <div className="card p-4 sm:p-5 mb-3 sm:mb-4 flex items-center gap-3">
          <span className="grid place-items-center w-11 h-11 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white font-extrabold shrink-0">
            {(user?.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()}
          </span>
          <span className="min-w-0">
            <span className="block font-extrabold truncate">{user?.name}</span>
            <span className="block text-sm text-ink-500 truncate">{user?.email}</span>
          </span>
        </div>
        {/* Phones: one row of tabs. Desktop: stacked menu. */}
        <nav className="card p-1.5 lg:p-2 grid grid-cols-3 gap-1 lg:block lg:space-y-1">
          <NavLink to="/account" end className={item}><Package size={18} /> My Orders</NavLink>
          <NavLink to="/account/profile" className={item}><User size={18} /> Profile</NavLink>
          <button onClick={() => { logout(); nav('/') }} className="w-full flex items-center justify-center lg:justify-start gap-2 lg:gap-3 px-2 lg:px-4 py-2.5 rounded-xl font-semibold text-sm text-red-600 hover:bg-red-50">
            <LogOut size={18} /> Logout
          </button>
        </nav>
      </aside>
      <div className="min-w-0"><Outlet /></div>
    </div>
  )
}
