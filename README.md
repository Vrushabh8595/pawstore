# 🐾 AnimalVeda

Vet medicines, food and everyday care for pets, livestock and every animal, delivered across India.

```
animalveda/
├── client/   React + Vite + Tailwind storefront and admin panel  (Vercel)
└── server/   Express + MongoDB API                               (Render)
```

## Highlights
- Storefront with cart, checkout (COD / UPI), pincode and GPS address fill, order tracking
- Request any medicine with a photo; doorstep care waitlist
- Google sign-in (Clerk) plus email/password accounts
- Admin panel: orders with product photos, live visitors, traffic, customers, block/unblock, requests
- In-app notifications with sound for admins (new orders) and customers (status updates)
- Order emails through a Gmail relay (`server/gmail-relay.gs`)

## Running locally
```bash
cd server && npm install && npm run dev     # API on :5000
cd client && npm install && npm run dev     # site on :5173
```
Configuration lives in environment variables on the server (see `server/.env.example` if present).
Never commit secrets to this repository.
