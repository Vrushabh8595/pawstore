import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import BottomNav from './BottomNav'

export default function Layout() {
  const { pathname } = useLocation()
  // Checkout has its own sticky "place order" bar on phones
  const hideBottomNav = pathname === '/checkout'
  return (
    <div className="min-h-screen flex flex-col overflow-x-clip">
      <Header />
      <main className={`flex-1 ${hideBottomNav ? 'pb-24' : 'pb-20'} lg:pb-0`}>
        <Outlet />
      </main>
      <Footer />
      {!hideBottomNav && <BottomNav />}
      <ScrollRestoration />
    </div>
  )
}
