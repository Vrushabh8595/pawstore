// /blog-sitemap.xml: every published article, category and author page
const SITE = 'https://animalveda.com'
const API = (process.env.VITE_API_URL || 'https://pawstore-awtw.onrender.com/api').replace(/\/+$/, '')
const CATS = ['dog-care', 'cat-care', 'nutrition', 'health', 'grooming', 'training', 'livestock', 'news']

export default async function handler(req, res) {
  let d = { posts: [], authors: [] }
  try {
    const r = await fetch(`${API}/blog/sitemap`, { signal: AbortSignal.timeout(8000) })
    if (r.ok) d = await r.json()
  } catch { /* API asleep: send what we have */ }
  const used = new Set(d.posts.map((p) => p.category))
  const urls = [
    [`${SITE}/blog`, d.posts[0]?.updatedAt, '0.8'],
    ...CATS.filter((c) => used.has(c)).map((c) => [`${SITE}/blog/category/${c}`, null, '0.6']),
    ...d.authors.map((a) => [`${SITE}/blog/author/${a}`, null, '0.4']),
    ...d.posts.map((p) => [`${SITE}/blog/${p.slug}`, p.updatedAt, '0.7']),
  ]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map(([loc, mod, pr]) => `  <url><loc>${loc}</loc>${mod ? `<lastmod>${new Date(mod).toISOString().slice(0, 10)}</lastmod>` : ''}<priority>${pr}</priority></url>`).join('\n') + '\n</urlset>\n'
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=900, stale-while-revalidate=86400')
  res.end(xml)
}
