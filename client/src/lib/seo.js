// Central SEO config — used at runtime (useSeo) AND at build time
// (scripts/prerender-seo.mjs writes a static <head> per route for crawlers).
// Keep this file free of JSX and "@/" aliases so Node can import it directly.
import { products, categories } from '../data/products.js'

export const SITE_URL = 'https://animalveda.com'
export const SITE_NAME = 'AnimalVeda'
export const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`
const PHONE = '+91-7620377278'

export const CATEGORY_META = {
  'dry-food': { title: 'Dry Dog Food Online — Drools, Pedigree & More', h1: 'Dry Dog Food', desc: 'Buy dry dog food online at the best prices — Drools, Pedigree and vet-approved kibble for puppies, adults and seniors. Free delivery over ₹999, COD available.' },
  'wet-food': { title: 'Wet Dog Food & Gravy Pouches Online', h1: 'Wet Dog Food', desc: 'Shop wet dog food, gravy pouches and chunks online. Tasty, complete meals for picky eaters. Free delivery over ₹999 across India.' },
  treats: { title: 'Dog Treats, Biscuits & Chews Online', h1: 'Dog Treats & Chews', desc: 'Healthy dog treats, biscuits and chews for training and rewards. Shop Pedigree Biscrok and more with fast delivery and COD.' },
  'collars-leashes': { title: 'Dog Collars, Leashes & Harnesses Online', h1: 'Collars, Leashes & Harnesses', desc: 'Durable dog collars, leashes and no-pull harnesses for every size. Shop reflective and designer styles online at AnimalVeda.' },
  health: { title: 'Pet Medicines, Supplements & Health Care Online', h1: 'Pet Medicines & Health Care', desc: 'Buy vet medicines, supplements and recovery care for dogs, cats and farm animals. Can’t find a medicine? Send a photo and we’ll source it.' },
  apparel: { title: 'Dog Clothes, Sweaters & Raincoats Online', h1: 'Dog Clothes & Apparel', desc: 'Warm dog sweaters, raincoats and winter wear in all sizes. Shop comfy dog apparel online with delivery across India.' },
  bedding: { title: 'Dog Beds & Bedding Online', h1: 'Dog Beds & Bedding', desc: 'Soft, washable dog beds and bedding for restful naps. Shop dog beds online at AnimalVeda with free delivery over ₹999.' },
}

export const STATIC_PAGES = {
  '/': { title: 'AnimalVeda — Pet & Animal Medicine, Food and Care Online', desc: 'Buy vet medicines, dog food, treats and care products for pets and farm animals online. Can’t find a medicine? Send a photo — we’ll source it. COD & free delivery over ₹999.' },
  '/products': { title: 'Shop All Pet Food, Medicines & Accessories', desc: 'Browse all pet and animal food, medicines, treats and accessories at AnimalVeda. Great prices, COD and free delivery over ₹999.' },
  '/offers': { title: 'Pet Food & Medicine Offers and Deals', desc: 'Today’s best deals on dog food, treats, medicines and accessories. Save more at AnimalVeda — limited-time discounts.' },
  '/request-medicine': { title: 'Request a Pet or Animal Medicine — Send a Photo', desc: 'Can’t find a medicine, food or custom-compounded medicine for your dog, cat, cattle, goat, horse or poultry? Send a photo and details — AnimalVeda will source it.' },
  '/about-us': { title: 'About AnimalVeda', desc: 'AnimalVeda supplies veterinary medicines, food and care products for pets and farm animals across India.' },
  '/contact-us': { title: 'Contact AnimalVeda', desc: `Questions about an order or a medicine? Call ${PHONE} or email care@animalveda.com, Mon–Sat 10am–7pm.` },
  '/shipping-policy': { title: 'Shipping Policy', desc: 'Delivery across India in 2–5 business days. Free shipping over ₹999, COD available.' },
  '/refund-policy': { title: 'Refund & Return Policy', desc: 'Return unopened products within 7 days. Damaged or wrong items are replaced or refunded.' },
  '/privacy-policy': { title: 'Privacy Policy', desc: 'How AnimalVeda collects, uses and protects your personal information.' },
  '/terms-and-conditions': { title: 'Terms & Conditions', desc: 'Terms of ordering, pricing and delivery at AnimalVeda.' },
}

// Pages that should never be indexed
export const NOINDEX = ['/cart', '/checkout', '/wishlist', '/login', '/register', '/search', '/account', '/admin', '/order', '/sso-callback', '/auth']

const abs = (p) => SITE_URL + (p === '/' ? '' : p)
const clip = (s, n = 158) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)
const withBrand = (t) => (t.includes(SITE_NAME) ? t : `${t} | ${SITE_NAME}`)

const orgLd = {
  '@context': 'https://schema.org', '@type': 'Organization', name: SITE_NAME, url: SITE_URL,
  logo: `${SITE_URL}/favicon.svg`, contactPoint: { '@type': 'ContactPoint', telephone: PHONE, contactType: 'customer service', areaServed: 'IN' },
}
const siteLd = {
  '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: SITE_URL,
  potentialAction: { '@type': 'SearchAction', target: `${SITE_URL}/search?q={search_term_string}`, 'query-input': 'required name=search_term_string' },
}
const crumbs = (items) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(path) })),
})

/** Returns { title, description, canonical, image, robots, type, jsonLd[] } for a path. */
export function seoFor(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (NOINDEX.some((p) => path === p || path.startsWith(p + '/')))
    return { title: withBrand('Your account'), description: STATIC_PAGES['/'].desc, canonical: abs(path), robots: 'noindex, follow', jsonLd: [] }

  const cat = path.match(/^\/category\/([a-z0-9-]+)$/)
  if (cat) {
    const c = categories.find((x) => x.slug === cat[1])
    const m = CATEGORY_META[cat[1]]
    if (c) return {
      title: withBrand(m?.title || `${c.name} Online`), description: clip(m?.desc || `Shop ${c.name} online at AnimalVeda.`),
      canonical: abs(path), image: DEFAULT_IMAGE, type: 'website',
      jsonLd: [crumbs([['Home', '/'], ['Products', '/products'], [c.name, path]])],
    }
  }

  const prod = path.match(/^\/product\/([a-z0-9-]+)$/)
  if (prod) {
    const p = products.find((x) => x.slug === prod[1])
    if (p) {
      const v = p.variants[0]
      const c = categories.find((x) => x.slug === p.category)
      return {
        title: withBrand(`${p.name} — Buy Online at ₹${v.price}`), description: clip(`${p.short} ${p.brand} ${v.size} at ₹${v.price}${v.mrp > v.price ? ` (MRP ₹${v.mrp})` : ''}. COD & free delivery over ₹999.`),
        canonical: abs(path), image: p.images[0], type: 'product',
        jsonLd: [
          {
            '@context': 'https://schema.org', '@type': 'Product', name: p.name, image: p.images, description: p.description || p.short,
            sku: v.sku, brand: { '@type': 'Brand', name: p.brand },
            aggregateRating: p.reviews ? { '@type': 'AggregateRating', ratingValue: p.rating, reviewCount: p.reviews } : undefined,
            offers: p.variants.map((x) => ({
              '@type': 'Offer', sku: x.sku, price: x.price, priceCurrency: 'INR', url: abs(path),
              availability: x.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', itemCondition: 'https://schema.org/NewCondition',
            })),
          },
          crumbs([['Home', '/'], ...(c ? [[c.name, `/category/${c.slug}`]] : []), [p.name, path]]),
        ],
      }
    }
  }

  const s = STATIC_PAGES[path]
  if (s) return {
    title: path === '/' ? s.title : withBrand(s.title), description: clip(s.desc), canonical: abs(path), image: DEFAULT_IMAGE, type: 'website',
    jsonLd: path === '/' ? [orgLd, siteLd] : [crumbs([['Home', '/'], [s.title, path]])],
  }
  return { title: withBrand('Page not found'), description: STATIC_PAGES['/'].desc, canonical: abs(path), robots: 'noindex', jsonLd: [] }
}

/** Every indexable URL — used for sitemap.xml and build-time prerendering. */
export function indexablePaths() {
  return [
    ...Object.keys(STATIC_PAGES),
    ...categories.map((c) => `/category/${c.slug}`),
    ...products.map((p) => `/product/${p.slug}`),
  ]
}
