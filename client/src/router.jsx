import { createBrowserRouter, Navigate } from 'react-router-dom'
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
import NotFound from './pages/NotFound'

import AccountLayout from './pages/account/AccountLayout'
import MyOrders from './pages/account/MyOrders'
import OrderDetail from './pages/account/OrderDetail'
import Profile from './pages/account/Profile'

import AdminLayout from './pages/admin/AdminLayout'
import AdminOverview from './pages/admin/Overview'
import AdminOrders from './pages/admin/Orders'
import AdminProducts from './pages/admin/Products'

function Protected({ children, role }) {
  const user = useAuth((s) => s.user)
  const ready = useAuth((s) => s.ready)
  if (!ready) return <div className="min-h-screen grid place-items-center text-ink-500">Loading…</div>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to="/" replace />
  return children
}

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/shop', element: <Shop /> },
      { path: '/product/:slug', element: <Product /> },
      { path: '/cart', element: <Cart /> },
      { path: '/wishlist', element: <Wishlist /> },
      { path: '/checkout', element: <Checkout /> },
      { path: '/order/:orderNo', element: <OrderSuccess /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/policy/:slug', element: <Policy /> },
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
    ],
  },
])
