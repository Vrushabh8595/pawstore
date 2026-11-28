// Post-build: write a static HTML file per indexable route with its own
// <title>, meta description, canonical, Open Graph tags and JSON-LD, so search
// engines and link previews see correct metadata without running JavaScript.
// Also generates sitemap.xml and robots.txt. Run after `vite build`.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { seoFor, indexablePaths, SITE_URL } from './src/lib/seo.js'

const dist = join(dirname(fileURLToPath(import.meta.url)), 'dist')
const template = readFileSync(join(dist, 'index.html'), 'utf8')
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function render(path) {
  const s = seoFor(path)
  const head = [
    `<title>${esc(s.title)}</title>`,
    `<meta name="description" content="${esc(s.description)}" />`,
    `<meta name="robots" content="${esc(s.robots || 'index, follow, max-image-preview:large')}" />`,
    `<link rel="canonical" href="${esc(s.canonical)}" />`,
    `<meta property="og:site_name" content="AnimalVeda" />`,
    `<meta property="og:title" content="${esc(s.title)}" />`,
    `<meta property="og:description" content="${esc(s.description)}" />`,
    `<meta property="og:url" content="${esc(s.canonical)}" />`,
    `<meta property="og:type" content="${esc(s.type || 'website')}" />`,
    s.image ? `<meta property="og:image" content="${esc(s.image)}" />` : '',
    `<meta name="twitter:card" content="summary_large_image" />`,
    ...s.jsonLd.map((ld) => `<script type="application/ld+json" data-seo-ld>${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`),
  ].filter(Boolean).join('\n    ')
  return template
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/, '')
    .replace('</head>', `    ${head}\n  </head>`)
}

const paths = indexablePaths()
for (const p of paths) {
  // cleanUrls on Vercel serves /category/dry-food from /category/dry-food.html
  const file = p === '/' ? join(dist, 'index.html') : join(dist, `${p}.html`)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, render(p))
}

const today = new Date().toISOString().slice(0, 10)
const prio = (p) => (p === '/' ? '1.0' : p.startsWith('/category/') ? '0.9' : p.startsWith('/product/') ? '0.8' : '0.5')
writeFileSync(join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
  paths.map((p) => `  <url><loc>${SITE_URL}${p === '/' ? '/' : p}</loc><lastmod>${today}</lastmod><priority>${prio(p)}</priority></url>`).join('\n') +
  `\n</urlset>\n`)
writeFileSync(join(dist, 'robots.txt'),
  `User-agent: *\nAllow: /\nDisallow: /cart\nDisallow: /checkout\nDisallow: /account\nDisallow: /admin\nDisallow: /login\nDisallow: /register\nDisallow: /search\nDisallow: /wishlist\nDisallow: /order/\nDisallow: /author\nDisallow: /api/\n\nSitemap: ${SITE_URL}/sitemap.xml\nSitemap: ${SITE_URL}/blog-sitemap.xml\n`)
console.log(`✓ SEO: prerendered ${paths.length} routes + sitemap.xml + robots.txt`)
