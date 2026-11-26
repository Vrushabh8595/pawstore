import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Camera, ImagePlus, X, Send, CheckCircle2, Search, Truck, Loader2, ShieldCheck, Phone } from 'lucide-react'
import { api } from '@/lib/api'
import { playSound, haptic } from '@/lib/feedback'
import { LogoMark } from '@/components/Logo'
import { useAuth } from '@/store/auth'
import { Field, useFieldErrors, errorFeedback } from '@/components/FormField'
import { usePincode } from '@/lib/usePincode'

const PHONE = '7620377278'
const NEEDS = ['Medicine', 'Food', 'Custom medicine', 'Supplement', 'Other']
const ANIMALS = [
  ['Dog', '🐕'], ['Cat', '🐈'], ['Cattle', '🐄'], ['Goat', '🐐'],
  ['Horse', '🐎'], ['Poultry', '🐓'], ['Bird', '🦜'], ['Other', '🐾'],
]
const MAX_PHOTOS = 3

// Shrinks a photo to ≤1280px JPEG so uploads stay small on mobile data.
function compress(file, max = 1280, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * scale)
      c.height = Math.round(img.height * scale)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(url)
      resolve(c.toDataURL('image/jpeg', quality))
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image')) }
    img.src = url
  })
}

function saveLocal(req) {
  try {
    const all = JSON.parse(localStorage.getItem('animalveda-requests') || '[]')
    localStorage.setItem('animalveda-requests', JSON.stringify([{ ...req, photos: undefined }, ...all].slice(0, 20)))
  } catch { /* ignore */ }
}

export default function Request() {
  const user = useAuth((s) => s.user)
  const [f, setF] = useState({
    need: 'Medicine', animal: 'Dog', animalOther: '', product: '', brand: '', strength: '', quantity: '', details: '',
    urgency: 'Normal', name: user?.name || '', phone: user?.phone || '', city: '', pincode: '', contactVia: 'WhatsApp',
  })
  const [photos, setPhotos] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [done, setDone] = useState(null)
  const fileRef = useRef(null)
  const camRef = useRef(null)
  const fe = useFieldErrors()
  const set = (k) => (v) => { setF((s) => ({ ...s, [k]: v })); fe.clear(k) }
  const otherRef = useRef(null)
  const pin = usePincode(f.pincode, (d) => setF((s) => ({ ...s, city: d.city })))
  const isOther = f.animal === 'Other'
  const titleCase = (v) => v.replace(/\s+/g, ' ').replace(/\b\p{L}/gu, (c) => c.toUpperCase())
  const animalName = isOther ? (f.animalOther.trim() ? titleCase(f.animalOther.trim()) : 'animal') : f.animal
  useEffect(() => { if (isOther) otherRef.current?.focus({ preventScroll: false }) }, [isOther])

  const addFiles = async (files) => {
    setErr('')
    const room = MAX_PHOTOS - photos.length
    const list = [...files].filter((x) => x.type.startsWith('image/')).slice(0, room)
    try {
      const out = await Promise.all(list.map((x) => compress(x)))
      setPhotos((p) => [...p, ...out].slice(0, MAX_PHOTOS))
      if (out.length) fe.clear('product')
      haptic(10)
    } catch (e) { setErr(e.message) }
  }

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!fe.validate({
      animalOther: isOther && !f.animalOther.trim() ? 'Tell us which animal this is for.' : null,
      product: !f.product.trim() && photos.length === 0 ? 'Enter the product name — or add a photo of it below.' : null,
      name: !f.name.trim() ? 'Please add your name.' : null,
      phone: !f.phone ? 'Enter your phone number so we can reach you.' : !/^[6-9]\d{9}$/.test(f.phone) ? 'Enter a valid 10-digit mobile number.' : null,
      pincode: f.pincode && !/^\d{6}$/.test(f.pincode) ? 'Pincode should be 6 digits.' : null,
    })) return
    setBusy(true)
    const payload = { ...f, animalOther: isOther ? titleCase(f.animalOther.trim()) : '', photos }
    let ref = null
    try {
      const res = await api.post('/requests', payload)
      ref = res?.request?.ref
    } catch (e) {
      setBusy(false)
      const down = e instanceof TypeError || e instanceof SyntaxError || /Route not found|Request failed \(5/.test(e.message)
      errorFeedback()
      return setErr(down
        ? `We couldn’t send your request just now. Please try again in a minute, or call us on ${PHONE}.`
        : e.message === 'Validation failed' ? 'Please check your details and try again.' : e.message)
    }
    saveLocal({ ...payload, ref, createdAt: Date.now() })
    setBusy(false)
    playSound('success')
    haptic([30, 50, 30, 50, 70])
    setDone({ ref })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (done) {
    return (
      <div className="container-x py-10 sm:py-16 max-w-lg text-center">
        <div className="relative w-24 h-24 mx-auto">
          <span className="absolute inset-0 rounded-full bg-brand-200 animate-ping opacity-40" />
          <span className="relative grid place-items-center w-24 h-24 rounded-full bg-pine-800 text-white animate-pop"><CheckCircle2 size={46} /></span>
        </div>
        <h1 className="font-display text-3xl font-semibold mt-6">Request received!</h1>
        <p className="text-ink-700 mt-2">Reference <b className="font-mono bg-sand-100 px-2 py-0.5 rounded">{done.ref}</b></p>
        <p className="text-ink-500 mt-3 text-sm">Our team will check availability and {f.contactVia === 'Call' ? 'call' : 'WhatsApp'} you on <b>{f.phone}</b> with price & delivery time{f.urgency === 'Urgent' ? ' — we’ll prioritise this one' : ''}.</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/products" className="btn-primary">Continue shopping</Link>
          <a href={`tel:${PHONE}`} className="btn-ghost"><Phone size={17} /> Call us</a>
        </div>
        <button onClick={() => { setDone(null); setPhotos([]); setF((s) => ({ ...s, animalOther: '', product: '', brand: '', strength: '', quantity: '', details: '' })) }}
          className="mt-5 text-sm font-bold text-brand-600">Request another product</button>
      </div>
    )
  }

  return (
    <div className="pb-8">
      {/* Hero */}
      <section className="bg-pine-800 text-white relative overflow-hidden">
        <span aria-hidden="true" className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-pine-600/50" />
        <span aria-hidden="true" className="absolute -left-10 -bottom-24 w-56 h-56 rounded-full bg-brand-500/20" />
        <div className="container-x relative py-7 sm:py-12 grid sm:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-extrabold uppercase tracking-[.14em] px-3 py-1.5 rounded-full bg-white/10 ring-1 ring-white/20">
              <ShieldCheck size={13} /> Medicines · Food · Custom orders
            </span>
            <h1 className="font-display text-[1.9rem] sm:text-5xl font-semibold leading-[1.05] mt-3">
              Can’t find it?<br /><span className="italic text-brand-400">Snap it.</span> We’ll source it.
            </h1>
            <p className="text-white/75 mt-3 max-w-lg text-sm sm:text-base">Send a photo of the medicine, food or prescription for any animal. We’ll confirm availability and price — usually within a few hours.</p>
          </div>
          <LogoMark size={120} className="hidden sm:block animate-float drop-shadow-2xl" />
        </div>
        <div className="container-x relative pb-6 sm:pb-8">
          <ol className="grid grid-cols-3 gap-2 sm:gap-4 max-w-2xl">
            {[[Camera, 'Send photo & details'], [Search, 'We source & quote'], [Truck, 'Delivered to you']].map(([Icon, t], i) => (
              <li key={t} className="bg-white/5 ring-1 ring-white/10 rounded-2xl p-2.5 sm:p-4" style={{ animation: `fade-up .5s ${0.1 + i * 0.1}s both` }}>
                <span className="grid place-items-center w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-brand-500 mb-1.5 sm:mb-2"><Icon size={17} /></span>
                <p className="text-[11px] sm:text-sm font-bold leading-tight"><span className="text-white/50">{i + 1}.</span> {t}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <form onSubmit={submit} noValidate className="container-x -mt-1 sm:mt-8 grid lg:grid-cols-[minmax(0,1fr)_340px] gap-5 sm:gap-8 items-start">
        <div className="space-y-4 sm:space-y-5 min-w-0 pt-5 sm:pt-0">
          {/* Photos */}
          <section className="card p-4 sm:p-6">
            <h2 className="font-extrabold text-base sm:text-lg">Photos <span className="text-ink-500 font-semibold text-sm">· product, label or prescription</span></h2>
            <p className="text-xs text-ink-500 mt-0.5">Up to {MAX_PHOTOS} photos. A clear photo of the label helps us find the exact item.</p>
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 mt-4">
              {photos.map((src, i) => (
                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden ring-1 ring-ink-100 animate-pop">
                  <img src={src} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))} aria-label="Remove photo"
                    className="absolute top-1.5 right-1.5 w-7 h-7 grid place-items-center rounded-full bg-ink-900/70 text-white active:scale-90"><X size={14} /></button>
                </div>
              ))}
              {photos.length < MAX_PHOTOS && (
                <>
                  <button type="button" onClick={() => camRef.current?.click()}
                    className="aspect-square rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 text-brand-700 flex flex-col items-center justify-center gap-1 font-bold text-xs active:scale-95 transition">
                    <Camera size={24} /> Take photo
                  </button>
                  {photos.length < MAX_PHOTOS - 1 && (
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-pine-200 bg-pine-50 text-pine-700 flex flex-col items-center justify-center gap-1 font-bold text-xs active:scale-95 transition">
                      <ImagePlus size={24} /> Gallery
                    </button>
                  )}
                </>
              )}
            </div>
            <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
          </section>

          {/* What & for whom */}
          <section className="card p-4 sm:p-6 space-y-5">
            <div>
              <h2 className="font-extrabold text-base sm:text-lg mb-2.5">What do you need?</h2>
              <div className="flex flex-wrap gap-2">
                {NEEDS.map((n) => <Pick key={n} on={f.need === n} onClick={() => set('need')(n)}>{n}</Pick>)}
              </div>
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg mb-2.5">For which animal?</h2>
              <div className="grid grid-cols-4 gap-2">
                {ANIMALS.map(([a, e]) => (
                  <button key={a} type="button" onClick={() => { set('animal')(a); haptic(6) }} aria-pressed={f.animal === a}
                    className={`rounded-2xl py-2.5 px-1 flex flex-col items-center gap-1 text-[10.5px] sm:text-xs font-bold border-[1.5px] transition active:scale-95 min-w-0
                      ${f.animal === a ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-100 bg-white text-ink-700'}`}>
                    <span className="text-2xl leading-none">{e}</span><span className="truncate max-w-full">{a}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {isOther && (
                <div className="sm:col-span-2 animate-pop">
                  <Field name="animalOther" required error={fe.errors.animalOther} inputRef={otherRef} label="Animal name" hint="which animal is it for?" value={f.animalOther}
                    onChange={set('animalOther')} onBlur={() => set('animalOther')(titleCase(f.animalOther.trim()))}
                    placeholder="e.g. Rabbit, Pig, Camel, Turtle" autoCapitalize="words" maxLength={60} />
                </div>
              )}
              <div className="sm:col-span-2"> <Field name="product" required={photos.length === 0} hint={photos.length ? 'or photo attached ✓' : 'as on the label'} error={fe.errors.product} label={`${f.need === 'Food' ? 'Food' : f.need === 'Supplement' ? 'Supplement' : 'Medicine / product'} name for your ${animalName}`} value={f.product} onChange={set('product')} placeholder="e.g. Meloxicam oral suspension" /></div>
              <Field label="Brand / company" optional value={f.brand} onChange={set('brand')} />
              <Field label="Strength or pack size" optional value={f.strength} onChange={set('strength')} placeholder="e.g. 1.5 mg/ml, 100 ml" />
              <Field label="Quantity" optional value={f.quantity} onChange={set('quantity')} placeholder="e.g. 2 bottles" />
              <div>
                <span className="font-bold text-sm">Urgency</span>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  {['Normal', 'Urgent'].map((u) => <Pick key={u} block on={f.urgency === u} onClick={() => set('urgency')(u)}>{u === 'Urgent' ? '⚡ Urgent' : 'Normal'}</Pick>)}
                </div>
              </div>
              <Field as="textarea" name="details" optional className="sm:col-span-2" label="Details" value={f.details} onChange={set('details')} rows={3}
                  placeholder={f.need === 'Custom medicine' ? 'Vet prescription details, dosage form (syrup / tablet / injection), flavour…' : 'Anything that helps — animal’s age/weight, vet’s advice, substitutes you’re OK with…'}
              />
            </div>
          </section>

          {/* Contact */}
          <section className="card p-4 sm:p-6">
            <h2 className="font-extrabold text-base sm:text-lg mb-4">How do we reach you?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field name="name" required error={fe.errors.name} label="Your name" value={f.name} onChange={set('name')} autoComplete="name" />
              <Field name="phone" required error={fe.errors.phone} label="Phone" hint="10 digit" type="tel" inputMode="numeric" autoComplete="tel-national" prefix="+91"
                value={f.phone} onChange={(v) => set('phone')(v.replace(/\D/g, '').slice(0, 10))} />
              <div>
                <Field name="pincode" error={fe.errors.pincode} label="Pincode" optional inputMode="numeric" value={f.pincode} onChange={(v) => set('pincode')(v.replace(/\D/g, '').slice(0, 6))} autoComplete="postal-code" />
                {pin.status === 'found' && <p className="text-[11px] font-semibold text-pine-600 mt-1 animate-fade-in">📍 {pin.data.city}, {pin.data.state}</p>}
                {pin.status === 'notfound' && <p className="text-[11px] font-semibold text-red-600 mt-1">Pincode not found — please check it</p>}
              </div>
              <Field label="City" hint={pin.status === 'found' ? 'auto-filled' : undefined} optional={pin.status !== 'found'} value={f.city} onChange={set('city')} autoComplete="address-level2" />
              <div className="sm:col-span-2">
                <span className="font-bold text-sm">Contact me on</span>
                <div className="mt-1 grid grid-cols-2 gap-2 max-w-xs">
                  {['WhatsApp', 'Call'].map((c) => <Pick key={c} block on={f.contactVia === c} onClick={() => set('contactVia')(c)}>{c}</Pick>)}
                </div>
              </div>
            </div>
          </section>
          {err && <p role="alert" className="text-sm font-semibold text-red-600 bg-red-50 rounded-xl p-3">{err}</p>}
        </div>

        {/* Summary / submit */}
        <aside className="card p-4 sm:p-6 lg:sticky lg:top-32 min-w-0">
          <h2 className="font-extrabold text-lg">Your request</h2>
          <dl className="mt-3 text-sm space-y-1.5">
            {[['Need', `${f.need} for ${animalName}`], ['Product', f.product || '—'], ['Photos', `${photos.length} attached`], ['Urgency', f.urgency]].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3"><dt className="text-ink-500">{k}</dt><dd className="font-semibold text-right truncate">{v}</dd></div>
            ))}
          </dl>
          <button type="submit" disabled={busy} className="btn-primary w-full mt-5 disabled:opacity-70">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} />} {busy ? 'Sending…' : 'Send request'}
          </button>
          <p className="text-xs text-ink-500 mt-3">No payment now. We’ll confirm price & availability first. Prescription medicines need a valid vet prescription.</p>
        </aside>
      </form>
    </div>
  )
}

function Pick({ on, onClick, children, block }) {
  return (
    <button type="button" onClick={() => { onClick(); haptic(6) }} aria-pressed={on}
      className={`${block ? 'w-full' : ''} px-3.5 py-2 rounded-full text-sm font-bold border-[1.5px] transition active:scale-95
        ${on ? 'bg-pine-800 border-pine-800 text-white' : 'bg-white border-ink-200 text-ink-700'}`}>
      {children}
    </button>
  )
}
