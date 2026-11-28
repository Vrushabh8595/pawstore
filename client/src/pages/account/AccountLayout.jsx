import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Package, User, LogOut, Bell, Star } from 'lucide-react'
import { useNotificationFeed } from '@/components/Notifications'
import { useAuth } from '@/store/auth'
import Avatar from '@/components/Avatar'

export default function AccountLayout() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const nav = useNavigate()
  const { unread } = useNotificationFeed()

  const item = ({ isActive }) =>
    `flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-3 px-1 lg:px-4 py-2 lg:py-2.5 rounded-xl font-semibold text-[11px] lg:text-sm whitespace-nowrap ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50'}`

  return (
    <div className="container-x py-5 sm:py-8 grid grid-cols-1 lg:grid-cols-[240px_minmax(0,1fr)] gap-5 lg:gap-8">
      <aside className="h-fit min-w-0">
        <div className="card p-4 sm:p-5 mb-3 sm:mb-4 flex items-center gap-3">
          <Avatar user={user} size={44} />
          <span className="min-w-0">
            <span className="block font-extrabold truncate">{user?.name}</span>
            <span className="block text-sm text-ink-500 truncate">{user?.email}</span>
          </span>
        </div>
        {/* Phones: one row of tabs. Desktop: stacked menu. */}
        <nav className="card p-1.5 lg:p-2 grid grid-cols-5 gap-1 lg:block lg:space-y-1">
          <NavLink to="/account" end className={item}><Package size={18} className="shrink-0" /> <span>Orders</span></NavLink>
          <NavLink to="/account/notifications" className={item}>
            <span className="relative shrink-0"><Bell size={18} />{unread > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-0.5 rounded-full bg-red-500 text-white text-[9px] font-extrabold grid place-items-center">{unread > 9 ? '9+' : unread}</span>}</span>
            <span>Alerts</span>
          </NavLink>
          <NavLink to="/account/reviews" className={item}><Star size={18} className="shrink-0" /> <span>Reviews</span></NavLink>
          <NavLink to="/account/profile" className={item}><User size={18} className="shrink-0" /> <span>Profile</span></NavLink>
          <button onClick={() => { logout(); nav('/') }} className="w-full flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-3 px-1 lg:px-4 py-2 lg:py-2.5 rounded-xl font-semibold text-[11px] lg:text-sm text-red-600 hover:bg-red-50">
            <LogOut size={18} className="shrink-0" /> <span>Logout</span>
          </button>
        </nav>
      </aside>
      <div className="min-w-0"><Outlet /></div>
    </div>
  )
}
