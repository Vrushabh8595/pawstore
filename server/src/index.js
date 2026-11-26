import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { connectDB } from './config/db.js'
import { notFound, errorHandler } from './middleware/error.js'
import { sanitize, apiLimiter } from './middleware/security.js'

import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import cartRoutes from './routes/cart.js'
import wishlistRoutes from './routes/wishlist.js'
import orderRoutes from './routes/orders.js'
import adminRoutes from './routes/admin.js'
import requestRoutes from './routes/requests.js'
import storeRoutes from './routes/store.js'
import notificationRoutes from './routes/notifications.js'

const app = express()
app.set('trust proxy', 1) // behind Render's proxy — needed for correct rate-limit IPs

app.disable('x-powered-by')
app.use(helmet({
  // Pure JSON API: lock everything down
  contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
  crossOriginResourcePolicy: { policy: 'same-site' },
  strictTransportSecurity: { maxAge: 63072000, includeSubDomains: true, preload: true },
}))

// Refuse to start with a weak signing key in production
if (process.env.NODE_ENV === 'production' && (process.env.JWT_SECRET || '').length < 32) {
  console.error('JWT_SECRET must be at least 32 characters in production')
  process.exit(1)
}
// Product requests carry up to 3 compressed photos, so they get a bigger body limit.
const jsonSmall = express.json({ limit: '1mb' })
const jsonLarge = express.json({ limit: '3mb' })
app.use((req, res, next) => (req.path.startsWith('/api/requests') ? jsonLarge : jsonSmall)(req, res, next))
app.use(cookieParser())
app.use(sanitize)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'))
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean) || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    maxAge: 600,
  })
)

app.use('/api', apiLimiter)
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'animalveda-api' }))
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/store', storeRoutes)
app.use('/api/notifications', notificationRoutes)

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

connectDB(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`✓ API running on http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('Failed to start:', err.message)
    process.exit(1)
  })
