import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams, Navigate } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { Search, ChevronLeft, ChevronRight, PenLine } from 'lucide-react'
import { api } from '@/lib/api'
import { applySeo } from '@/lib/useSeo'
import { SITE_URL, DEFAULT_IMAGE } from '@/lib/seo'
import { useBlogCategories, categoryName, brand } from '@/lib/blog'
import PostCard from '@/components/blog/PostCard'

// /blog and /blog/category/:category (paginated with ?page=)
export default function BlogList() {
  const { category } = useParams()
  const cats = useBlogCategories()
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, parseInt(params.get('page')) || 1)
  const q = params.get('q') || ''
  const [term, setTerm] = useState(q)
  useEffect(() => setTerm(q), [q])
  const qs = new URLSearchParams({ page, ...(category ? { category } : {}), ...(q ? { q } : {}) }).toString()
  const res = useQuery({ queryKey: ['blog', qs], queryFn: () => api.get(`/blog?${qs}`), placeholderData: keepPreviousData, retry: (n, e) => e?.status !== 404 && n < 2 })
  const d = res.data
  const base = category ? `/blog/category/${category}` : '/blog'
  const catName = category ? (d?.categories?.find((c) => c.slug === category)?.name || categoryName(category, cats)) : ''

  // Only categories that have articles (all of them while the blog is still empty)
  const withPosts = (d?.categories || []).filter((c) => c.count > 0 || c.slug === category)
  const navCats = withPosts.length ? withPosts : (d?.categories || cats)

  useEffect(() => {
    const path = base + (page > 1 ? `?page=${page}` : '')
    const title = catName ? `${catName}: Tips & Guides` : 'Pet Care Blog: Tips, Health & Nutrition Guides'
    const desc = catName ? `Expert ${catName.toLowerCase()} articles for pet parents and animal owners from the AnimalVeda team.` : 'Practical pet and animal care advice from AnimalVeda: dog and cat care, nutrition, health, medicines, grooming and livestock guides.'
    applySeo({
      title: brand(title + (page > 1 ? ` (page ${page})` : '')), description: desc.slice(0, 158), canonical: SITE_URL + path, image: DEFAULT_IMAGE,
      robots: q ? 'noindex, follow' : undefined,
      jsonLd: [{ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [['Home', '/'], ['Blog', '/blog'], ...(catName ? [[catName, base]] : [])].map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE_URL + (p === '/' ? '' : p) })) }],
    })
  }, [base, page, catName, q])

  if (category && !catName && (d || res.isError)) return <Navigate to="/blog" replace />
  if (res.error?.status === 404) return <Navigate to="/blog" replace />
  const go = (p) => { const n = new URLSearchParams(params); if (p > 1) n.set('page', p); else n.delete('page'); setParams(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const search = (e) => { e.preventDefault(); const n = new URLSearchParams(); if (term.trim()) n.set('q', term.trim()); setParams(n) }
  const pageHref = (p) => base + (p > 1 ? `?page=${p}` : '')

  return (
    <div className="pb-10">
      <section className="bg-gradient-to-br from-[#fff4e8] via-white to-[#eaf4ef] border-b border-ink-100">
        <div className="container-x py-8 sm:py-12">
          <nav aria-label="Breadcrumb" className="text-xs text-ink-500 mb-3"><Link to="/" className="hover:text-brand-600">Home</Link> <span aria-hidden="true">›</span> {category ? <Link to="/blog" className="hover:text-brand-600">Blog</Link> : <span className="text-ink-700 font-semibold">Blog</span>}{catName && <> <span aria-hidden="true">›</span> <span className="text-ink-700 font-semibold">{catName}</span></>}</nav>
          <p className="eyebrow mb-1.5 inline-flex items-center gap-1.5"><PenLine size={14} /> The AnimalVeda blog</p>
          <h1 className="text-3xl sm:text-5xl max-w-3xl">{catName ? `${catName} tips & guides` : 'Care tips for every animal you love'}</h1>
          <p className="text-ink-700 mt-3 max-w-2xl">Practical advice on health, nutrition, grooming and medicines for dogs, cats, cattle and more, from people who care for animals every day.</p>
          <form onSubmit={search} role="search" className="mt-6 flex items-center max-w-md bg-white rounded-full ring-1 ring-ink-200 focus-within:ring-brand-400 px-4">
            <Search size={18} className="text-ink-500" />
            <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search articles" aria-label="Search articles" className="flex-1 min-w-0 bg-transparent py-2.5 px-2 outline-none" />
            <button className="text-sm font-bold text-brand-600">Search</button>
          </form>
        </div>
      </section>

      <div className="container-x">
        <nav aria-label="Blog categories" className="flex gap-2 overflow-x-auto no-scrollbar py-4">
          <Link to="/blog" className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-bold border ${!category ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-ink-200 text-ink-700 hover:border-brand-300'}`}>All</Link>
          {navCats.map(({ slug, name }) => {
            const n = d?.categories?.find((c) => c.slug === slug)?.count
            return (
              <Link key={slug} to={`/blog/category/${slug}`} className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-bold border ${category === slug ? 'bg-brand-500 border-brand-500 text-white' : 'bg-white border-ink-200 text-ink-700 hover:border-brand-300'}`}>
                {name}{n ? <span className="ml-1 opacity-70">{n}</span> : null}
              </Link>
            )
          })}
        </nav>

        {res.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="card h-80 animate-pulse bg-sand-50" />)}</div>
        ) : res.isError ? (
          <div className="card p-10 text-center text-ink-500">Couldn’t load the articles. <button onClick={() => res.refetch()} className="font-bold text-brand-600">Try again</button></div>
        ) : !d.items.length ? (
          <div className="card p-10 text-center">
            <p className="font-display text-2xl text-ink-900">{q ? `No articles match “${q}”` : 'New articles are on the way'}</p>
            <p className="text-ink-500 mt-2">{q ? 'Try a different word.' : 'Our team is writing helpful guides. Check back soon!'}</p>
            {(q || category) && <Link to="/blog" className="btn-primary mt-5 inline-flex">See all articles</Link>}
          </div>
        ) : (
          <div className={`grid gap-5 sm:grid-cols-2 lg:grid-cols-3 ${res.isFetching ? 'opacity-70' : ''}`}>
            {d.items.map((p, i) => <PostCard key={p.id} p={p} big={i === 0 && page === 1 && !q} />)}
          </div>
        )}

        {d?.pages > 1 && (
          <nav aria-label="Pages" className="flex items-center justify-center gap-1.5 mt-8">
            <a href={pageHref(page - 1)} onClick={(e) => { e.preventDefault(); if (page > 1) go(page - 1) }} aria-disabled={page <= 1} className={`w-10 h-10 grid place-items-center rounded-full ring-1 ring-ink-200 ${page <= 1 ? 'opacity-40 pointer-events-none' : 'hover:ring-brand-400'}`} aria-label="Previous page"><ChevronLeft size={18} /></a>
            {Array.from({ length: d.pages }, (_, i) => i + 1).filter((p) => p === 1 || p === d.pages || Math.abs(p - page) <= 1).map((p, i, arr) => (
              <span key={p} className="flex items-center gap-1.5">
                {i > 0 && p - arr[i - 1] > 1 && <span className="text-ink-500">…</span>}
                <a href={pageHref(p)} onClick={(e) => { e.preventDefault(); go(p) }} aria-current={p === page ? 'page' : undefined}
                  className={`min-w-10 h-10 px-3 grid place-items-center rounded-full text-sm font-bold ${p === page ? 'bg-brand-500 text-white' : 'ring-1 ring-ink-200 hover:ring-brand-400'}`}>{p}</a>
              </span>
            ))}
            <a href={pageHref(page + 1)} onClick={(e) => { e.preventDefault(); if (page < d.pages) go(page + 1) }} aria-disabled={page >= d.pages} className={`w-10 h-10 grid place-items-center rounded-full ring-1 ring-ink-200 ${page >= d.pages ? 'opacity-40 pointer-events-none' : 'hover:ring-brand-400'}`} aria-label="Next page"><ChevronRight size={18} /></a>
          </nav>
        )}
      </div>
    </div>
  )
}
