// Small, safe Markdown parser for blog posts. It never passes raw HTML
// through: the output is a tree that is rendered as React elements (website)
// or as escaped HTML (the blog page served to search engines).
// Supports: ## / ### headings, paragraphs, **bold**, *italic*, [links](url),
// ![images](url "caption"), - / 1. lists, > quotes, --- dividers.
// Plain JS (no JSX) so the Vercel blog function can import it too.

const SAFE_URL = /^(https:\/\/|\/(?!\/)|mailto:)[^\s<>"']*$/i
export const safeUrl = (u = '') => (SAFE_URL.test(String(u).trim()) ? String(u).trim() : '')

// Inline: returns an array of nodes { t: 'text' | 'b' | 'i' | 'a', ... }
export function inline(src = '') {
  const out = []
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g
  let last = 0, m
  while ((m = re.exec(src))) {
    if (m.index > last) out.push({ t: 'text', v: src.slice(last, m.index) })
    if (m[1] != null) out.push({ t: 'b', c: inline(m[1]) })
    else if (m[2] != null) out.push({ t: 'i', c: inline(m[2]) })
    else {
      const href = safeUrl(m[4])
      out.push(href ? { t: 'a', href, c: inline(m[3]) } : { t: 'text', v: m[3] })
    }
    last = re.lastIndex
  }
  if (last < src.length) out.push({ t: 'text', v: src.slice(last) })
  return out
}

// Blocks: { t: 'h2'|'h3'|'p'|'ul'|'ol'|'quote'|'img'|'hr', ... }
export function parse(md = '') {
  const lines = String(md).replace(/\r\n?/g, '\n').split('\n')
  const blocks = []
  let para = []
  const flush = () => { if (para.length) { blocks.push({ t: 'p', c: inline(para.join(' ')) }); para = [] } }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd()
    const s = line.trim()
    if (!s) { flush(); continue }
    let m
    if ((m = /^(#{2,4})\s+(.+)$/.exec(s))) { flush(); blocks.push({ t: m[1].length === 2 ? 'h2' : 'h3', c: inline(m[2]), text: m[2].replace(/[*_[\]()]/g, '') }); continue }
    if (/^(-{3,}|\*{3,})$/.test(s)) { flush(); blocks.push({ t: 'hr' }); continue }
    if ((m = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/.exec(s))) {
      flush(); const src = safeUrl(m[2]); if (src) blocks.push({ t: 'img', src, alt: m[1], caption: m[3] || '' }); continue
    }
    if (/^>\s?/.test(s)) {
      flush(); const q = []
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) q.push(lines[i++].trim().replace(/^>\s?/, ''))
      i--; blocks.push({ t: 'quote', c: inline(q.join(' ')) }); continue
    }
    const ul = /^[-*]\s+(.+)$/, ol = /^\d+[.)]\s+(.+)$/
    if (ul.test(s) || ol.test(s)) {
      flush(); const kind = ul.test(s) ? 'ul' : 'ol'; const rx = kind === 'ul' ? ul : ol; const items = []
      while (i < lines.length && rx.test(lines[i].trim())) items.push(inline(rx.exec(lines[i++].trim())[1]))
      i--; blocks.push({ t: kind, items }); continue
    }
    para.push(s)
  }
  flush()
  return blocks
}

// Headings for "In this article"
export const slugId = (s = '') => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)
export const headings = (blocks) => blocks.filter((b) => b.t === 'h2').map((b) => ({ id: slugId(b.text), text: b.text }))

const esc = (s = '') => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const ext = (href) => /^https:/i.test(href)
function inlineHtml(nodes) {
  return nodes.map((n) => n.t === 'text' ? esc(n.v) : n.t === 'b' ? `<strong>${inlineHtml(n.c)}</strong>` : n.t === 'i' ? `<em>${inlineHtml(n.c)}</em>`
    : `<a href="${esc(n.href)}"${ext(n.href) ? ' rel="noopener noreferrer" target="_blank"' : ''}>${inlineHtml(n.c)}</a>`).join('')
}
// Escaped HTML (used by the server-side blog page for crawlers)
export function toHtml(md) {
  return parse(md).map((b) => {
    if (b.t === 'h2' || b.t === 'h3') return `<${b.t} id="${slugId(b.text)}">${inlineHtml(b.c)}</${b.t}>`
    if (b.t === 'p') return `<p>${inlineHtml(b.c)}</p>`
    if (b.t === 'quote') return `<blockquote>${inlineHtml(b.c)}</blockquote>`
    if (b.t === 'hr') return '<hr>'
    if (b.t === 'img') return `<figure><img src="${esc(b.src)}" alt="${esc(b.alt)}" loading="lazy">${b.caption ? `<figcaption>${esc(b.caption)}</figcaption>` : ''}</figure>`
    return `<${b.t}>${b.items.map((it) => `<li>${inlineHtml(it)}</li>`).join('')}</${b.t}>`
  }).join('\n')
}
