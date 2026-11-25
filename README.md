# 🐾 PawStore — Dog-Food E-commerce (MERN scaffold)

A dog-food e-commerce store built as a MERN scaffold with **dummy products**.
The frontend works fully on its own (dummy catalog + cart/wishlist/checkout in
localStorage); the backend is a ready-to-connect Express + MongoDB API.

```
pawstore/
├── client/   React + Vite + Tailwind storefront  (deploy to Vercel)
└── server/   Express + Mongoose REST API          (deploy to Railway/Render)
```

## Features (this build)

**Storefront** — Home, Shop (filters + search + sort), Single Product (variants,
ingredients, feeding, nutrition), Cart, Wishlist, Checkout (UPI QR + UTR, or COD),
Order Success, Login / Register, Policy pages.

**User dashboard** — My Orders, order status timeline, order details, profile.

**Admin dashboard** — Overview stats, Orders (verify UPI payment, update status),
Products (catalog + stock).

**Payments** — manual UPI (QR built from a `upi://pay?...` link + 12-digit UTR
submission, admin verifies) and Cash on Delivery. No gateway yet — `payment.method`
is structured so Razorpay/Cashfree slots in later.

## Run the frontend (dummy data, no backend needed)

```bash
cd client
npm install
npm run dev        # http://localhost:5173
```

Demo admin login: **admin@pawstore.in / admin123** (any other email = normal user).

## Run the backend

```bash
cd server
npm install
cp .env.example .env     # add your MongoDB Atlas URI + a JWT secret
npm run seed             # loads categories, products, admin, settings
npm run dev              # http://localhost:5000
```

### Key API routes
`/api/auth` register·login·logout·me · `/api/products` list/filter·:slug ·
`/api/cart` · `/api/wishlist` · `/api/orders` create·my·:id·payment-proof ·
`/api/admin` stats·orders·verify-payment·status·product CRUD·settings.

## Security built in
Prices recalculated server-side on order · admin role checked on every admin route ·
conditional `$inc` stock decrement (no overselling) · Zod validation · helmet ·
login rate-limit · CORS locked to the client origin · JWT in httpOnly cookie · bcrypt.

## Next steps
Wire the client to the API (replace the localStorage stores with TanStack Query
calls) · MongoDB Atlas + deploy the server · Cloudinary for images & payment
screenshots · order emails · then a real payment gateway.

> Demo store. Products, prices and UPI id are placeholders.
