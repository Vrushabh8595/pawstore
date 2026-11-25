import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom'
import { LayoutDashboard, ShoppingBag, Package, LogOut, Dog, Store } from 'lucide-react'
import { useAuth } from '@/store/auth'

export default function AdminLayout() {
  const logout = useAuth((s) => s.logout)
  const nav = useNavigate()
  const item = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm ${isActive ? 'bg-brand-500 text-white' : 'text-white/70 hover:bg-white/10'}`

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[240px_1fr] bg-[#f5f5f2]">
      <aside className="bg-ink-900 text-white p-4 flex flex-col">
        <Link to="/admin" className="flex items-center gap-2 font-extrabold text-lg px-2 py-2">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-500"><Dog size={20} /></span>
          Paw<span className="text-brand-400">Admin</span>
        </Link>
        <nav className="mt-6 space-y-1 flex-1">
          <NavLink to="/admin" end className={item}><LayoutDashboard size={18} /> Overview</NavLink>
          <NavLink to="/admin/orders" className={item}><ShoppingBag size={18} /> Orders</NavLink>
          <NavLink to="/admin/products" className={item}><Package size={18} /> Products</NavLink>
        </nav>
        <Link to="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/10"><Store size={18} /> View store</Link>
        <button onClick={() => { logout(); nav('/') }} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/10"><LogOut size={18} /> Logout</button>
      </aside>
      <main className="p-5 md:p-8 overflow-x-hidden">
        <Outlet />
      </main>
    </div>
  )
}
