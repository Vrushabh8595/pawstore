import { useEffect, useRef, useState } from 'react'
import { Camera, Trash2, Loader2, Check, Mail, Lock, ShieldCheck, MapPin, Pencil } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { api } from '@/lib/api'
import { usePincode } from '@/lib/usePincode'
import { playSound, haptic } from '@/lib/feedback'
import { Field, useFieldErrors, isEmail, errorFeedback } from '@/components/FormField'
import Avatar from '@/components/Avatar'

// Same allow-lists the server enforces. The server is the real guard; these
// just give instant, friendly messages.
const BAD = /(javascript:|vbscript:|data:|on\w+\s*=|<|>|\{\{|\$\{|`)/i
const RX = {
  name: /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u,
  line: /^[\p{L}\p{M}\p{N} ,./#()&'’:-]+$/u,
  place: /^[\p{L}\p{M} .&'-]+$/u,
}
const textError = (v, label, re, min, max, msg) => {
  const s = v.replace(/\s+/g, ' ').trim()
  if (s.length < min) return min > 1 ? `Enter your ${label.toLowerCase()}.` : null
  if (s.length > max) return `${label} is too long.`
  if (BAD.test(s) || /[\u0000-\u001f\u007f]/.test(s)) return `${label} contains characters that aren’t allowed.`
  if (!re.test(s)) return msg
  return null
}

// Server field keys ("address.pincode") → our field names
const fromServer = (errors = {}) => Object.fromEntries(Object.entries(errors).map(([k, v]) => [k.replace('address.', ''), v]))

export default function Profile() {
  const user = useAuth((s) => s.user)
  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-5">My profile</h1>
      <div className="grid gap-4 max-w-2xl">
        <PhotoCard user={user} />
        <DetailsCard user={user} />
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
// The picked photo is redrawn on a canvas as a fresh 256×256 JPEG. That throws
// away everything in the original file except the pixels (metadata, hidden
// payloads…) and keeps it small. The server re-checks the bytes anyway.
function toAvatar(file) {
  return new Promise((resolve, reject) => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return reject(new Error('Please choose a JPG, PNG or WebP photo.'))
    if (file.size > 10 * 1024 * 1024) return reject(new Error('That photo is over 10 MB. Please choose a smaller one.'))
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const S = 256
      const c = document.createElement('canvas')
      c.width = S; c.height = S
      const side = Math.min(img.naturalWidth, img.naturalHeight)
      const sx = (img.naturalWidth - side) / 2
      const sy = (img.naturalHeight - side) / 2
      const ctx = c.getContext('2d')
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, S, S)
      ctx.drawImage(img, sx, sy, side, side, 0, 0, S, S)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', 0.85))
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

  const save = async (avatar) => {
    setBusy(true); setErr(''); setOk('')
    try {
      const res = await api.patch('/auth/me', { avatar })
      updateUser(res.user)
      setOk(avatar ? 'Photo updated' : 'Photo removed')
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
        <p className="text-sm text-ink-500 mb-3">JPG, PNG or WebP. We crop it to a square.</p>
        <div className="flex flex-wrap items-center gap-2">
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={pick} />
          <button type="button" disabled={busy} onClick={() => input.current?.click()} className="btn-primary !py-2 !px-4 text-sm"><Camera size={16} /> {user?.avatar ? 'Change photo' : 'Add photo'}</button>
          {user?.avatar && <button type="button" disabled={busy} onClick={() => save('')} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50"><Trash2 size={15} /> Remove</button>}
          <Saved show={!!ok} text={ok} />
        </div>
        {err && <p role="alert" className="mt-2 text-xs font-semibold text-red-600">{err}</p>}
      </div>
    </section>
  )
}

/* ------------------------------ Name / phone / address ------------------------------ */
function DetailsCard({ user }) {
  const updateUser = useAuth((s) => s.updateUser)
  const fe = useFieldErrors()
  const E = fe.errors
  const a = user?.address || {}
  const [f, setF] = useState({
    name: user?.name || '', phone: user?.phone || '',
    line1: a.line1 || '', landmark: a.landmark || '', city: a.city || '', state: a.state || '', pincode: a.pincode || '',
  })
  const [busy, setBusy] = useState(false)
  const [ok, setOk] = useState(false)
  const [err, setErr] = useState('')
  const startPin = useRef(a.pincode || '')
  const dirty = useRef(false)
  // The signed-in user may refresh from the server after this page opens:
  // pick up those values unless the customer has already started editing.
  const snapshot = JSON.stringify([user?.name, user?.phone, user?.address])
  useEffect(() => {
    if (dirty.current || !user) return
    const ad = user.address || {}
    startPin.current = ad.pincode || ''
    setF({ name: user.name || '', phone: user.phone || '', line1: ad.line1 || '', landmark: ad.landmark || '', city: ad.city || '', state: ad.state || '', pincode: ad.pincode || '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot])
  const set = (k) => (v) => { dirty.current = true; setF((s) => ({ ...s, [k]: v })); fe.clear(k); setOk(false) }
  const pin = usePincode(f.pincode, (d) => {
    if (f.pincode === startPin.current) return // don't overwrite a saved city/state on load
    setF((s) => ({ ...s, city: d.city, state: d.state }))
    fe.clear('city'); fe.clear('state')
  })

  const anyAddress = ['line1', 'landmark', 'city', 'state', 'pincode'].some((k) => f[k].trim())

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    const valid = fe.validate({
      name: textError(f.name, 'Name', RX.name, 2, 60, 'Use letters only for your name.'),
      phone: f.phone && !/^[6-9]\d{9}$/.test(f.phone) ? 'Enter a valid 10-digit mobile number.' : null,
      line1: anyAddress ? textError(f.line1, 'Address', RX.line, 5, 160, 'Use letters, numbers and , . / # - only.') : null,
      landmark: anyAddress && f.landmark.trim() ? textError(f.landmark, 'Landmark', RX.line, 2, 80, 'Use letters, numbers and , . / # - only.') : null,
      pincode: anyAddress ? (!/^[1-9]\d{5}$/.test(f.pincode) || pin.status === 'notfound' ? 'Enter a valid 6-digit pincode.' : null) : null,
      city: anyAddress ? textError(f.city, 'City', RX.place, 2, 60, 'Use letters only for the city.') : null,
      state: anyAddress ? textError(f.state, 'State', RX.place, 2, 60, 'Use letters only for the state.') : null,
    })
    if (!valid) return
    setBusy(true)
    try {
      const res = await api.patch('/auth/me', {
        name: f.name, phone: f.phone,
        address: anyAddress ? { line1: f.line1, landmark: f.landmark, city: f.city, state: f.state, pincode: f.pincode } : null,
      })
      dirty.current = false
      updateUser(res.user)
      setOk(true); playSound('success'); haptic(20)
      setTimeout(() => setOk(false), 3000)
    } catch (x) {
      const errs = fromServer(x.data?.errors)
      if (Object.keys(errs).length) fe.validate(errs)
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

      <h3 className="font-extrabold mt-6 mb-1 flex items-center gap-2"><MapPin size={17} className="text-brand-600" /> Saved delivery address</h3>
      <p className="text-xs text-ink-500 mb-3">We fill this in for you at checkout. Leave it all empty to remove it.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2"><Field name="line1" required={anyAddress} error={E.line1} label="Address" hint="House no, street, area" value={f.line1} onChange={set('line1')} autoComplete="street-address" maxLength={160} /></div>
        <Field name="landmark" optional error={E.landmark} label="Landmark" value={f.landmark} onChange={set('landmark')} maxLength={80} />
        <div>
          <Field name="pincode" required={anyAddress} error={E.pincode} label="Pincode" value={f.pincode} inputMode="numeric" autoComplete="postal-code" maxLength={6}
            onChange={(v) => set('pincode')(v.replace(/\D/g, '').slice(0, 6))} />
          {!E.pincode && pin.status === 'loading' && <p className="text-[11px] text-ink-500 mt-1">Finding your city…</p>}
          {!E.pincode && pin.status === 'notfound' && <p className="text-[11px] font-semibold text-red-600 mt-1">We couldn’t find this pincode. Please check it.</p>}
        </div>
        <Field name="city" required={anyAddress} error={E.city} label="City" value={f.city} onChange={set('city')} autoComplete="address-level2" maxLength={60} />
        <Field name="state" required={anyAddress} error={E.state} label="State" value={f.state} onChange={set('state')} autoComplete="address-level1" maxLength={60} />
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
function EmailCard({ user }) {
  const updateUser = useAuth((s) => s.updateUser)
  const fe = useFieldErrors()
  const E = fe.errors
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [ok, setOk] = useState(false)
  const google = user?.provider === 'google'

  const submit = async (e) => {
    e.preventDefault()
    const v = email.trim().toLowerCase()
    const valid = fe.validate({
      email: !v ? 'Enter your new email.' : !isEmail(v) ? 'This email doesn’t look right (e.g. name@gmail.com).' : v === user?.email ? 'This is already your email.' : null,
      password: !password ? 'Enter your current password to confirm it’s you.' : null,
    })
    if (!valid) return
    setBusy(true)
    try {
      const res = await api.patch('/auth/me/email', { email: v, password })
      updateUser(res.user)
      setOpen(false); setEmail(''); setPassword('')
      setOk(true); playSound('success'); haptic(20)
      setTimeout(() => setOk(false), 3500)
    } catch (x) {
      const errs = x.data?.errors
      fe.validate(errs && Object.keys(errs).length ? errs : { password: x.message })
    } finally { setBusy(false); setPassword('') }
  }

  return (
    <section className="card p-5 sm:p-6">
      <h2 className="font-extrabold text-lg mb-1 flex items-center gap-2"><Mail size={18} className="text-brand-600" /> Email</h2>
      <p className="text-xs text-ink-500 mb-3">Order confirmations and delivery updates are sent here.</p>
      <div className="flex flex-wrap items-center justify-between gap-3 bg-sand-50 rounded-xl px-4 py-3">
        <span className="font-bold break-all">{user?.email}</span>
        {google
          ? <span className="text-xs font-semibold text-ink-500">Managed by your Google account</span>
          : !open && <button type="button" onClick={() => setOpen(true)} className="text-sm font-bold text-brand-700 hover:underline">Change email</button>}
      </div>
      <Saved show={ok} text="Email updated" />
      {open && !google && (
        <form onSubmit={submit} noValidate className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field name="email" required error={E.email} label="New email" type="email" inputMode="email" autoComplete="email" value={email} maxLength={120}
            onChange={(v) => { setEmail(v); fe.clear('email') }} />
          <Field name="password" required error={E.password} label="Current password" type="password" autoComplete="current-password" value={password} maxLength={128}
            onChange={(v) => { setPassword(v); fe.clear('password') }} />
          <div className="sm:col-span-2 flex items-center gap-3">
            <button type="submit" disabled={busy} className="btn-primary !py-2 text-sm">{busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />} Update email</button>
            <button type="button" onClick={() => { setOpen(false); setEmail(''); setPassword(''); fe.validate({}) }} className="text-sm font-bold text-ink-500 hover:text-ink-900">Cancel</button>
          </div>
        </form>
      )}
    </section>
  )
}
