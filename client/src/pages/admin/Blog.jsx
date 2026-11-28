import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PenLine, Check, X, Loader2, Trash2, UserPlus, Globe, Eye, Pencil, KeyRound, EyeOff } from 'lucide-react'
import { api } from '@/lib/api'
import { blogDate, categoryName } from '@/lib/blog'
import { StatusPill } from '@/components/blog/PostEditor'
import Markdown from '@/components/blog/Markdown'
import Avatar from '@/components/Avatar'
import { PageHead } from './ui'

const TABS = [['pending', 'Waiting for approval'], ['published', 'Live'], ['rejected', 'Changes requested'], ['draft', 'Drafts'], ['authors', 'Authors']]

export default function AdminBlog() {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') || 'pending'
  const review = params.get('review')
  const setTab = (t) => setParams({ tab: t })
  const q = useQuery({ queryKey: ['admin-blog'], queryFn: () => api.get('/admin/blog/posts'), refetchInterval: 60_000 })
  const posts = q.data?.posts || []
  const counts = q.data?.counts || {}
  const list = posts.filter((p) => p.status === tab)

  return (
    <div>
      <PageHead title="Blog" sub="Authors write posts; nothing goes live until you approve it."
        right={<Link to="/admin/blog/posts/new" className="btn-primary !py-2 text-sm"><PenLine size={16} /> Write a post</Link>} />
      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4" role="tablist">
        {TABS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold ${tab === k ? 'bg-ink-900 text-white' : 'bg-white ring-1 ring-ink-200 text-ink-700'}`}>
            {l}{k !== 'authors' && counts[k] ? <span className={`min-w-5 h-5 px-1.5 rounded-full text-[11px] grid place-items-center ${k === 'pending' ? 'bg-amber-400 text-ink-900' : 'bg-ink-100 text-ink-700'}`}>{counts[k]}</span> : null}
          </button>
        ))}
      </div>

      {tab === 'authors' ? <Authors /> : q.isLoading ? <div className="card p-10 text-center"><Loader2 className="mx-auto animate-spin" /></div> : !list.length ? (
        <div className="card p-10 text-center text-ink-500">{tab === 'pending' ? 'Nothing waiting for approval. 🎉' : 'No posts here yet.'}</div>
      ) : (
        <div className="card divide-y divide-ink-100">
          {list.map((p) => (
            <div key={p._id} className="flex gap-3 p-4 items-start">
              <div className="w-28 aspect-[16/10] rounded-lg bg-sand-100 overflow-hidden shrink-0 hidden sm:block">{p.cover && <img src={p.cover} alt="" className="w-full h-full object-cover" loading="lazy" />}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-ink-900 line-clamp-2">{p.title}</p>
                <p className="text-xs text-ink-500 mt-1 flex flex-wrap gap-x-2">
                  <span>by <b className="text-ink-700">{p.authorName || 'Unknown'}</b></span>
                  {p.category && <span>· {categoryName(p.category)}</span>}
                  <span>· {p.status === 'published' ? `Live since ${blogDate(p.publishedAt)}` : p.status === 'pending' ? `Sent ${blogDate(p.submittedAt)}` : `Updated ${blogDate(p.updatedAt)}`}</span>
                  {p.status === 'published' && <span>· {p.views || 0} views</span>}
                </p>
                {p.reviewNote && p.status !== 'published' && <p className="mt-1 text-xs text-ink-500">Note: {p.reviewNote}</p>}
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => setParams({ tab, review: p._id })} className={`${p.status === 'pending' ? 'btn-primary' : 'btn-ghost'} !py-1.5 !px-3 text-sm`}><Eye size={15} /> {p.status === 'pending' ? 'Review' : 'Open'}</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {review && <ReviewDrawer id={review} onClose={() => setParams({ tab })} />}
    </div>
  )
}

function ReviewDrawer({ id, onClose }) {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['admin-blog-post', id], queryFn: () => api.get(`/admin/blog/posts/${id}`) })
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState('')
  const [err, setErr] = useState('')
  const p = q.data?.post
  const act = async (action) => {
    if (action === 'reject' && !note.trim()) { setErr('Write a note telling the author what to change.'); return }
    setBusy(action); setErr('')
    try {
      if (action === 'delete') await api.del(`/admin/blog/posts/${id}`)
      else await api.patch(`/admin/blog/posts/${id}/review`, { action, ...(note.trim() ? { note: note.trim() } : {}) })
      qc.invalidateQueries({ queryKey: ['admin-blog'] }); qc.invalidateQueries({ queryKey: ['blog'] })
      onClose()
    } catch (x) { setErr(x.message) } finally { setBusy('') }
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-3xl bg-white h-full overflow-y-auto" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Review post">
        <div className="sticky top-0 bg-white border-b border-ink-100 px-5 py-3 flex items-center gap-3 z-10">
          {p && <StatusPill status={p.status} />}
          <span className="text-sm text-ink-500 truncate">by {p?.authorName}</span>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-ink-100" aria-label="Close"><X size={20} /></button>
        </div>
        {q.isLoading ? <p className="p-10 text-center"><Loader2 className="mx-auto animate-spin" /></p> : q.isError ? <p className="p-10 text-center text-red-600">{q.error.message}</p> : (
          <div className="p-5 sm:p-8">
            <p className="text-xs font-mono text-ink-500 break-all">/blog/{p.slug}</p>
            {p.category && <p className="eyebrow mt-3">{categoryName(p.category)}</p>}
            <h1 className="text-3xl mt-1">{p.title}</h1>
            {p.excerpt && <p className="text-ink-700 mt-3">{p.excerpt}</p>}
            {p.cover && <img src={p.cover} alt={p.coverAlt} className="mt-5 w-full aspect-[16/9] object-cover rounded-2xl" />}
            <div className="mt-6"><Markdown source={p.content || ''} /></div>
            {p.tags?.length > 0 && <p className="mt-6 text-sm text-ink-500">Tags: {p.tags.join(', ')}</p>}

            <div className="mt-8 rounded-2xl bg-sand-50 ring-1 ring-ink-100 p-4 sticky bottom-3 shadow-lg">
              {err && <p role="alert" className="mb-2 text-sm font-semibold text-red-600">{err}</p>}
              {p.status !== 'published' && <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} placeholder="Note for the author (needed if you ask for changes)" className="w-full border border-ink-200 rounded-xl px-3 py-2 outline-none focus:border-brand-400 bg-white mb-2" />}
              <div className="flex flex-wrap gap-2">
                {p.status !== 'published' && <button onClick={() => act('approve')} disabled={!!busy} className="btn-primary !py-2 text-sm">{busy === 'approve' ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />} Approve & publish</button>}
                {p.status === 'pending' && <button onClick={() => act('reject')} disabled={!!busy} className="btn-ghost !py-2 text-sm">{busy === 'reject' ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />} Ask for changes</button>}
                {p.status === 'published' && <a href={`/blog/${p.slug}`} target="_blank" rel="noopener" className="btn-ghost !py-2 text-sm"><Globe size={15} /> View live</a>}
                {p.status === 'published' && <button onClick={() => { if (confirm('Take this post off the website?')) act('unpublish') }} disabled={!!busy} className="btn-ghost !py-2 text-sm"><EyeOff size={15} /> Unpublish</button>}
                <Link to={`/admin/blog/posts/${p._id}`} className="btn-ghost !py-2 text-sm"><Pencil size={15} /> Edit</Link>
                <button onClick={() => { if (confirm('Delete this post for good?')) act('delete') }} disabled={!!busy} className="ml-auto inline-flex items-center gap-1.5 text-sm font-bold text-red-600 px-3 rounded-lg hover:bg-red-50"><Trash2 size={15} /> Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const input = 'w-full mt-1 border border-ink-200 rounded-xl px-3 py-2 outline-none focus:border-brand-400 bg-white'

function Authors() {
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['admin-authors'], queryFn: () => api.get('/admin/blog/authors') })
  const [form, setForm] = useState(null)
  const [busy, setBusy] = useState('')
  const [msg, setMsg] = useState(null)
  const authors = q.data?.authors || []
  const create = async (e) => {
    e.preventDefault(); setBusy('create'); setMsg(null)
    try { await api.post('/admin/blog/authors', form); setMsg({ text: `Author created. They can now log in at ${location.origin}/login with ${form.email}.` }); setForm(null); q.refetch() }
    catch (x) { setMsg({ err: true, text: x.data?.errors ? Object.values(x.data.errors).join(' ') : x.message }) } finally { setBusy('') }
  }
  const remove = async (a) => {
    const live = a.posts?.published || 0
    if (!confirm(`Delete ${a.name}'s author profile and login?\n\nTheir drafts and unpublished posts will be deleted.${live ? `\n${live} live post(s) will stay on the website under their name.` : ''}`)) return
    let mode = 'keep'
    if (live && confirm(`Also delete their ${live} live post(s) from the website?\n\nOK = delete them too · Cancel = keep them live`)) mode = 'delete'
    setBusy(a.id); setMsg(null)
    try { const r = await api.del(`/admin/blog/authors/${a.id}?posts=${mode}`); setMsg({ text: `${a.name} was removed. Live posts: ${r.publishedPosts}.` }); q.refetch(); qc.invalidateQueries({ queryKey: ['admin-blog'] }) }
    catch (x) { setMsg({ err: true, text: x.message }) } finally { setBusy('') }
  }
  const resetPw = async (a) => {
    const pw = prompt(`New password for ${a.name} (8+ characters with a letter and a number)`)
    if (!pw) return
    try { await api.patch(`/admin/blog/authors/${a.id}`, { password: pw }); setMsg({ text: `Password changed. Share it with ${a.name} privately.` }) } catch (x) { setMsg({ err: true, text: x.data?.errors ? Object.values(x.data.errors).join(' ') : x.message }) }
  }
  return (
    <div className="space-y-4">
      {msg && <p role={msg.err ? 'alert' : 'status'} className={`rounded-xl px-4 py-3 text-sm font-semibold ${msg.err ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>{msg.text}</p>}
      {form ? (
        <form onSubmit={create} className="card p-5 grid sm:grid-cols-2 gap-3">
          <p className="sm:col-span-2 font-bold">New author</p>
          <label className="block text-sm font-semibold">Name<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={60} className={input} /></label>
          <label className="block text-sm font-semibold">Email (their login)<input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={input} /></label>
          <label className="block text-sm font-semibold">Password<input required type="text" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={8} className={input} /><span className="text-[11px] text-ink-500 font-normal">8+ characters with a letter and a number. Share it privately.</span></label>
          <label className="block text-sm font-semibold">Short bio (optional)<input value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} maxLength={300} className={input} /></label>
          <div className="sm:col-span-2 flex gap-2">
            <button disabled={busy === 'create'} className="btn-primary !py-2 text-sm">{busy === 'create' ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />} Create author</button>
            <button type="button" onClick={() => setForm(null)} className="btn-ghost !py-2 text-sm">Cancel</button>
          </div>
        </form>
      ) : <button onClick={() => setForm({ name: '', email: '', password: '', bio: '' })} className="btn-primary !py-2 text-sm"><UserPlus size={16} /> Add an author</button>}

      <div className="card divide-y divide-ink-100">
        {q.isLoading ? <p className="p-8 text-center"><Loader2 className="mx-auto animate-spin" /></p> : !authors.length ? <p className="p-8 text-center text-ink-500">No authors yet. Add one so they can write for the blog.</p> : authors.map((a) => (
          <div key={a.id} className="flex flex-wrap items-center gap-3 p-4">
            <Avatar user={a} size={40} />
            <div className="flex-1 min-w-0">
              <p className="font-bold">{a.name}</p>
              <p className="text-xs text-ink-500 truncate">{a.email} · {a.posts?.published || 0} live · {a.posts?.pending || 0} waiting · {(a.posts?.draft || 0) + (a.posts?.rejected || 0)} drafts</p>
            </div>
            {a.slug && <a href={`/blog/author/${a.slug}`} target="_blank" rel="noopener" className="text-xs font-bold text-brand-700">Author page</a>}
            <button onClick={() => resetPw(a)} className="btn-ghost !py-1.5 !px-3 text-xs"><KeyRound size={14} /> Reset password</button>
            <button onClick={() => remove(a)} disabled={busy === a.id} className="inline-flex items-center gap-1 text-xs font-bold text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50">{busy === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete</button>
          </div>
        ))}
      </div>
    </div>
  )
}
