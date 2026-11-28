import { useEffect, useState } from 'react'
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard, ShoppingBag, Package, LogOut, Store, Inbox, Users, BarChart3, Menu, X, Star, Wallet, PenLine } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { api } from '@/lib/api'
import Logo from '@/components/Logo'
import { NotificationAlerts, NotificationBell, AdminAlertSetup } from '@/components/Notifications'
import EmailStatus from './EmailStatus'

const NAV = [
  ['/admin', 'Dashboard', LayoutDashboard, true],
  ['/admin/orders', 'Orders', ShoppingBag],
  ['/admin/profit', 'Profit & loss', Wallet],
  ['/admin/users', 'Users', Users],
  ['/admin/traffic', 'Traffic', BarChart3],
  ['/admin/products', 'Products', Package],
  ['/admin/blog', 'Blog', PenLine],
  ['/admin/reviews', 'Reviews', Star],
  ['/admin/requests', 'Requests', Inbox],
]

export default function AdminLayout() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const nav = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  useEffect(() => { setOpen(false) }, [pathname])
  const live = useQuery({ queryKey: ['admin-live'], queryFn: () => api.get('/admin/live'), refetchInterval: 10_000 })
  const pendingPosts = useQuery({ queryKey: ['admin-blog'], queryFn: () => api.get('/admin/blog/posts'), refetchInterval: 60_000 }).data?.counts?.pending || 0
  const pendingReviews = useQuery({ queryKey: ['admin-reviews', 'pending'], queryFn: () => api.get('/admin/reviews?status=pending'), refetchInterval: 60_000 }).data?.counts?.pending || 0

  const item = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition ${isActive ? 'bg-brand-500 text-white shadow-[0_8px_20px_-10px_rgba(248,131,11,.9)]' : 'text-white/70 hover:bg-white/10 hover:text-white'}`

  const Side = (
    <div className="h-full bg-pine-900 text-white p-4 flex flex-col">
      <Link to="/admin" className="px-2 py-2 flex items-center gap-2">
        <Logo light className="h-8" />
      </Link>
      <span className="mx-2 mt-1 w-fit text-[10px] font-extrabold uppercase tracking-[.16em] text-brand-300 bg-white/5 rounded-full px-2.5 py-1">Admin panel</span>

      <Link to="/admin/traffic" className="mx-1 mt-4 flex items-center gap-3 rounded-2xl bg-white/5 ring-1 ring-white/10 px-4 py-3 hover:bg-white/10 transition">
        <span className="relative flex w-3 h-3"><span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-60" /><span className="relative w-3 h-3 rounded-full bg-green-400" /></span>
        <span className="text-sm"><b className="text-white text-lg leading-none">{live.data?.count ?? '…'}</b> <span className="text-white/60">live on site</span></span>
      </Link>

      <nav className="mt-5 space-y-1 flex-1">
        {NAV.map(([to, label, Icon, end]) => (
          <NavLink key={to} to={to} end={end} className={item}>
            <Icon size={18} /> {label}
            {to === '/admin/blog' && pendingPosts > 0 && <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-amber-400 text-pine-900 text-[11px] font-extrabold grid place-items-center">{pendingPosts}</span>}
            {to === '/admin/reviews' && pendingReviews > 0 && <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-amber-400 text-pine-900 text-[11px] font-extrabold grid place-items-center">{pendingReviews}</span>}
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-white/10 pt-3 space-y-1">
        <p className="px-4 text-xs text-white/50 truncate">Signed in as {user?.email}</p>
        <Link to="/" className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/10"><Store size={18} /> View store</Link>
        <button onClick={() => { logout(); nav('/') }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-white/70 hover:bg-white/10"><LogOut size={18} /> Logout</button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-sand-50 md:grid md:grid-cols-[250px_1fr]">
      <aside className="hidden md:block sticky top-0 h-screen">{Side}</aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 bg-pine-900 text-white flex items-center gap-3 px-4 h-14">
        <button onClick={() => setOpen(true)} aria-label="Open admin menu" className="p-1.5 -ml-1.5"><Menu size={22} /></button>
        <Logo light className="h-7" />
        <NotificationBell admin className="ml-auto" />
        <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/10 rounded-full px-2.5 py-1">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />{live.data?.count ?? '…'} live
        </span>
      </header>
      {open && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[78%] max-w-[280px] animate-drawer">
            <button onClick={() => setOpen(false)} aria-label="Close" className="absolute right-3 top-3 z-10 text-white/70"><X size={20} /></button>
            {Side}
          </div>
        </div>
      )}

      <main className="p-4 sm:p-6 lg:p-8 min-w-0">
        {/* Desktop top bar: greeting + alerts bell */}
        <div className="hidden md:flex items-center gap-3 -mx-6 lg:-mx-8 -mt-6 lg:-mt-8 mb-6 px-6 lg:px-8 py-2.5 sticky top-0 z-30 bg-sand-50/90 backdrop-blur border-b border-ink-100">
          <p className="text-sm text-ink-500">Hi <b className="text-ink-900">{user?.name?.split(' ')[0] || 'Admin'}</b> 👋</p>
          <Link to="/admin/orders?status=Pending%20Verification" className="ml-auto text-xs font-bold text-ink-700 hover:text-brand-600">Pending orders</Link>
          <div className="rounded-xl bg-pine-900"><NotificationBell admin /></div>
        </div>
        <AdminAlertSetup />
        {['/admin', '/admin/orders'].includes(pathname) && <EmailStatus />}
        <Outlet />
      </main>
      <NotificationAlerts admin />
    </div>
  )
}
