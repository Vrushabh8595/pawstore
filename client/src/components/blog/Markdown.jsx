import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { parse, slugId } from '@/lib/markdown'

function Inline({ nodes }) {
  return nodes.map((n, i) => {
    if (n.t === 'text') return <Fragment key={i}>{n.v}</Fragment>
    if (n.t === 'b') return <strong key={i}><Inline nodes={n.c} /></strong>
    if (n.t === 'i') return <em key={i}><Inline nodes={n.c} /></em>
    if (n.href.startsWith('/')) return <Link key={i} to={n.href}><Inline nodes={n.c} /></Link>
    return <a key={i} href={n.href} {...(/^https:/i.test(n.href) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}><Inline nodes={n.c} /></a>
  })
}

// Renders blog Markdown as React elements (never as raw HTML)
export default function Markdown({ source, blocks }) {
  const list = blocks || parse(source)
  return (
    <div className="blog-prose">
      {list.map((b, i) => {
        if (b.t === 'h2') return <h2 key={i} id={slugId(b.text)}><Inline nodes={b.c} /></h2>
        if (b.t === 'h3') return <h3 key={i} id={slugId(b.text)}><Inline nodes={b.c} /></h3>
        if (b.t === 'p') return <p key={i}><Inline nodes={b.c} /></p>
        if (b.t === 'quote') return <blockquote key={i}><Inline nodes={b.c} /></blockquote>
        if (b.t === 'hr') return <hr key={i} />
        if (b.t === 'img') return <figure key={i}><img src={b.src} alt={b.alt} loading="lazy" decoding="async" />{b.caption && <figcaption>{b.caption}</figcaption>}</figure>
        const L = b.t
        return <L key={i}>{b.items.map((it, j) => <li key={j}><Inline nodes={it} /></li>)}</L>
      })}
    </div>
  )
}
