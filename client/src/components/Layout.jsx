import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import BottomNav from './BottomNav'
import { useSeo } from '@/lib/useSeo'
import { useTracking } from '@/lib/track'
import { useAuth } from '@/store/auth'
import { NotificationAlerts } from './Notifications'

export default function Layout() {
  const { pathname } = useLocation()
  useSeo()
  useTracking()
  // Checkout has its own sticky "place order" bar on phones
  const hideBottomNav = pathname === '/checkout'
  const user = useAuth((s) => s.user)
  return (
    <div className="min-h-screen flex flex-col overflow-x-clip">
      <Header />
      <main className="flex-1 bg-sand-50">
        <Outlet />
      </main>
      <Footer />
      {/* Phone spacer so the footer's last line clears the fixed bottom bar / checkout bar */}
      <div aria-hidden="true" className="lg:hidden bg-pine-900" style={{ height: `calc(${hideBottomNav ? '5.5rem' : '6.75rem'} + env(safe-area-inset-bottom))` }} />
      {!hideBottomNav && <BottomNav />}
      {user && user.role !== 'admin' && <NotificationAlerts />}
      <ScrollRestoration />
    </div>
  )
}
