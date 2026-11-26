import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { connectDB } from './config/db.js'
import { User, Category, Product, Settings } from './models/index.js'
// Single source of truth: the storefront catalogue (whole repo is cloned on
// deploy, so this path resolves even though the build root is /server).
import { categories, products } from '../../client/src/data/products.js'

async function run() {
  await connectDB(process.env.MONGO_URI)

  // Catalogue: seed ONLY when the collection is empty, so a redeploy never
  // wipes products the admin has added or edited through the panel.
  const existing = await Product.countDocuments()
  if (existing === 0) {
    await Category.deleteMany({})
    await Category.insertMany(categories)
    await Product.insertMany(products)
    console.log('Seeded ' + categories.length + ' categories, ' + products.length + ' products')
  } else {
    console.log(existing + ' products already present - skipping catalogue seed')
  }

  // Admin user + store settings: always ensure (idempotent upsert).
  // Trim env values: a stray trailing space/newline pasted into Render's
  // dashboard would otherwise be baked into the bcrypt hash and silently
  // break login (the stored hash would never match the clean typed password).
  const email = (process.env.ADMIN_EMAIL || 'admin@pawstore.in').trim()
  const rawPassword = process.env.ADMIN_PASSWORD || 'admin123'
  console.log(
    'ADMIN seed — email len ' + email.length +
    ', password raw len ' + rawPassword.length +
    ', trimmed len ' + rawPassword.trim().length
  )
  const passwordHash = await bcrypt.hash(rawPassword.trim(), 10)
  await User.findOneAndUpdate(
    { email },
    { name: process.env.ADMIN_NAME || 'Store Admin', email, passwordHash, role: 'admin' },
    { upsert: true, new: true }
  )

  await Settings.findOneAndUpdate(
    { key: 'global' },
    { key: 'global', upiId: process.env.UPI_ID || 'pawstore@upi', payeeName: process.env.UPI_PAYEE || 'PawStore' },
    { upsert: true }
  )

  console.log('Admin ensured (' + email + '), settings ensured')
  await mongoose.disconnect()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
