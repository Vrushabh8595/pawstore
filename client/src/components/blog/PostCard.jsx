import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { blogDate } from '@/lib/blog'

export default function PostCard({ p, big = false }) {
  return (
    <article className={`group card overflow-hidden flex flex-col hover:shadow-[0_20px_40px_-24px_rgba(17,37,58,.45)] transition ${big ? 'md:flex-row md:col-span-2 lg:col-span-3' : ''}`}>
      <Link to={`/blog/${p.slug}`} className={`block relative overflow-hidden bg-sand-100 ${big ? 'md:w-[55%] aspect-[16/9] md:aspect-auto' : 'aspect-[16/9]'}`} tabIndex={-1} aria-hidden="true">
        {p.cover && <img src={p.cover} alt="" loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.03] transition duration-500" />}
      </Link>
      <div className={`flex-1 flex flex-col p-5 ${big ? 'md:p-8 md:justify-center' : ''}`}>
        {p.categoryName && <Link to={`/blog/category/${p.category}`} className="eyebrow hover:underline w-fit">{p.categoryName}</Link>}
        <h2 className={`mt-2 font-display font-semibold text-ink-900 leading-snug ${big ? 'text-2xl sm:text-3xl' : 'text-xl'}`}>
          <Link to={`/blog/${p.slug}`} className="hover:text-brand-700">{p.title}</Link>
        </h2>
        {p.excerpt && <p className={`mt-2 text-ink-700 text-sm leading-relaxed ${big ? 'sm:text-base line-clamp-4' : 'line-clamp-3'}`}>{p.excerpt}</p>}
        <p className="mt-auto pt-4 text-xs text-ink-500 flex flex-wrap items-center gap-x-2 gap-y-1">
          {p.authorName && <span className="font-semibold text-ink-700">{p.authorName}</span>}
          {p.publishedAt && <><span aria-hidden="true">·</span><time dateTime={p.publishedAt}>{blogDate(p.publishedAt)}</time></>}
          <span aria-hidden="true">·</span><span className="inline-flex items-center gap-1"><Clock size={12} /> {p.readMinutes} min read</span>
        </p>
      </div>
    </article>
  )
}
