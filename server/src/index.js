import 'dotenv/config'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { connectDB } from './config/db.js'
import { notFound, errorHandler } from './middleware/error.js'

import authRoutes from './routes/auth.js'
import productRoutes from './routes/products.js'
import cartRoutes from './routes/cart.js'
import wishlistRoutes from './routes/wishlist.js'
import orderRoutes from './routes/orders.js'
import adminRoutes from './routes/admin.js'

const app = express()

app.use(helmet())
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(morgan('dev'))
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(',') || 'http://localhost:5173',
    credentials: true,
  })
)

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'pawstore-api' }))
app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/cart', cartRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/admin', adminRoutes)

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

connectDB(process.env.MONGO_URI)
  .then(() => app.listen(PORT, () => console.log(`✓ API running on http://localhost:${PORT}`)))
  .catch((err) => {
    console.error('Failed to start:', err.message)
    process.exit(1)
  })
