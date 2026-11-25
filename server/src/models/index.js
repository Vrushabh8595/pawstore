import mongoose from 'mongoose'

const { Schema, model } = mongoose

/* ---------------------------------- User ---------------------------------- */
const addressSchema = new Schema(
  { name: String, phone: String, line1: String, city: String, state: String, pincode: String, isDefault: Boolean },
  { _id: true }
)
const userSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: String,
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    addresses: [addressSchema],
  },
  { timestamps: true }
)

/* -------------------------------- Category -------------------------------- */
const categorySchema = new Schema(
  { name: { type: String, required: true }, slug: { type: String, required: true, unique: true }, image: String },
  { timestamps: true }
)

/* --------------------------------- Product -------------------------------- */
const variantSchema = new Schema(
  {
    sku: { type: String, required: true },
    size: String,
    flavour: String,
    price: { type: Number, required: true },
    mrp: Number,
    stock: { type: Number, default: 0 },
  },
  { _id: false }
)
const productSchema = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: true }, // category slug
    brand: String,
    images: [String],
    short: String,
    description: String,
    ingredients: String,
    feeding: String,
    nutrition: { type: Map, of: String },
    rating: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 },
    lifeStage: { type: String, enum: ['puppy', 'adult', 'senior'] },
    breedSize: { type: String, enum: ['small', 'medium', 'large'] },
    foodType: { type: String, enum: ['dry', 'wet', 'treats'] },
    diet: [String],
    tags: [String],
    variants: [variantSchema],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)
productSchema.index({ name: 'text', short: 'text', brand: 'text' })

/* ----------------------------- Cart / Wishlist ---------------------------- */
const cartSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: [{ product: { type: Schema.Types.ObjectId, ref: 'Product' }, variantSku: String, qty: Number }],
  },
  { timestamps: true }
)
const wishlistSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  },
  { timestamps: true }
)

/* ---------------------------------- Order --------------------------------- */
const orderSchema = new Schema(
  {
    orderNo: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    items: [
      { product: { type: Schema.Types.ObjectId, ref: 'Product' }, name: String, variantSku: String, size: String, price: Number, qty: Number },
    ],
    shippingAddress: addressSchema,
    subtotal: Number,
    shippingFee: Number,
    codFee: Number,
    total: Number,
    payment: {
      method: { type: String, enum: ['UPI_MANUAL', 'COD', 'GATEWAY'], required: true },
      status: {
        type: String,
        enum: ['pending_verification', 'paid', 'rejected', 'cod_pending', 'cod_collected'],
        default: 'pending_verification',
      },
      utr: String,
      screenshotUrl: String,
      verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' },
      verifiedAt: Date,
    },
    status: {
      type: String,
      enum: ['Pending Verification', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Payment Rejected', 'Cancelled', 'Returned'],
      default: 'Pending Verification',
    },
    statusHistory: [{ status: String, note: String, at: { type: Date, default: Date.now } }],
  },
  { timestamps: true }
)

/* -------------------------------- Settings -------------------------------- */
const settingsSchema = new Schema(
  {
    key: { type: String, default: 'global', unique: true },
    upiId: String,
    payeeName: String,
    codEnabled: { type: Boolean, default: true },
    codFee: { type: Number, default: 49 },
    codMaxAmount: { type: Number, default: 5000 },
    shippingFee: { type: Number, default: 59 },
    freeShipAbove: { type: Number, default: 999 },
  },
  { timestamps: true }
)

export const User = model('User', userSchema)
export const Category = model('Category', categorySchema)
export const Product = model('Product', productSchema)
export const Cart = model('Cart', cartSchema)
export const Wishlist = model('Wishlist', wishlistSchema)
export const Order = model('Order', orderSchema)
export const Settings = model('Settings', settingsSchema)
