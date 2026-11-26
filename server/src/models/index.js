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
    // Admin can block a customer from placing orders
    blocked: { type: Boolean, default: false, index: true },
    blockedReason: String,
    blockedAt: Date,
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
    lifeStage: { type: String, enum: ['puppy', 'adult', 'senior', 'all'] },
    breedSize: { type: String, enum: ['small', 'medium', 'large'] },
    foodType: { type: String, enum: ['dry', 'wet', 'treats', 'accessory'] },
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
    guestEmail: String, // checkout without login
    customerName: String,
    items: [
      { product: { type: Schema.Types.ObjectId, ref: 'Product' }, name: String, slug: String, image: String, variantSku: String, size: String, price: Number, qty: Number },
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

/* ----------------------------- Product request ----------------------------- */
// Customer asks us to source a medicine / food / custom item not on the site.
const productRequestSchema = new Schema(
  {
    ref: { type: String, required: true, unique: true },
    need: String,
    animal: String,
    animalOther: String, // free text when animal = 'Other'
    product: String,
    brand: String,
    strength: String,
    quantity: String,
    details: String,
    urgency: { type: String, enum: ['Normal', 'Urgent'], default: 'Normal' },
    photos: [String], // compressed JPEG data URLs (≤3, ~150–300 KB each)
    name: String,
    phone: String,
    city: String,
    pincode: String,
    contactVia: { type: String, enum: ['WhatsApp', 'Call'], default: 'WhatsApp' },
    status: { type: String, enum: ['New', 'Contacted', 'Sourcing', 'Quoted', 'Fulfilled', 'Unavailable'], default: 'New' },
  },
  { timestamps: true }
)

/* -------------------------------- Analytics -------------------------------- */
// One row per page view (kept 120 days)
const pageViewSchema = new Schema(
  {
    sid: { type: String, index: true }, // anonymous visitor id (localStorage)
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    path: String,
    ref: String, // referrer host
    device: { type: String, enum: ['mobile', 'tablet', 'desktop'] },
    at: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 120 },
  },
  { versionKey: false }
)
// One row per visitor, refreshed by a heartbeat — "live" = seen in the last 2 min
const presenceSchema = new Schema(
  {
    sid: { type: String, unique: true },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    path: String,
    device: String,
    firstSeen: Date, // set via $setOnInsert (no defaults, so upserts don't conflict)
    lastSeen: { type: Date, index: true },
    views: Number,
  },
  { versionKey: false }
)

/* --------------------------------- Reviews --------------------------------- */
// Customer reviews: shown on the product page only after an admin approves them.
const reviewSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    productSlug: { type: String, required: true, index: true },
    productName: String,
    productImage: String,
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: String,
    rating: { type: Number, min: 1, max: 5, required: true },
    title: String,
    comment: { type: String, required: true },
    verifiedPurchase: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
    moderatedAt: Date,
  },
  { timestamps: true }
)
reviewSchema.index({ user: 1, productSlug: 1 }, { unique: true }) // one review per customer per product

/* ------------------------------ Notifications ------------------------------ */
// In-app alerts: new orders for the admin panel, status updates for customers.
const notificationSchema = new Schema(
  {
    audience: { type: String, enum: ['admin', 'user'], required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true }, // for audience 'user'
    type: { type: String, enum: ['new_order', 'status', 'account', 'review'], required: true },
    link: String, // where clicking the notification goes (when not an order)
    title: String,
    body: String,
    orderNo: String,
    status: String,
    image: String, // first product image
    amount: Number,
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 90 },
  },
  { versionKey: false }
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
export const ProductRequest = model('ProductRequest', productRequestSchema)
export const PageView = model('PageView', pageViewSchema)
export const Presence = model('Presence', presenceSchema)
export const Notification = model('Notification', notificationSchema)
export const Review = model('Review', reviewSchema)
