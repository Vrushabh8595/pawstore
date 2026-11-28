import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Link2, ImagePlus, Eye, PenLine, Loader2, Send, Save, Trash2, Undo2, Upload, X, Globe, Check, AlertCircle, Plus } from 'lucide-react'
import { api } from '@/lib/api'
import { useBlogCategories } from '@/lib/blog'
import { SITE_URL } from '@/lib/seo'
import { compressImage } from '@/lib/blog'
import { playSound, haptic } from '@/lib/feedback'
import Markdown from './Markdown'

const slugify = (s = '') => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
const words = (s = '') => (s.match(/[\p{L}\p{N}]+/gu) || []).length
const blank = { title: '', slug: '', excerpt: '', content: '', cover: '', coverAlt: '', category: '', tags: '', metaTitle: '', metaDescription: '' }
export const STATUS = {
  draft: ['Draft', 'bg-ink-100 text-ink-700'],
  pending: ['Waiting for approval', 'bg-amber-100 text-amber-800'],
  published: ['Live on website', 'bg-green-100 text-green-800'],
  rejected: ['Changes requested', 'bg-red-100 text-red-700'],
}
export const StatusPill = ({ status }) => <span className={`inline-flex text-[11px] font-extrabold uppercase tracking-wider rounded-full px-2.5 py-1 ${STATUS[status]?.[1]}`}>{STATUS[status]?.[0] || status}</span>

// mode 'author' (needs admin approval) or 'admin' (can publish)
export default function PostEditor({ mode, id, back }) {
  const admin = mode === 'admin'
  const apiBase = admin ? '/admin/blog' : '/author'
  const nav = useNavigate()
  const qc = useQueryClient()
  const isNew = !id || id === 'new'
  const q = useQuery({ queryKey: ['blog-edit', mode, id], queryFn: () => api.get(`${apiBase}/posts/${id}`), enabled: !isNew })
  const [f, setF] = useState(blank)
  const [post, setPost] = useState(null)
  const [tab, setTab] = useState('write')
  const [errors, setErrors] = useState({})
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const area = useRef(null)
  const coverInput = useRef(null)
  const cats = useBlogCategories()
  const imgInput = useRef(null)

  useEffect(() => {
    const p = q.data?.post
    if (!p) return
    setPost(p); setSlugTouched(true)
    setF({ ...blank, ...Object.fromEntries(Object.keys(blank).map((k) => [k, p[k] ?? ''])), tags: (p.tags || []).join(', ') })
  }, [q.data])

  const live = post?.status === 'published'
  const locked = !admin && live // authors can't change live posts
  const set = (k) => (v) => { setF((s) => ({ ...s, [k]: v, ...(k === 'title' && !slugTouched && !live ? { slug: slugify(v) } : {}) })); setErrors((e) => ({ ...e, [k]: undefined })) }
  const wc = words(f.content)
  const blocksPreview = useMemo(() => (tab === 'preview' ? f.content : ''), [tab, f.content])

  const wrap = (before, after = before, placeholder = 'text') => {
    const el = area.current; if (!el) return
    const { selectionStart: a, selectionEnd: b, value } = el
    const sel = value.slice(a, b) || placeholder
    const next = value.slice(0, a) + before + sel + after + value.slice(b)
    set('content')(next)
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + before.length, a + before.length + sel.length) })
  }
  const linePrefix = (prefix) => {
    const el = area.current; if (!el) return
    const { selectionStart: a, value } = el
    const start = value.lastIndexOf('\n', a - 1) + 1
    set('content')(value.slice(0, start) + prefix + value.slice(start))
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + prefix.length, a + prefix.length) })
  }
  const insertBlock = (text) => {
    const el = area.current
    const v = f.content, a = el ? el.selectionStart : v.length
    set('content')(v.slice(0, a) + `\n\n${text}\n\n` + v.slice(a))
  }
  const addLink = () => { const url = prompt('Link address (https://… or /page on this website)'); if (url) wrap('[', `](${url.trim()})`, 'link text') }

  const upload = async (file) => {
    const dataUrl = await compressImage(file)
    const r = await api.post(`${apiBase}/images`, { image: dataUrl })
    return r.url
  }
  const onCover = async (e) => {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file) return
    setBusy('cover')
    try { set('cover')(await upload(file)); if (!f.coverAlt) set('coverAlt')(f.title) } catch (x) { setMsg({ err: true, text: x.message }) } finally { setBusy('') }
  }
  const onImage = async (e) => {
    const file = e.target.files?.[0]; e.target.value = ''
    if (!file) return
    const alt = prompt('Describe the picture in a few words (helps Google and blind readers)') || ''
    setBusy('img')
    try { insertBlock(`![${alt.replace(/[[\]]/g, '')}](${await upload(file)})`) } catch (x) { setMsg({ err: true, text: x.message }) } finally { setBusy('') }
  }

  const save = async (action) => {
    setBusy(action); setMsg(null); setErrors({})
    const body = {
      title: f.title, excerpt: f.excerpt, content: f.content, cover: f.cover, coverAlt: f.coverAlt, category: f.category,
      tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 10), metaTitle: f.metaTitle, metaDescription: f.metaDescription,
      ...(live ? {} : { slug: f.slug || slugify(f.title) }),
      ...(action === 'submit' ? { submit: true } : {}), ...(action === 'publish' ? { publish: true } : {}),
    }
    try {
      const r = isNew ? await api.post(`${apiBase}/posts`, body) : await api.patch(`${apiBase}/posts/${id}`, body)
      setPost(r.post)
      qc.invalidateQueries({ queryKey: [admin ? 'admin-blog' : 'author-posts'] })
      qc.invalidateQueries({ queryKey: ['blog'] })
      playSound('success'); haptic(15)
      const text = action === 'submit' ? 'Sent to the admin for approval. You’ll get a notification when it’s reviewed.' : action === 'publish' ? (live ? 'Changes are live.' : 'Published! It’s live on the website now.') : 'Saved.'
      if (isNew) nav(`${back}/posts/${r.post._id}`, { replace: true, state: { msg: text } })
      else { setMsg({ text }); q.refetch() }
    } catch (x) {
      if (x.data?.errors) setErrors(x.data.errors)
      setMsg({ err: true, text: x.message })
    } finally { setBusy('') }
  }
  const act = async (path, method, text, after) => {
    setBusy(path); setMsg(null)
    try { await (method === 'del' ? api.del(path) : api.post(path)); qc.invalidateQueries({ queryKey: [admin ? 'admin-blog' : 'author-posts'] }); if (after) after(); else { setMsg({ text }); q.refetch() } } catch (x) { setMsg({ err: true, text: x.message }) } finally { setBusy('') }
  }

  const stateMsg = useLocation().state?.msg
  useEffect(() => { if (stateMsg) setMsg({ text: stateMsg }) }, [stateMsg])

  if (!isNew && q.isLoading) return <div className="card p-10 text-center text-ink-500"><Loader2 className="mx-auto animate-spin" /></div>
  if (!isNew && q.isError) return <div className="card p-10 text-center text-red-600">{q.error.message} <Link to={back} className="font-bold text-brand-600 ml-2">Back</Link></div>

  const E = ({ k }) => (errors[k] ? <p role="alert" className="mt-1 text-xs font-semibold text-red-600">{errors[k]}</p> : null)
  const Count = ({ v, max, good }) => <span className={`text-[11px] font-semibold ${v.length > max ? 'text-red-600' : v.length >= (good || 0) ? 'text-green-700' : 'text-ink-500'}`}>{v.length}/{max}</span>
  const input = 'w-full mt-1 border border-ink-200 rounded-xl px-3 py-2.5 outline-none focus:border-brand-400 bg-white disabled:bg-sand-50 disabled:text-ink-500'
  const tool = 'w-9 h-9 grid place-items-center rounded-lg text-ink-700 hover:bg-sand-100 disabled:opacity-40'

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <Link to={back} className="text-sm font-bold text-ink-500 hover:text-ink-900">← All posts</Link>
        {post && <StatusPill status={post.status} />}
        {live && <a href={`/blog/${post.slug}`} target="_blank" rel="noopener" className="text-sm font-bold text-brand-700 inline-flex items-center gap-1"><Globe size={14} /> View live</a>}
      </div>
      {post?.status === 'rejected' && post.reviewNote && <div className="mb-4 rounded-xl bg-red-50 ring-1 ring-red-200 p-4 text-sm text-red-800"><b>Admin’s note:</b> {post.reviewNote}</div>}
      {post?.status === 'pending' && !admin && <div className="mb-4 rounded-xl bg-amber-50 ring-1 ring-amber-200 p-4 text-sm text-amber-900">The admin is reviewing this post. You can still make changes, or take it back to edit as a draft.</div>}
      {locked && <div className="mb-4 rounded-xl bg-sky-50 ring-1 ring-sky-200 p-4 text-sm text-sky-900">This post is live. To change it, contact the admin.</div>}
      {msg && <p role={msg.err ? 'alert' : 'status'} className={`mb-4 rounded-xl px-4 py-3 text-sm font-semibold flex items-start gap-2 ${msg.err ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-800'}`}>{msg.err ? <AlertCircle size={16} className="mt-0.5 shrink-0" /> : <Check size={16} className="mt-0.5 shrink-0" />}{msg.text}</p>}

      <div className="grid lg:grid-cols-[1fr_300px] gap-5 items-start">
        <div className="space-y-4 min-w-0">
          <div className="card p-4 sm:p-5">
            <label className="block"><span className="text-sm font-bold">Title <span className="text-red-500">*</span></span>
              <input value={f.title} onChange={(e) => set('title')(e.target.value)} disabled={locked} maxLength={140} placeholder="e.g. How often should you deworm your dog?" className={`${input} text-lg font-semibold`} /></label>
            <E k="title" />
            <div className="mt-3 text-xs text-ink-500 flex flex-wrap items-center gap-1">
              <span>Web address:</span>
              <span className="font-mono text-ink-700 break-all">{SITE_URL.replace('https://', '')}/blog/</span>
              {live ? <span className="font-mono text-ink-900 break-all">{f.slug}</span> : (
                <input value={f.slug} onChange={(e) => { setSlugTouched(true); set('slug')(slugify(e.target.value)) }} aria-label="Web address" className="font-mono text-ink-900 border-b border-dashed border-ink-300 focus:border-brand-500 outline-none bg-transparent min-w-[12rem] flex-1" />
              )}
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-center gap-0.5 border-b border-ink-100 px-2 py-1.5 bg-sand-50">
              <div className="inline-flex rounded-lg bg-white ring-1 ring-ink-200 p-0.5 mr-2">
                <button type="button" onClick={() => setTab('write')} className={`px-3 py-1 rounded-md text-sm font-bold inline-flex items-center gap-1.5 ${tab === 'write' ? 'bg-ink-900 text-white' : 'text-ink-700'}`}><PenLine size={14} /> Write</button>
                <button type="button" onClick={() => setTab('preview')} className={`px-3 py-1 rounded-md text-sm font-bold inline-flex items-center gap-1.5 ${tab === 'preview' ? 'bg-ink-900 text-white' : 'text-ink-700'}`}><Eye size={14} /> Preview</button>
              </div>
              {tab === 'write' && !locked && <>
                <button type="button" title="Heading" onClick={() => linePrefix('## ')} className={tool}><Heading2 size={17} /></button>
                <button type="button" title="Sub-heading" onClick={() => linePrefix('### ')} className={tool}><Heading3 size={17} /></button>
                <button type="button" title="Bold" onClick={() => wrap('**')} className={tool}><Bold size={16} /></button>
                <button type="button" title="Italic" onClick={() => wrap('*')} className={tool}><Italic size={16} /></button>
                <button type="button" title="Bullet list" onClick={() => linePrefix('- ')} className={tool}><List size={17} /></button>
                <button type="button" title="Numbered list" onClick={() => linePrefix('1. ')} className={tool}><ListOrdered size={17} /></button>
                <button type="button" title="Quote / tip" onClick={() => linePrefix('> ')} className={tool}><Quote size={16} /></button>
                <button type="button" title="Link" onClick={addLink} className={tool}><Link2 size={16} /></button>
                <button type="button" title="Add a picture" onClick={() => imgInput.current?.click()} disabled={busy === 'img'} className={tool}>{busy === 'img' ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={17} />}</button>
                <input ref={imgInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onImage} />
              </>}
              <span className={`ml-auto text-xs font-semibold px-2 ${wc >= 150 ? 'text-green-700' : 'text-ink-500'}`}>{wc} words · {Math.max(1, Math.round(wc / 200))} min read</span>
            </div>
            {tab === 'write' ? (
              <textarea ref={area} value={f.content} onChange={(e) => set('content')(e.target.value)} disabled={locked} rows={22} spellCheck
                placeholder={'Start writing…\n\n## Use headings to split your article\n\nWrite short paragraphs. **Bold** the key points.\n\n- Bullet points\n- work well too'}
                className="w-full p-4 sm:p-5 outline-none resize-y font-mono text-[14.5px] leading-relaxed min-h-[420px] disabled:bg-sand-50" />
            ) : (
              <div className="p-5 sm:p-8 min-h-[420px]">{blocksPreview.trim() ? <Markdown source={blocksPreview} /> : <p className="text-ink-500">Nothing to preview yet.</p>}</div>
            )}
            <div className="px-4 pb-3"><E k="content" /></div>
          </div>

          <div className="card p-4 sm:p-5">
            <label className="block"><span className="text-sm font-bold flex justify-between">Summary <span className="text-red-500 mr-auto ml-1">*</span><Count v={f.excerpt} max={300} good={50} /></span>
              <textarea value={f.excerpt} onChange={(e) => set('excerpt')(e.target.value)} disabled={locked} rows={3} maxLength={300} placeholder="Two sentences that tell readers what they’ll learn. Shown on the blog page and in Google." className={input} /></label>
            <E k="excerpt" />
          </div>

          <details className="card p-4 sm:p-5" open={!!(f.metaTitle || f.metaDescription)}>
            <summary className="text-sm font-bold cursor-pointer">Google search appearance (optional)</summary>
            <div className="mt-3 space-y-3">
              <label className="block"><span className="text-xs font-semibold text-ink-500 flex justify-between">SEO title <Count v={f.metaTitle} max={70} /></span>
                <input value={f.metaTitle} onChange={(e) => set('metaTitle')(e.target.value)} disabled={locked} maxLength={70} placeholder={f.title} className={input} /></label>
              <label className="block"><span className="text-xs font-semibold text-ink-500 flex justify-between">SEO description <Count v={f.metaDescription} max={170} good={120} /></span>
                <textarea value={f.metaDescription} onChange={(e) => set('metaDescription')(e.target.value)} disabled={locked} rows={2} maxLength={170} placeholder={f.excerpt} className={input} /></label>
              <div className="rounded-xl ring-1 ring-ink-100 p-3 bg-white">
                <p className="text-xs text-ink-500 truncate">{SITE_URL.replace('https://', '')} › blog › {f.slug || 'your-post'}</p>
                <p className="text-[#1a0dab] text-lg leading-snug truncate">{(f.metaTitle || f.title || 'Your post title') + ' | AnimalVeda Blog'}</p>
                <p className="text-sm text-ink-700 line-clamp-2">{f.metaDescription || f.excerpt || 'Your summary appears here.'}</p>
              </div>
            </div>
          </details>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4">
          <div className="card p-4 space-y-2">
            {admin ? <>
              <button type="button" onClick={() => save('publish')} disabled={!!busy} className="btn-primary w-full justify-center">{busy === 'publish' ? <Loader2 size={17} className="animate-spin" /> : <Globe size={17} />} {live ? 'Update live post' : 'Publish now'}</button>
              {!live && <button type="button" onClick={() => save('save')} disabled={!!busy} className="btn-ghost w-full justify-center">{busy === 'save' ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />} Save as draft</button>}
            </> : !locked && <>
              <button type="button" onClick={() => save('submit')} disabled={!!busy} className="btn-primary w-full justify-center">{busy === 'submit' ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />} {post?.status === 'pending' ? 'Update & keep in review' : 'Send for approval'}</button>
              <button type="button" onClick={() => save('save')} disabled={!!busy} className="btn-ghost w-full justify-center">{busy === 'save' ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />} Save draft</button>
              {post?.status === 'pending' && <button type="button" onClick={() => act(`/author/posts/${post._id}/withdraw`, 'post', 'Taken back to draft.')} disabled={!!busy} className="w-full text-sm font-bold text-ink-500 hover:text-ink-900 inline-flex items-center justify-center gap-1.5 py-1"><Undo2 size={15} /> Take back to draft</button>}
            </>}
            {!admin && !locked && <p className="text-[11px] text-ink-500 leading-snug">Posts go live only after the admin approves them.</p>}
            {post && (admin || !live) && <button type="button" onClick={() => { if (confirm('Delete this post for good?')) act(`${apiBase}/posts/${post._id}`, 'del', '', () => nav(back)) }} disabled={!!busy} className="w-full text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg inline-flex items-center justify-center gap-1.5 py-2"><Trash2 size={15} /> Delete post</button>}
          </div>

          <div className="card p-4">
            <p className="text-sm font-bold mb-2">Cover image <span className="text-red-500">*</span></p>
            {f.cover ? (
              <div className="relative">
                <img src={f.cover} alt="" className="w-full aspect-[16/9] object-cover rounded-xl bg-sand-100" />
                {!locked && <button type="button" onClick={() => set('cover')('')} aria-label="Remove cover" className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 grid place-items-center shadow"><X size={16} /></button>}
              </div>
            ) : (
              <button type="button" onClick={() => coverInput.current?.click()} disabled={locked || busy === 'cover'} className="w-full aspect-[16/9] rounded-xl border-2 border-dashed border-ink-200 hover:border-brand-300 grid place-items-center text-sm text-ink-500">
                {busy === 'cover' ? <Loader2 className="animate-spin" /> : <span className="flex flex-col items-center gap-1"><Upload size={20} /> Upload picture<span className="text-[11px]">Wide (16:9) works best</span></span>}
              </button>
            )}
            <input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onCover} />
            <E k="cover" />
            <label className="block mt-3"><span className="text-xs font-semibold text-ink-500">Describe the picture</span>
              <input value={f.coverAlt} onChange={(e) => set('coverAlt')(e.target.value)} disabled={locked} maxLength={160} placeholder="e.g. Vet checking a puppy's ears" className={input} /></label>
            <p className="text-[11px] text-ink-500 mt-2">Use only your own photos or pictures you have the right to use.</p>
          </div>

          <div className="card p-4 space-y-3">
            <label className="block"><span className="text-sm font-bold">Category <span className="text-red-500">*</span></span>
              <select value={f.category} onChange={(e) => set('category')(e.target.value)} disabled={locked} className={input}>
                <option value="">Choose…</option>
                {cats.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select></label>
            <E k="category" />
            {!locked && <NewCategory apiBase={apiBase} onAdded={(c) => set('category')(c.slug)} />}
            <label className="block"><span className="text-sm font-bold">Tags</span>
              <input value={f.tags} onChange={(e) => set('tags')(e.target.value)} disabled={locked} placeholder="puppy, deworming, vaccination" className={input} /></label>
            <p className="text-[11px] text-ink-500">Separate with commas. Up to 10.</p>
          </div>

          <div className="rounded-2xl bg-sand-50 ring-1 ring-ink-100 p-4 text-xs text-ink-700 space-y-1.5">
            <p className="font-bold text-ink-900">Before you send it</p>
            {[['A title of 10+ characters', f.title.trim().length >= 10], ['A summary of 50+ characters', f.excerpt.trim().length >= 50], ['At least 150 words', wc >= 150], ['A cover image', !!f.cover], ['A category', !!f.category]].map(([t, ok]) => (
              <p key={t} className={`flex items-center gap-1.5 ${ok ? 'text-green-700' : ''}`}>{ok ? <Check size={13} /> : <span className="w-[13px] h-[13px] rounded-full border border-ink-300 inline-block" />} {t}</p>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

// "+ New category": adds it for everyone and selects it
function NewCategory({ apiBase, onAdded }) {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const add = async () => {
    if (name.trim().length < 2) { setErr('Use at least 2 characters.'); return }
    setBusy(true); setErr('')
    try {
      const r = await api.post(`${apiBase === '/author' ? '/author' : '/admin/blog'}/categories`, { name: name.trim() })
      await qc.invalidateQueries({ queryKey: ['blog-categories'] })
      onAdded(r.category); setName(''); setOpen(false)
    } catch (x) { setErr(x.data?.errors?.name || x.message) } finally { setBusy(false) }
  }
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline"><Plus size={14} /> New category</button>
  return (
    <div className="rounded-xl bg-sand-50 ring-1 ring-ink-100 p-2.5">
      <div className="flex gap-2">
        <input autoFocus value={name} onChange={(e) => { setName(e.target.value); setErr('') }} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } if (e.key === 'Escape') setOpen(false) }}
          maxLength={40} placeholder="e.g. Bird care" aria-label="New category name" className="flex-1 min-w-0 border border-ink-200 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-brand-400 bg-white" />
        <button type="button" onClick={add} disabled={busy} className="btn-primary !py-1.5 !px-3 text-xs">{busy ? <Loader2 size={14} className="animate-spin" /> : 'Add'}</button>
        <button type="button" onClick={() => { setOpen(false); setErr('') }} aria-label="Cancel" className="p-1.5 rounded-lg text-ink-500 hover:bg-ink-100"><X size={15} /></button>
      </div>
      {err && <p role="alert" className="mt-1 text-xs font-semibold text-red-600">{err}</p>}
    </div>
  )
}
