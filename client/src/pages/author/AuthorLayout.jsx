import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { FileText, PenLine, LogOut, Globe } from 'lucide-react'
import { useAuth } from '@/store/auth'
import Logo from '@/components/Logo'
import Avatar from '@/components/Avatar'
import { NotificationBell } from '@/components/Notifications'

// Author dashboard shell (blog writers). Admins can open it too.
export default function AuthorLayout() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const nav = useNavigate()
  const item = ({ isActive }) => `inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold ${isActive ? 'bg-brand-500 text-white' : 'text-ink-700 hover:bg-sand-100'}`
  return (
    <div className="min-h-screen bg-sand-50">
      <header className="bg-white border-b border-ink-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link to="/author" aria-label="Author dashboard"><Logo className="h-8" /></Link>
          <span className="hidden sm:inline text-[10px] font-extrabold uppercase tracking-[.16em] text-brand-700 bg-brand-50 rounded-full px-2.5 py-1">Author</span>
          <nav className="ml-2 hidden sm:flex gap-1">
            <NavLink to="/author" end className={item}><FileText size={16} /> My posts</NavLink>
            <NavLink to="/author/posts/new" className={item}><PenLine size={16} /> New post</NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <a href="/blog" target="_blank" rel="noopener" className="p-2 rounded-xl hover:bg-sand-100" title="View blog"><Globe size={20} /></a>
            {user?.role !== 'admin' && <NotificationBell />}
            <Avatar user={user} size={32} />
            <button onClick={async () => { await logout(); nav('/author/login') }} className="p-2 rounded-xl hover:bg-sand-100" title="Log out" aria-label="Log out"><LogOut size={19} /></button>
          </div>
        </div>
        <nav className="sm:hidden flex gap-1 px-4 pb-2">
          <NavLink to="/author" end className={item}><FileText size={16} /> My posts</NavLink>
          <NavLink to="/author/posts/new" className={item}><PenLine size={16} /> New post</NavLink>
        </nav>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6"><Outlet /></main>
    </div>
  )
}
