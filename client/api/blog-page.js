// Serves /blog, /blog/:slug, /blog/category/:x and /blog/author/:x with the
// right <title>, description, canonical, Open Graph and JSON-LD already in the
// HTML (plus the article text), so Google and WhatsApp/Facebook link previews
// see the real content without running JavaScript. The React app then takes
// over in the browser as usual.
import { toHtml } from '../src/lib/markdown.js'

const SITE = 'https://animalveda.com'
const API = (process.env.VITE_API_URL || 'https://pawstore-awtw.onrender.com/api').replace(/\/+$/, '')
const CATS = { 'dog-care': 'Dog care', 'cat-care': 'Cat care', nutrition: 'Nutrition & food', health: 'Health & medicines', grooming: 'Grooming', training: 'Training & behaviour', livestock: 'Cattle & livestock', news: 'AnimalVeda news' }
const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const clip = (s = '', n = 158) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)
const ld = (o) => `<script type="application/ld+json" data-seo-ld>${JSON.stringify(o).replace(/</g, '\\u003c')}</script>`
const crumbs = (items) => ({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) })

async function getJson(path) {
  const r = await fetch(API + path, { signal: AbortSignal.timeout(6000), headers: { accept: 'application/json' } })
  if (r.status === 404) return { notFound: true }
  if (!r.ok) throw new Error('api ' + r.status)
  return r.json()
}

let shellCache = null
async function shell(req) {
  if (shellCache && Date.now() - shellCache.at < 5 * 60 * 1000) return shellCache.html
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const r = await fetch(`https://${host}/index.html`, { signal: AbortSignal.timeout(4000) })
  const html = (await r.text())
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta\s+(name|property)="(description|robots|og:[a-z:_]+|twitter:[a-z:_]+)"[^>]*>\s*/g, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/g, '')
    .replace(/<script type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>\s*/g, '')
  shellCache = { html, at: Date.now() }
  return html
}

const card = (p) => `<li><a href="/blog/${esc(p.slug)}">${esc(p.title)}</a>${p.excerpt ? ` <p>${esc(p.excerpt)}</p>` : ''}</li>`

export default async function handler(req, res) {
  const url = new URL(req.url, 'https://x')
  const slug = url.searchParams.get('slug') || ''
  const kind = url.searchParams.get('kind') || ''
  const page = Math.max(1, parseInt(url.searchParams.get('page')) || 1)
  let head, body, status = 200
  try {
    if (slug && !kind) {
      const d = await getJson(`/blog/post/${encodeURIComponent(slug)}`)
      if (d.notFound) {
        status = 404
        head = { title: 'Article not found | AnimalVeda Blog', description: 'This article isn’t available.', canonical: `${SITE}/blog/${slug}`, robots: 'noindex', ld: [] }
        body = '<h1>Article not found</h1><p><a href="/blog">Read other articles</a></p>'
      } else {
        const p = d.post, a = d.author || {}
        const canonical = `${SITE}/blog/${p.slug}`
        head = {
          title: `${p.metaTitle || p.title} | AnimalVeda Blog`, description: clip(p.metaDescription || p.excerpt || ''), canonical, image: p.cover, type: 'article',
          extra: `<meta property="article:published_time" content="${esc(p.publishedAt)}" /><meta property="article:modified_time" content="${esc(p.updatedAt || p.publishedAt)}" />`,
          ld: [
            { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: p.title.slice(0, 110), description: p.metaDescription || p.excerpt, image: p.cover ? [p.cover] : undefined, datePublished: p.publishedAt, dateModified: p.updatedAt || p.publishedAt, author: { '@type': 'Person', name: a.name || 'AnimalVeda', ...(a.slug ? { url: `${SITE}/blog/author/${a.slug}` } : {}) }, publisher: { '@type': 'Organization', name: 'AnimalVeda', logo: { '@type': 'ImageObject', url: `${SITE}/apple-touch-icon.png` } }, mainEntityOfPage: { '@type': 'WebPage', '@id': canonical }, articleSection: CATS[p.category], keywords: (p.tags || []).join(', ') || undefined },
            crumbs([['Home', SITE], ['Blog', `${SITE}/blog`], ...(p.category ? [[CATS[p.category], `${SITE}/blog/category/${p.category}`]] : []), [p.title, canonical]]),
          ],
        }
        body = `<article><h1>${esc(p.title)}</h1><p>By ${esc(a.name || 'AnimalVeda')} · ${esc(new Date(p.publishedAt).toDateString())}</p>${p.excerpt ? `<p>${esc(p.excerpt)}</p>` : ''}${p.cover ? `<img src="${esc(p.cover)}" alt="${esc(p.coverAlt || p.title)}">` : ''}${toHtml(p.content)}</article>`
      }
    } else {
      const qs = new URLSearchParams({ page: String(page) })
      if (kind === 'category') qs.set('category', slug)
      if (kind === 'author') qs.set('author', slug)
      const d = await getJson(`/blog?${qs}`)
      const base = kind ? `/blog/${kind}/${slug}` : '/blog'
      if (d.notFound || (kind === 'category' && !CATS[slug])) {
        status = 404
        head = { title: 'Page not found | AnimalVeda Blog', description: 'This page isn’t available.', canonical: `${SITE}${base}`, robots: 'noindex', ld: [] }
        body = '<h1>Page not found</h1><p><a href="/blog">AnimalVeda blog</a></p>'
      } else {
        const name = kind === 'category' ? CATS[slug] : kind === 'author' ? d.author?.name : ''
        const title = kind === 'author' ? `${name}: Articles` : name ? `${name}: Tips & Guides` : 'Pet Care Blog: Tips, Health & Nutrition Guides'
        const desc = kind === 'author' && d.author?.bio ? d.author.bio : name ? `Expert ${name.toLowerCase()} articles for pet parents and animal owners from the AnimalVeda team.` : 'Practical pet and animal care advice from AnimalVeda: dog and cat care, nutrition, health, medicines, grooming and livestock guides.'
        const canonical = `${SITE}${base}${page > 1 ? `?page=${page}` : ''}`
        head = {
          title: `${title}${page > 1 ? ` (page ${page})` : ''} | AnimalVeda Blog`, description: clip(desc), canonical, image: `${SITE}/og-image.png`,
          extra: [page > 1 ? `<link rel="prev" href="${SITE}${base}${page > 2 ? `?page=${page - 1}` : ''}" />` : '', page < d.pages ? `<link rel="next" href="${SITE}${base}?page=${page + 1}" />` : ''].join(''),
          ld: [crumbs([['Home', SITE], ['Blog', `${SITE}/blog`], ...(name ? [[name, `${SITE}${base}`]] : [])])],
        }
        body = `<h1>${esc(title)}</h1><ul>${d.items.map(card).join('')}</ul>${page < d.pages ? `<a href="${base}?page=${page + 1}">Older articles</a>` : ''}`
      }
    }
  } catch {
    // API asleep or down: send the normal app; it loads the content itself
    head = { title: 'AnimalVeda Blog', description: 'Pet and animal care tips from AnimalVeda.', canonical: `${SITE}/blog`, ld: [] }
    body = ''
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=30')
  }
  let html
  try { html = await shell(req) } catch { res.statusCode = 302; res.setHeader('Location', '/'); return res.end() }
  const tags = [
    `<title>${esc(head.title)}</title>`,
    `<meta name="description" content="${esc(head.description)}" />`,
    `<meta name="robots" content="${esc(head.robots || 'index, follow, max-image-preview:large')}" />`,
    `<link rel="canonical" href="${esc(head.canonical)}" />`,
    `<meta property="og:site_name" content="AnimalVeda" />`,
    `<meta property="og:title" content="${esc(head.title)}" />`,
    `<meta property="og:description" content="${esc(head.description)}" />`,
    `<meta property="og:url" content="${esc(head.canonical)}" />`,
    `<meta property="og:type" content="${esc(head.type || 'website')}" />`,
    head.image ? `<meta property="og:image" content="${esc(head.image)}" />` : '',
    `<meta name="twitter:card" content="summary_large_image" />`,
    head.extra || '',
    ...head.ld.map(ld),
  ].filter(Boolean).join('\n    ')
  html = html.replace('</head>', `    ${tags}\n  </head>`)
  // Readable copy for crawlers; React replaces it when the app starts
  if (body) html = html.replace(/<div id="root"><\/div>/, `<div id="root"><div style="max-width:760px;margin:0 auto;padding:24px;font-family:sans-serif">${body}</div></div>`)
  res.statusCode = status
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  if (!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400')
  res.end(html)
}
