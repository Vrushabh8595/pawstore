import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { PenLine, Loader2, Eye } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { blogDate, categoryName, useBlogCategories } from '@/lib/blog'
import { StatusPill } from '@/components/blog/PostEditor'

export default function AuthorHome() {
  const user = useAuth((s) => s.user)
  const q = useQuery({ queryKey: ['author-posts'], queryFn: () => api.get('/author/posts') })
  const cats = useBlogCategories()
  const posts = q.data?.posts || []
  const count = (s) => posts.filter((p) => p.status === s).length
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl">Hi {user?.name?.split(' ')[0]} 👋</h1>
          <p className="text-ink-500 text-sm mt-1">Write articles for the AnimalVeda blog. The admin checks each one before it goes live.</p>
        </div>
        <Link to="/author/posts/new" className="btn-primary"><PenLine size={17} /> Write a new post</Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        {[['Live', 'published'], ['Waiting for approval', 'pending'], ['Changes requested', 'rejected'], ['Drafts', 'draft']].map(([l, s]) => (
          <div key={s} className="card p-4"><p className="text-xs font-semibold text-ink-500">{l}</p><p className="text-2xl font-extrabold">{count(s)}</p></div>
        ))}
      </div>
      <div>
        <section className="card overflow-hidden">
          {q.isLoading ? <p className="p-8 text-center text-ink-500"><Loader2 className="mx-auto animate-spin" /></p> : !posts.length ? (
            <div className="p-10 text-center"><p className="font-display text-xl">No posts yet</p><p className="text-ink-500 text-sm mt-1">Your first article is one click away.</p><Link to="/author/posts/new" className="btn-primary mt-4 inline-flex"><PenLine size={16} /> Start writing</Link></div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {posts.map((p) => (
                <li key={p._id} className="flex gap-3 p-4 items-start">
                  <div className="w-24 aspect-[16/10] rounded-lg bg-sand-100 overflow-hidden shrink-0">{p.cover && <img src={p.cover} alt="" className="w-full h-full object-cover" loading="lazy" />}</div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/author/posts/${p._id}`} className="font-bold text-ink-900 hover:text-brand-700 line-clamp-2">{p.title}</Link>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-ink-500"><StatusPill status={p.status} />{categoryName(p.category, cats)}<span>· Updated {blogDate(p.updatedAt)}</span>{p.status === 'published' && <span className="inline-flex items-center gap-1">· <Eye size={12} /> {p.views || 0}</span>}</div>
                    {p.status === 'rejected' && p.reviewNote && <p className="mt-1.5 text-xs text-red-700 bg-red-50 rounded-lg px-2 py-1">Admin: {p.reviewNote}</p>}
                  </div>
                  {p.status === 'published' && <a href={`/blog/${p.slug}`} target="_blank" rel="noopener" className="text-xs font-bold text-brand-700 shrink-0">View</a>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

