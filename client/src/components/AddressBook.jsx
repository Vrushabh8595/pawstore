import { useRef, useState } from 'react'
import { Home, Briefcase, MapPin, Plus, Pencil, Trash2, Star, Check, Loader2, X, Phone, LocateFixed } from 'lucide-react'
import { locateAddress } from '@/lib/geolocate'
import { useAuth } from '@/store/auth'
import { api } from '@/lib/api'
import { usePincode } from '@/lib/usePincode'
import { playSound, haptic } from '@/lib/feedback'
import { Field, useFieldErrors, errorFeedback } from '@/components/FormField'
import { RX, textError, phoneError } from '@/lib/validate'

export const MAX_ADDRESSES = 10
const LABELS = [['Home', Home], ['Work', Briefcase], ['Other', MapPin]]
export const LabelIcon = ({ label, size = 15, className = '' }) => {
  const Icon = (LABELS.find(([l]) => l === label) || LABELS[2])[1]
  return <Icon size={size} className={className} />
}

export const addressLine = (a) => [a.line1, a.landmark, a.city, a.state].filter(Boolean).join(', ') + (a.pincode ? ` – ${a.pincode}` : '')

// Server field errors → our field names
const fromServer = (errors = {}) => Object.fromEntries(Object.entries(errors).map(([k, v]) => [k.replace('address.', ''), v]))

/* ------------------------------ Add / edit form ------------------------------ */
// Used on the profile page and at checkout. Saves to the customer's address book.
export function AddressForm({ initial, onSaved, onCancel, submitLabel }) {
  const user = useAuth((s) => s.user)
  const updateUser = useAuth((s) => s.updateUser)
  const fe = useFieldErrors()
  const E = fe.errors
  const editing = !!initial?.id
  const first = !user?.addresses?.length
  const [f, setF] = useState(() => ({
    label: initial?.label || 'Home',
    name: initial?.name || user?.name || '',
    phone: initial?.phone || user?.phone || '',
    line1: initial?.line1 || '', landmark: initial?.landmark || '',
    city: initial?.city || '', state: initial?.state || '', pincode: initial?.pincode || '',
    isDefault: editing ? !!initial.isDefault : first,
  }))
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [geo, setGeo] = useState({ status: 'idle', msg: '' })
  const lineRef = useRef(null)
  const startPin = useRef(initial?.pincode || '')
  const set = (k) => (v) => { setF((s) => ({ ...s, [k]: v })); fe.clear(k) }
  const pin = usePincode(f.pincode, (d) => {
    if (f.pincode === startPin.current && f.city) return // keep the saved city/state when editing
    setF((s) => ({ ...s, city: d.city, state: d.state }))
    fe.clear('city'); fe.clear('state')
  })

  // "Use my current location": GPS → area, city, state and pincode
  const fillFromLocation = async () => {
    setGeo({ status: 'busy', msg: '' })
    try {
      const g = await locateAddress()
      setF((s) => ({ ...s, line1: g.line1 || s.line1, city: g.city || s.city, state: g.state || s.state, pincode: g.pincode || s.pincode }))
      ;['line1', 'city', 'state', 'pincode'].forEach((k) => fe.clear(k))
      setGeo({ status: 'done', msg: `Filled from your location${g.accuracy ? ` (±${g.accuracy > 999 ? (g.accuracy / 1000).toFixed(1) + ' km' : g.accuracy + ' m'})` : ''}. Add your house / flat number so the delivery reaches your door.` })
      haptic(15)
      requestAnimationFrame(() => { const el = lineRef.current?.querySelector('input'); if (el) { el.focus({ preventScroll: true }); el.setSelectionRange?.(0, 0); el.scrollIntoView({ behavior: 'smooth', block: 'center' }) } })
    } catch (x) {
      setGeo({ status: 'error', msg: x.message || 'Couldn’t get your location. Please type your address.' })
    }
  }

  const submit = async (e) => {
    e?.preventDefault?.()
    setErr('')
    const valid = fe.validate({
      name: textError(f.name, 'Name', RX.name, 2, 60, 'Use letters only for the name.'),
      phone: phoneError(f.phone),
      line1: textError(f.line1, 'Address', RX.line, 5, 160, 'Use letters, numbers and , . / # - only.'),
      landmark: f.landmark.trim() ? textError(f.landmark, 'Landmark', RX.line, 2, 80, 'Use letters, numbers and , . / # - only.') : null,
      pincode: !/^[1-9]\d{5}$/.test(f.pincode) || pin.status === 'notfound' ? 'Enter a valid 6-digit pincode.' : null,
      city: textError(f.city, 'City', RX.place, 2, 60, 'Use letters only for the city.'),
      state: textError(f.state, 'State', RX.place, 2, 60, 'Use letters only for the state.'),
    })
    if (!valid) return
    setBusy(true)
    const body = {
      label: f.label, name: f.name, phone: f.phone, line1: f.line1, landmark: f.landmark,
      city: f.city, state: f.state, pincode: f.pincode, ...(f.isDefault ? { isDefault: true } : {}),
    }
    try {
      const res = editing ? await api.patch(`/auth/me/addresses/${initial.id}`, body) : await api.post('/auth/me/addresses', body)
      updateUser(res.user)
      playSound('success'); haptic(20)
      const id = editing ? initial.id : res.address?.id
      onSaved?.(res.user.addresses.find((a) => a.id === id) || null, res.user)
    } catch (x) {
      const errs = fromServer(x.data?.errors)
      if (Object.keys(errs).length) fe.validate(errs)
      else { setErr(x.message); errorFeedback() }
    } finally { setBusy(false) }
  }

  // Not a <form>: it can sit inside the checkout <form> without nesting forms
  return (
    <div onKeyDown={(e) => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); submit() } }}>
      <div className="flex flex-wrap gap-2 mb-3" role="radiogroup" aria-label="Address type">
        {LABELS.map(([l, Icon]) => (
          <button key={l} type="button" role="radio" aria-checked={f.label === l} onClick={() => set('label')(l)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold border-[1.5px] transition active:scale-95 ${f.label === l ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-700 hover:border-brand-300'}`}>
            <Icon size={15} /> {l}
          </button>
        ))}
      </div>
      <button type="button" onClick={fillFromLocation} disabled={geo.status === 'busy'}
        className="w-full mb-3 flex items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-brand-300 bg-white hover:bg-brand-50 px-4 py-3 text-left transition active:scale-[.99] disabled:opacity-80">
        <span className="w-10 h-10 rounded-xl bg-brand-500 text-white grid place-items-center shrink-0">
          {geo.status === 'busy' ? <Loader2 size={19} className="animate-spin" /> : <LocateFixed size={19} />}
        </span>
        <span className="min-w-0">
          <span className="block font-bold text-ink-900">{geo.status === 'busy' ? 'Finding your location…' : geo.status === 'done' ? 'Update from my current location' : 'Use my current location'}</span>
          <span className="block text-xs text-ink-500">Fills in your area, city, state and pincode automatically</span>
        </span>
      </button>
      {geo.msg && <p className={`-mt-1 mb-3 text-xs font-semibold rounded-lg px-3 py-2 ${geo.status === 'error' ? 'text-red-600 bg-red-50' : 'text-green-700 bg-green-50'}`} role={geo.status === 'error' ? 'alert' : 'status'}>{geo.msg}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field name="name" required error={E.name} label="Receiver’s name" value={f.name} onChange={set('name')} autoComplete="name" maxLength={60} />
        <Field name="phone" required error={E.phone} label="Phone" hint="10 digit" value={f.phone} type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10}
          prefix="+91" onChange={(v) => set('phone')(v.replace(/\D/g, '').slice(0, 10))} />
        <div className="sm:col-span-2" ref={lineRef}><Field name="line1" required error={E.line1} label="Address" hint="House no, street, area" value={f.line1} onChange={set('line1')} autoComplete="street-address" maxLength={160} /></div>
        <Field name="landmark" optional error={E.landmark} label="Landmark" value={f.landmark} onChange={set('landmark')} maxLength={80} />
        <div>
          <Field name="pincode" required error={E.pincode} label="Pincode" value={f.pincode} inputMode="numeric" autoComplete="postal-code" maxLength={6}
            onChange={(v) => set('pincode')(v.replace(/\D/g, '').slice(0, 6))} />
          {!E.pincode && pin.status === 'loading' && <p className="text-[11px] text-ink-500 mt-1">Finding your city…</p>}
          {!E.pincode && pin.status === 'found' && <p className="text-[11px] font-semibold text-pine-600 mt-1">📍 {pin.data.city}, {pin.data.state}</p>}
          {!E.pincode && pin.status === 'notfound' && <p className="text-[11px] font-semibold text-red-600 mt-1">We couldn’t find this pincode. Please check it.</p>}
        </div>
        <Field name="city" required error={E.city} label="City" value={f.city} onChange={set('city')} autoComplete="address-level2" maxLength={60} />
        <Field name="state" required error={E.state} label="State" value={f.state} onChange={set('state')} autoComplete="address-level1" maxLength={60} />
      </div>
      {!(editing && initial.isDefault) && !first && (
        <label className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-ink-700 cursor-pointer select-none">
          <input type="checkbox" checked={f.isDefault} onChange={(e) => set('isDefault')(e.target.checked)} className="w-4 h-4 accent-[var(--color-brand-500)]" />
          Make this my default address
        </label>
      )}
      {err && <p role="alert" className="mt-3 text-sm font-semibold text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={submit} disabled={busy} className="btn-primary !py-2.5">
          {busy ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />} {submitLabel || (editing ? 'Save address' : 'Save address')}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="text-sm font-bold text-ink-500 hover:text-ink-900">Cancel</button>}
      </div>
    </div>
  )
}

/* ------------------------------ One saved address ------------------------------ */
export function AddressCard({ a, selected, onSelect, actions }) {
  const Tag = onSelect ? 'button' : 'div'
  return (
    <Tag type={onSelect ? 'button' : undefined} onClick={onSelect} aria-pressed={onSelect ? !!selected : undefined}
      className={`w-full text-left rounded-2xl border-[1.5px] p-4 transition ${onSelect ? 'active:scale-[.99]' : ''} ${selected ? 'border-brand-500 bg-brand-50/60' : 'border-ink-200 hover:border-brand-300 bg-white'}`}>
      <div className="flex items-start gap-3">
        {onSelect && (
          <span className={`mt-0.5 w-5 h-5 rounded-full border-2 grid place-items-center shrink-0 ${selected ? 'border-brand-500' : 'border-ink-200'}`}>
            {selected && <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pop" />}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-ink-700 bg-sand-100 rounded-full px-2 py-0.5">
              <LabelIcon label={a.label} size={12} /> {a.label || 'Other'}
            </span>
            {a.isDefault && <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-brand-700 bg-brand-100 rounded-full px-2 py-0.5"><Star size={11} className="fill-current" /> Default</span>}
          </div>
          <p className="mt-1.5 font-bold text-ink-900">{a.name}</p>
          <p className="text-sm text-ink-700 leading-snug break-words">{addressLine(a)}</p>
          {a.phone && <p className="mt-1 text-xs text-ink-500 inline-flex items-center gap-1"><Phone size={12} /> +91 {a.phone}</p>}
        </div>
      </div>
      {actions && <div className="mt-3 pt-3 border-t border-ink-100 flex flex-wrap items-center gap-1">{actions}</div>}
    </Tag>
  )
}

/* ------------------------------ Profile: address book ------------------------------ */
export default function AddressBook() {
  const user = useAuth((s) => s.user)
  const updateUser = useAuth((s) => s.updateUser)
  const list = user?.addresses || []
  const [mode, setMode] = useState(null) // null | 'new' | address id being edited
  const [busy, setBusy] = useState('')
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 2500) }
  const act = async (key, fn, done) => {
    setBusy(key); setErr('')
    try { const res = await fn(); updateUser(res.user); playSound('success'); haptic(15); flash(done) } catch (x) { setErr(x.message); errorFeedback() } finally { setBusy(''); setConfirm('') }
  }

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <h2 className="font-extrabold text-lg flex items-center gap-2"><MapPin size={18} className="text-brand-600" /> Saved addresses</h2>
        {mode !== 'new' && list.length < MAX_ADDRESSES && (
          <button type="button" onClick={() => setMode('new')} className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 hover:underline"><Plus size={16} /> Add new address</button>
        )}
      </div>
      <p className="text-xs text-ink-500 mb-4">Pick any of these at checkout. Your default address is selected for you.</p>
      {msg && <p role="status" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-green-700 animate-fade-in"><Check size={16} />{msg}</p>}
      {err && <p role="alert" className="mb-3 text-sm font-semibold text-red-600 bg-red-50 rounded-lg px-3 py-2">{err}</p>}

      {mode === 'new' && (
        <div className="rounded-2xl border-[1.5px] border-dashed border-brand-300 bg-brand-50/40 p-4 mb-4 animate-fade-in">
          <p className="font-bold mb-3 flex items-center justify-between">New address <button type="button" aria-label="Close" onClick={() => setMode(null)} className="text-ink-500 hover:text-ink-900"><X size={18} /></button></p>
          <AddressForm onSaved={() => { setMode(null); flash('Address saved') }} onCancel={() => setMode(null)} />
        </div>
      )}

      {list.length === 0 && mode !== 'new' ? (
        <button type="button" onClick={() => setMode('new')} className="w-full rounded-2xl border-[1.5px] border-dashed border-ink-200 hover:border-brand-300 p-6 text-center text-sm text-ink-500">
          <MapPin className="mx-auto mb-2 text-brand-500" /> No saved addresses yet. <b className="text-brand-700">Add one</b> to check out faster.
        </button>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {list.map((a) => mode === a.id ? (
            <div key={a.id} className="sm:col-span-2 rounded-2xl border-[1.5px] border-brand-300 bg-brand-50/40 p-4 animate-fade-in">
              <p className="font-bold mb-3">Edit address</p>
              <AddressForm initial={a} onSaved={() => { setMode(null); flash('Address updated') }} onCancel={() => setMode(null)} />
            </div>
          ) : (
            <AddressCard key={a.id} a={a} actions={confirm === a.id ? (
              <>
                <span className="text-sm font-semibold text-ink-700 mr-auto">Delete this address?</span>
                <button type="button" disabled={!!busy} onClick={() => act(a.id, () => api.del(`/auth/me/addresses/${a.id}`), 'Address deleted')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600">{busy === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Delete</button>
                <button type="button" onClick={() => setConfirm('')} className="px-3 py-1.5 rounded-lg text-sm font-bold text-ink-500 hover:bg-ink-50">Keep</button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setMode(a.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-bold text-ink-700 hover:bg-ink-50"><Pencil size={14} /> Edit</button>
                <button type="button" onClick={() => setConfirm(a.id)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50"><Trash2 size={14} /> Delete</button>
                {!a.isDefault && (
                  <button type="button" disabled={!!busy} onClick={() => act(`d${a.id}`, () => api.post(`/auth/me/addresses/${a.id}/default`), 'Default address changed')}
                    className="ml-auto inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-bold text-brand-700 hover:bg-brand-50">{busy === `d${a.id}` ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} />} Set as default</button>
                )}
              </>
            )} />
          ))}
        </div>
      )}
      {list.length >= MAX_ADDRESSES && <p className="mt-3 text-xs text-ink-500">You’ve saved the maximum of {MAX_ADDRESSES} addresses. Delete one to add another.</p>}
    </section>
  )
}
