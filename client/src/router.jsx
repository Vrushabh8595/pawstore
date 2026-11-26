import { createBrowserRouter, Navigate, useParams, useSearchParams } from 'react-router-dom'
import Layout from './components/Layout'
import { useAuth } from './store/auth'

import Home from './pages/Home'
import Shop from './pages/Shop'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Wishlist from './pages/Wishlist'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import Login from './pages/Login'
import Register from './pages/Register'
import Policy from './pages/Policy'
import Request from './pages/Request'
import NotFound from './pages/NotFound'

import AccountLayout from './pages/account/AccountLayout'
import MyOrders from './pages/account/MyOrders'
import OrderDetail from './pages/account/OrderDetail'
import Profile from './pages/account/Profile'

import AdminLayout from './pages/admin/AdminLayout'
import AdminOverview from './pages/admin/Overview'
import AdminOrders from './pages/admin/Orders'
import AdminProducts from './pages/admin/Products'
import AdminRequests from './pages/admin/Requests'

function Protected({ children, role }) {
  const user = useAuth((s) => s.user)
  const ready = useAuth((s) => s.ready)
  if (!ready) return <div className="min-h-screen grid place-items-center text-ink-500">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

// Old query-string URLs → new SEO-friendly paths (Vercel also 308-redirects these)
function LegacyShop() {
  const [p] = useSearchParams()
  if (p.get('cat')) return <Navigate to={`/category/${p.get('cat')}`} replace />
  if (p.get('deal')) return <Navigate to="/offers" replace />
  if (p.get('q')) return <Navigate to={`/search?q=${encodeURIComponent(p.get('q'))}`} replace />
  return <Navigate to="/products" replace />
}
const POLICY_MAP = { about: 'about-us', contact: 'contact-us', shipping: 'shipping-policy', refund: 'refund-policy', privacy: 'privacy-policy', terms: 'terms-and-conditions' }
function LegacyPolicy() {
  const { slug } = useParams()
  return <Navigate to={`/${POLICY_MAP[slug] || ''}`} replace />
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/products', element: <Shop /> },
      { path: '/category/:cat', element: <Shop /> },
      { path: '/offers', element: <Shop /> },
      { path: '/search', element: <Shop /> },
      { path: '/shop', element: <LegacyShop /> },
      { path: '/product/:slug', element: <Product /> },
      { path: '/cart', element: <Cart /> },
      { path: '/wishlist', element: <Wishlist /> },
      { path: '/checkout', element: <Checkout /> },
      { path: '/order/:orderNo', element: <OrderSuccess /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      ...['about-us', 'contact-us', 'shipping-policy', 'refund-policy', 'privacy-policy', 'terms-and-conditions']
        .map((slug) => ({ path: `/${slug}`, element: <Policy slug={slug} /> })),
      { path: '/policy/:slug', element: <LegacyPolicy /> },
      { path: '/request', element: <Navigate to="/request-medicine" replace /> },
      { path: '/request-medicine', element: <Request /> },
      {
        path: '/account',
        element: <Protected><AccountLayout /></Protected>,
        children: [
          { index: true, element: <MyOrders /> },
          { path: 'orders/:orderNo', element: <OrderDetail /> },
          { path: 'profile', element: <Profile /> },
        ],
      },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    path: '/admin',
    element: <Protected role="admin"><AdminLayout /></Protected>,
    children: [
      { index: true, element: <AdminOverview /> },
      { path: 'orders', element: <AdminOrders /> },
      { path: 'products', element: <AdminProducts /> },
      { path: 'requests', element: <AdminRequests /> },
    ],
  },
])
