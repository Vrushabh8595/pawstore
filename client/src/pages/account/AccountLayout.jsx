import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Package, User, LogOut } from 'lucide-react'
import { useAuth } from '@/store/auth'

export default function AccountLayout() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const nav = useNavigate()

  const item = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50'}`

  return (
    <div className="container-x py-8 grid lg:grid-cols-[240px_1fr] gap-8">
      <aside className="h-fit">
        <div className="card p-5 mb-4">
          <p className="font-extrabold truncate">{user?.name}</p>
          <p className="text-sm text-ink-500 truncate">{user?.email}</p>
        </div>
        <nav className="card p-2 space-y-1">
          <NavLink to="/account" end className={item}><Package size={18} /> My Orders</NavLink>
          <NavLink to="/account/profile" className={item}><User size={18} /> Profile</NavLink>
          <button onClick={() => { logout(); nav('/') }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm text-red-600 hover:bg-red-50">
            <LogOut size={18} /> Logout
          </button>
        </nav>
      </aside>
      <div><Outlet /></div>
    </div>
  )
}
