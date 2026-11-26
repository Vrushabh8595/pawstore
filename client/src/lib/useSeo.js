import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { seoFor } from './seo'

function meta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (content == null) { el?.remove(); return }
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el) }
  el.setAttribute('content', content)
}

// Keeps <title>, description, canonical, Open Graph and JSON-LD in sync on SPA navigation.
export function useSeo() {
  const { pathname } = useLocation()
  useEffect(() => {
    const s = seoFor(pathname)
    document.title = s.title
    meta('name', 'description', s.description)
    meta('name', 'robots', s.robots || 'index, follow, max-image-preview:large')
    meta('property', 'og:title', s.title)
    meta('property', 'og:description', s.description)
    meta('property', 'og:url', s.canonical)
    meta('property', 'og:type', s.type || 'website')
    meta('property', 'og:image', s.image)
    meta('name', 'twitter:card', 'summary_large_image')
    let link = document.head.querySelector('link[rel="canonical"]')
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link) }
    link.href = s.canonical
    document.head.querySelectorAll('script[data-seo-ld]').forEach((n) => n.remove())
    for (const ld of s.jsonLd) {
      const sc = document.createElement('script')
      sc.type = 'application/ld+json'
      sc.dataset.seoLd = ''
      sc.textContent = JSON.stringify(ld)
      document.head.appendChild(sc)
    }
  }, [pathname])
}
