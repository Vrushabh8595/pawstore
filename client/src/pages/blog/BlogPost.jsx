import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Clock, CalendarDays, Share2, Check, ArrowRight, Camera } from 'lucide-react'
import { api } from '@/lib/api'
import { applySeo } from '@/lib/useSeo'
import { SITE_URL, SITE_NAME } from '@/lib/seo'
import { blogDate, brand } from '@/lib/blog'
import { parse, headings } from '@/lib/markdown'
import Markdown from '@/components/blog/Markdown'
import PostCard from '@/components/blog/PostCard'

// /blog/:slug
export default function BlogPost() {
  const { slug } = useParams()
  const q = useQuery({ queryKey: ['blog-post', slug], queryFn: () => api.get(`/blog/post/${encodeURIComponent(slug)}`), retry: (n, e) => e?.status !== 404 && n < 2 })
  const post = q.data?.post
  const blocks = useMemo(() => parse(post?.content || ''), [post?.content])
  const toc = headings(blocks)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (q.error?.status === 404) applySeo({ title: brand('Article not found'), description: 'This article isn’t available.', canonical: `${SITE_URL}/blog/${slug}`, robots: 'noindex' })
    if (!post) return
    const url = `${SITE_URL}/blog/${post.slug}`
    applySeo({
      title: brand(post.metaTitle || post.title), description: (post.metaDescription || post.excerpt || '').slice(0, 158), canonical: url, image: post.cover, type: 'article',
      jsonLd: [
        {
          '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title.slice(0, 110), description: post.metaDescription || post.excerpt,
          image: post.cover ? [post.cover] : undefined, datePublished: post.publishedAt, dateModified: post.updatedAt || post.publishedAt,
          author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
          publisher: { '@type': 'Organization', name: SITE_NAME, logo: { '@type': 'ImageObject', url: `${SITE_URL}/apple-touch-icon.png` } },
          mainEntityOfPage: { '@type': 'WebPage', '@id': url }, articleSection: post.categoryName || undefined, keywords: post.tags?.join(', ') || undefined,
        },
        { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', SITE_URL], ['Blog', `${SITE_URL}/blog`], ...(post.category ? [[post.categoryName, `${SITE_URL}/blog/category/${post.category}`]] : []), [post.title, url]].map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })) },
      ],
    })
  }, [post, q.error, slug])

  if (q.isLoading) return <div className="container-x max-w-3xl py-10"><div className="h-8 w-2/3 bg-sand-100 rounded animate-pulse" /><div className="mt-6 aspect-[16/9] bg-sand-100 rounded-3xl animate-pulse" /></div>
  if (q.error?.status === 404) return (
    <div className="container-x py-20 text-center">
      <h1 className="text-3xl">This article isn’t available</h1>
      <p className="text-ink-500 mt-2">It may have been moved or taken down.</p>
      <Link to="/blog" className="btn-primary mt-6 inline-flex">Read other articles</Link>
    </div>
  )
  if (q.isError) return <div className="container-x py-20 text-center text-ink-500">Couldn’t load this article. <button onClick={() => q.refetch()} className="font-bold text-brand-600">Try again</button></div>

  const share = async () => {
    const url = `${SITE_URL}/blog/${post.slug}`
    try { if (navigator.share) await navigator.share({ title: post.title, url }); else { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1800) } } catch { /* cancelled */ }
  }

  return (
    <article className="pb-6">
      <header className="container-x max-w-3xl pt-6 sm:pt-10">
        <nav aria-label="Breadcrumb" className="text-xs text-ink-500 mb-4 flex flex-wrap gap-1">
          <Link to="/" className="hover:text-brand-600">Home</Link><span aria-hidden="true">›</span>
          <Link to="/blog" className="hover:text-brand-600">Blog</Link>
          {post.category && <><span aria-hidden="true">›</span><Link to={`/blog/category/${post.category}`} className="hover:text-brand-600">{post.categoryName}</Link></>}
        </nav>
        {post.categoryName && <Link to={`/blog/category/${post.category}`} className="eyebrow hover:underline">{post.categoryName}</Link>}
        <h1 className="text-3xl sm:text-5xl leading-tight mt-2">{post.title}</h1>
        {post.excerpt && <p className="text-lg text-ink-700 mt-4 leading-relaxed">{post.excerpt}</p>}
        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-ink-500">
          <span className="inline-flex items-center gap-1"><CalendarDays size={14} /><time dateTime={post.publishedAt}>{blogDate(post.publishedAt)}</time></span>
          <span className="inline-flex items-center gap-1"><Clock size={14} /> {post.readMinutes} min read</span>
          <button onClick={share} className="ml-auto inline-flex items-center gap-1.5 font-bold text-brand-700 hover:underline">{copied ? <><Check size={15} /> Link copied</> : <><Share2 size={15} /> Share</>}</button>
        </div>
      </header>

      {post.cover && (
        <div className="container-x max-w-4xl mt-6">
          <img src={post.cover} alt={post.coverAlt} className="w-full aspect-[16/9] object-cover rounded-[1.75rem] bg-sand-100" fetchpriority="high" />
        </div>
      )}

      <div className="container-x max-w-3xl mt-8">
        {toc.length >= 3 && (
          <nav aria-label="In this article" className="mb-8 rounded-2xl bg-sand-50 ring-1 ring-ink-100 p-5">
            <p className="font-extrabold text-ink-900 mb-2">In this article</p>
            <ol className="space-y-1.5 text-sm list-decimal pl-5 marker:text-brand-500">
              {toc.map((h) => <li key={h.id}><a href={`#${h.id}`} className="text-ink-700 hover:text-brand-700 font-semibold">{h.text}</a></li>)}
            </ol>
          </nav>
        )}
        <Markdown blocks={blocks} />

        {post.tags?.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-2">{post.tags.map((t) => <span key={t} className="text-xs font-bold bg-sand-100 text-ink-700 rounded-full px-3 py-1">#{t}</span>)}</div>
        )}

        <aside className="mt-10 rounded-3xl bg-gradient-to-r from-brand-500 to-brand-600 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-white/20 grid place-items-center shrink-0"><Camera /></span>
          <div className="flex-1"><p className="font-display text-xl font-semibold">Need a medicine or food for your animal?</p><p className="text-white/85 text-sm">Shop vet-approved products, or send us a photo and we’ll source it.</p></div>
          <Link to="/products" className="inline-flex items-center gap-2 bg-white text-brand-700 font-extrabold text-sm px-5 py-2.5 rounded-full w-fit">Shop now <ArrowRight size={16} /></Link>
        </aside>

        <p className="mt-6 text-xs text-ink-500">This article is for general information. For a diagnosis, dose or treatment plan for your animal, please talk to a qualified veterinarian.</p>
      </div>

      {q.data.related?.length > 0 && (
        <section className="container-x mt-14" aria-labelledby="related-title">
          <h2 id="related-title" className="text-2xl sm:text-3xl mb-5">Keep reading</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{q.data.related.map((p) => <PostCard key={p.id} p={p} />)}</div>
        </section>
      )}
    </article>
  )
}
