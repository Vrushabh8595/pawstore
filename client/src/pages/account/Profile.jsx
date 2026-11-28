import { useEffect, useRef, useState } from 'react'
import { Camera, Trash2, Loader2, Check, Mail, Lock, ShieldCheck, Pencil, KeyRound, Send } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { api } from '@/lib/api'
import { playSound, haptic } from '@/lib/feedback'
import { Field, useFieldErrors, isEmail, errorFeedback } from '@/components/FormField'
import Avatar from '@/components/Avatar'
import AddressBook from '@/components/AddressBook'
import { RX, textError, phoneError } from '@/lib/validate'

export default function Profile() {
  const user = useAuth((s) => s.user)
  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-5">My profile</h1>
      <div className="grid gap-4 max-w-2xl">
        <PhotoCard user={user} />
        <DetailsCard user={user} />
        <AddressBook />
        <EmailCard user={user} />
        <p className="flex items-start gap-2 text-xs text-ink-500 px-1">
          <ShieldCheck size={15} className="shrink-0 text-green-600 mt-px" />
          Your details are only used to deliver your orders and send order updates. We never share them.
        </p>
      </div>
    </div>
  )
}

function Saved({ show, text = 'Saved' }) {
  if (!show) return null
  return <span className="inline-flex items-center gap-1 text-sm font-bold text-green-700 animate-fade-in" role="status"><Check size={16} />{text}</span>
}

/* --------------------------------- Photo --------------------------------- */
// The picked photo is redrawn on a canvas as a fresh JPEG (256px, plus a 64px
// thumbnail for lists). That throws away everything in the original file
// except the pixels (metadata, hidden payloads…) and keeps it small. The
// server re-checks the bytes anyway.
function toAvatar(file) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error('Please choose a JPG, PNG or WebP photo.'))
    if (file.size > 10 * 1024 * 1024) return reject(new Error('That photo is over 10 MB. Please choose a smaller one.'))
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const side = Math.min(img.naturalWidth, img.naturalHeight)
      const sx = (img.naturalWidth - side) / 2
      const sy = (img.naturalHeight - side) / 2
      const draw = (S, q) => {
        const c = document.createElement('canvas')
        c.width = S; c.height = S
        const ctx = c.getContext('2d')
        ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, S, S)
        ctx.drawImage(img, sx, sy, side, side, 0, 0, S, S)
        return c.toDataURL('image/jpeg', q)
      }
      const avatar = draw(256, 0.85)
      const avatarThumb = draw(64, 0.8)
      URL.revokeObjectURL(url)
      resolve({ avatar, avatarThumb })
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file isn’t a photo we can read.')) }
    img.src = url
  })
}

function PhotoCard({ user }) {
  const updateUser = useAuth((s) => s.updateUser)
  const input = useRef(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [ok, setOk] = useState('')
  const fromGoogle = user?.avatar && user?.avatarSource === 'google'

  const save = async (photo) => {
    setBusy(true); setErr(''); setOk('')
    try {
      const res = await api.patch('/auth/me', photo ? { avatar: photo.avatar, avatarThumb: photo.avatarThumb } : { avatar: '' })
      updateUser(res.user)
      setOk(photo ? 'Photo updated' : 'Photo removed')
      playSound('success'); haptic(20)
      setTimeout(() => setOk(''), 2500)
    } catch (e) {
      setOk(''); setErr(e.message); errorFeedback()
    } finally { setBusy(false) }
  }

  const pick = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try { await save(await toAvatar(file)) } catch (x) { setOk(''); setErr(x.message); errorFeedback() }
  }

  return (
    <section className="card p-5 sm:p-6 flex items-center gap-4 sm:gap-5">
      <div className="relative">
        <Avatar user={user} size={84} className="ring-4 ring-brand-50" />
        {busy && <span className="absolute inset-0 grid place-items-center rounded-full bg-white/70"><Loader2 className="animate-spin text-brand-600" /></span>}
      </div>
      <div className="min-w-0">
        <p className="font-extrabold text-lg truncate">{user?.name}</p>
        <p className="text-sm text-ink-500 mb-3">{fromGoogle ? 'Photo from your Google account. You can change it anytime.' : 'JPG, PNG or WebP. We crop it to a square.'}</p>
        <div className="flex flex-wrap items-center gap-2">
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pick} />
          <button type="button" disabled={busy} onClick={() => input.current?.click()} className="btn-primary !py-2 !px-4 text-sm"><Camera size={16} /> {user?.avatar ? 'Change photo' : 'Add photo'}</button>
          {user?.avatar && <button type="button" disabled={busy} onClick={() => save(null)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50"><Trash2 size={15} /> Remove</button>}
          <Saved show={!!ok} text={ok} />
        </div>
        {err && <p role="alert" className="mt-2 text-xs font-semibold text-red-600">{err}</p>}
      </div>
    </section>
  )
}

/* ------------------------------ Name / phone ------------------------------ */
function DetailsCard({ user }) {
  const updateUser = useAuth((s) => s.updateUser)
  const fe = useFieldErrors()
  const E = fe.errors
  const [f, setF] = useState({ name: user?.name || '', phone: user?.phone || '' })
  const [busy, setBusy] = useState(false)
  const [ok, setOk] = useState(false)
  const [err, setErr] = useState('')
  const dirty = useRef(false)
  // The signed-in user may refresh from the server after this page opens:
  // pick up those values unless the customer has already started editing.
  const snapshot = JSON.stringify([user?.name, user?.phone])
  useEffect(() => {
    if (dirty.current || !user) return
    setF({ name: user.name || '', phone: user.phone || '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot])
  const set = (k) => (v) => { dirty.current = true; setF((s) => ({ ...s, [k]: v })); fe.clear(k); setOk(false) }

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    const valid = fe.validate({
      name: textError(f.name, 'Name', RX.name, 2, 60, 'Use letters only for your name.'),
      phone: phoneError(f.phone, false),
    })
    if (!valid) return
    setBusy(true)
    try {
      const res = await api.patch('/auth/me', { name: f.name, phone: f.phone })
      dirty.current = false
      updateUser(res.user)
      setOk(true); playSound('success'); haptic(20)
      setTimeout(() => setOk(false), 3000)
    } catch (x) {
      const errs = x.data?.errors
      if (errs && Object.keys(errs).length) fe.validate(errs)
      else { setErr(x.message); errorFeedback() }
    } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} noValidate className="card p-5 sm:p-6">
      <h2 className="font-extrabold text-lg mb-4 flex items-center gap-2"><Pencil size={18} className="text-brand-600" /> Personal details</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field name="name" required error={E.name} label="Full name" value={f.name} onChange={set('name')} autoComplete="name" maxLength={60} />
        <Field name="phone" optional error={E.phone} label="Mobile" value={f.phone} type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10}
          prefix="+91" onChange={(v) => set('phone')(v.replace(/\D/g, '').slice(0, 10))} />
      </div>
      {err && <p role="alert" className="mt-4 text-sm font-semibold text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
      <div className="mt-5 flex items-center gap-3">
        <button type="submit" disabled={busy} className="btn-primary">{busy ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} Save changes</button>
        <Saved show={ok} text="Profile saved" />
      </div>
    </form>
  )
}

/* ---------------------------------- Email --------------------------------- */
// Email/password accounts confirm with their current password. Google accounts
// have no password, so we email a 6-digit code to the new address instead.
function EmailCard({ user }) {
  const updateUser = useAuth((s) => s.updateUser)
  const fe = useFieldErrors()
  const E = fe.errors
  const google = user?.provider === 'google'
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [ok, setOk] = useState(false)
  const [info, setInfo] = useState('')
  const pending = google ? user?.pendingEmail || '' : ''

  const done = (u) => {
    updateUser(u)
    setOpen(false); setEmail(''); setPassword(''); setCode(''); setInfo('')
    setOk(true); playSound('success'); haptic(20)
    setTimeout(() => setOk(false), 3500)
  }
  const fail = (x, field) => {
    const errs = x.data?.errors
    fe.validate(errs && Object.keys(errs).length ? errs : { [field]: x.message })
  }
  const checkEmail = (v) => !v ? 'Enter your new email.' : !isEmail(v) ? 'This email doesn’t look right (e.g. name@gmail.com).' : v === user?.email ? 'This is already your email.' : null

  // Email + password accounts
  const submitPassword = async (e) => {
    e.preventDefault()
    const v = email.trim().toLowerCase()
    if (!fe.validate({ email: checkEmail(v), password: !password ? 'Enter your current password to confirm it’s you.' : null })) return
    setBusy(true)
    try { done((await api.patch('/auth/me/email', { email: v, password })).user) } catch (x) { fail(x, 'password') } finally { setBusy(false); setPassword('') }
  }

  // Google accounts: step 1, send a code to the new email
  const sendCode = async (e) => {
    e?.preventDefault?.()
    const v = (pending && !email ? pending : email).trim().toLowerCase()
    if (!fe.validate({ email: checkEmail(v) })) return
    setBusy(true)
    try {
      const res = await api.post('/auth/me/email/code', { email: v })
      updateUser(res.user); setEmail(v); setCode(''); setInfo(res.message)
    } catch (x) { fail(x, 'email') } finally { setBusy(false) }
  }
  // step 2, enter the code
  const verify = async (e) => {
    e.preventDefault()
    if (!fe.validate({ code: /^\d{6}$/.test(code) ? null : 'Enter the 6-digit code from the email.' })) return
    setBusy(true)
    try { done((await api.post('/auth/me/email/verify', { code })).user) } catch (x) { fail(x, 'code') } finally { setBusy(false) }
  }
  const cancel = async () => {
    setOpen(false); setEmail(''); setPassword(''); setCode(''); setInfo(''); fe.validate({})
    if (pending) { try { updateUser((await api.del('/auth/me/email/code')).user) } catch { /* ignore */ } }
  }

  const showForm = open || !!pending
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-extrabold text-lg mb-1 flex items-center gap-2"><Mail size={18} className="text-brand-600" /> Email</h2>
      <p className="text-xs text-ink-500 mb-3">Order confirmations and delivery updates are sent here.</p>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-sand-50 rounded-xl px-4 py-3">
        <span className="min-w-0">
          <span className="block font-bold break-all">{user?.email}</span>
          {google && <span className="block text-xs text-ink-500">You sign in with Google. Changing this doesn’t change your Google account.</span>}
        </span>
        {!showForm && <button type="button" onClick={() => setOpen(true)} className="text-sm font-bold text-brand-700 hover:underline">Change email</button>}
      </div>
      <Saved show={ok} text="Email updated" />

      {showForm && !google && (
        <form onSubmit={submitPassword} noValidate className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field name="email" required error={E.email} label="New email" type="email" inputMode="email" autoComplete="email" value={email} maxLength={120}
            onChange={(v) => { setEmail(v); fe.clear('email') }} />
          <Field name="password" required error={E.password} label="Current password" type="password" autoComplete="current-password" value={password} maxLength={128}
            onChange={(v) => { setPassword(v); fe.clear('password') }} />
          <div className="sm:col-span-2 flex items-center gap-3">
            <button type="submit" disabled={busy} className="btn-primary !py-2 text-sm">{busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />} Update email</button>
            <button type="button" onClick={cancel} className="text-sm font-bold text-ink-500 hover:text-ink-900">Cancel</button>
          </div>
        </form>
      )}

      {showForm && google && !pending && (
        <form onSubmit={sendCode} noValidate className="mt-4 grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-3 items-end">
          <Field name="email" required error={E.email} label="New email" type="email" inputMode="email" autoComplete="email" value={email} maxLength={120}
            onChange={(v) => { setEmail(v); fe.clear('email') }} />
          <button type="submit" disabled={busy} className="btn-primary !py-2.5 text-sm">{busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send code</button>
          <p className="sm:col-span-2 text-xs text-ink-500">We’ll email a 6-digit code to the new address to make sure it’s yours. <button type="button" onClick={cancel} className="font-bold text-ink-700 hover:underline">Cancel</button></p>
        </form>
      )}

      {google && pending && (
        <form onSubmit={verify} noValidate className="mt-4 rounded-xl border border-brand-200 bg-brand-50/50 p-4">
          <p className="text-sm text-ink-700 mb-3">{info || <>We sent a 6-digit code to <b className="break-all">{pending}</b>.</>} Check the inbox (and spam folder).</p>
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,220px)_auto] gap-3 items-end">
            <Field name="code" required error={E.code} label="Code" value={code} inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456"
              onChange={(v) => { setCode(v.replace(/\D/g, '').slice(0, 6)); fe.clear('code') }} />
            <button type="submit" disabled={busy} className="btn-primary !py-2.5 text-sm">{busy ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />} Confirm new email</button>
          </div>
          <p className="mt-3 text-xs text-ink-500">
            Didn’t get it? <button type="button" disabled={busy} onClick={() => sendCode()} className="font-bold text-brand-700 hover:underline">Send again</button>
            {' · '}<button type="button" onClick={cancel} className="font-bold text-ink-700 hover:underline">Cancel</button>
          </p>
        </form>
      )}
    </section>
  )
}
