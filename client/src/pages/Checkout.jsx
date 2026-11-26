import { useState, useMemo, useRef } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { Smartphone, Banknote, Copy, Check, MapPin, CreditCard, Lock, ChevronDown, LocateFixed, Loader2, Mail, ShoppingCart, PartyPopper } from 'lucide-react'
import { locateAddress } from '@/lib/geolocate'
import { Field, useFieldErrors, errorFeedback, isEmail } from '@/components/FormField'
import { useCart, detailCart } from '@/store/cart'
import { useOrders } from '@/store/orders'
import { playSound, haptic } from '@/lib/feedback'
import { usePincode } from '@/lib/usePincode'
import { api } from '@/lib/api'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/store/auth'
import { inr, SHIPPING_FEE, FREE_SHIP_ABOVE, COD_FEE, orderNo, upiLink, UPI } from '@/lib/format'

export default function Checkout() {
  const rawItems = useCart((s) => s.items)
  const items = useMemo(() => detailCart(rawItems), [rawItems])
  const subtotal = useMemo(() => items.reduce((n, it) => n + it.lineTotal, 0), [items])
  const clear = useCart((s) => s.clear)
  const place = useOrders((s) => s.place)
  const user = useAuth((s) => s.user)
  const nav = useNavigate()

  const [addr, setAddr] = useState({
    name: user?.name || '', phone: '', line1: '', city: '', state: '', pincode: '',
  })
  const fe = useFieldErrors()
  const [email, setEmail] = useState(() => { try { return localStorage.getItem('animalveda-guest-email') || '' } catch { return '' } })
  const [geo, setGeo] = useState({ status: 'idle', msg: '' }) // idle | busy | done | error
  const addressRef = useRef(null)
  const [method, setMethod] = useState('UPI_MANUAL')
  const [utr, setUtr] = useState('')
  const [copied, setCopied] = useState(false)
  const [err, setErr] = useState('')
  const [no] = useState(() => orderNo())
  const [placing, setPlacing] = useState(false)
  const qc = useQueryClient()
  const placed = useRef(false) // set once the order is placed, so emptying the cart doesn't bounce to /cart
  const pin = usePincode(addr.pincode, (d) => setAddr((a) => ({ ...a, city: d.city, state: d.state }))) // stable across re-renders so QR note == order no

  if (items.length === 0) return placed.current ? null : <Navigate to="/cart" replace />

  const shipping = subtotal >= FREE_SHIP_ABOVE ? 0 : SHIPPING_FEE
  const mrpTotal = items.reduce((n, it) => n + Math.max(it.variant.mrp || 0, it.variant.price) * it.qty, 0)
  const saving = mrpTotal - subtotal + (shipping === 0 ? SHIPPING_FEE : 0) // MRP discount + free delivery
  const codFee = method === 'COD' ? COD_FEE : 0
  const total = subtotal + shipping + codFee

  const link = upiLink({ amount: total, note: no })

  const fillFromLocation = async () => {
    setGeo({ status: 'busy', msg: '' })
    try {
      const g = await locateAddress()
      setAddr((a) => ({ ...a, line1: g.line1 || a.line1, city: g.city || a.city, state: g.state || a.state, pincode: g.pincode || a.pincode }))
      setGeo({ status: 'done', msg: `Filled from your location${g.accuracy ? ` (±${g.accuracy > 999 ? (g.accuracy / 1000).toFixed(1) + ' km' : g.accuracy + ' m'})` : ''}. Add your house / flat number so the delivery reaches your door.` })
      requestAnimationFrame(() => { const el = addressRef.current; if (el) { el.focus({ preventScroll: true }); el.setSelectionRange?.(0, 0); el.scrollIntoView({ behavior: 'smooth', block: 'center' }) } })
    } catch (e2) {
      setGeo({ status: 'error', msg: e2.message || 'Couldn’t get your location. Please type your address.' })
    }
  }

  const copyUpi = () => { navigator.clipboard?.writeText(UPI.id); setCopied(true); setTimeout(() => setCopied(false), 1500) }

  const fail = (msg) => {
    setErr(msg)
    errorFeedback()
    requestAnimationFrame(() => [...document.querySelectorAll('[role=alert]')].find((el) => el.offsetParent)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    const ok = fe.validate({
      email: user ? null : !email.trim() ? 'Enter your email — we send order updates there.' : !isEmail(email) ? 'This email doesn’t look right (e.g. name@gmail.com).' : null,
      name: addr.name.trim().length < 2 ? 'Enter the name of the person receiving the order.' : null,
      phone: !addr.phone ? 'Enter a phone number for the delivery partner.' : !/^[6-9]\d{9}$/.test(addr.phone) ? 'Enter a valid 10-digit mobile number.' : null,
      line1: addr.line1.trim().length < 5 ? 'Enter your house / flat no., street and area.' : null,
      pincode: !addr.pincode ? 'Enter your 6-digit pincode.' : !/^\d{6}$/.test(addr.pincode) || pin.status === 'notfound' ? 'This pincode doesn’t look right — please check it.' : null,
      city: !addr.city.trim() ? 'Enter your city.' : null,
      state: !addr.state.trim() ? 'Enter your state.' : null,
      utr: method === 'UPI_MANUAL' && !/^\d{12}$/.test(utr) ? (utr ? 'UTR should be exactly 12 digits.' : 'After paying, enter the 12-digit UPI reference (UTR).') : null,
    })
    if (!ok) return

    // Send the order to the server (prices are re-checked there). If the
    // server can't be reached we still keep the order locally so nothing is lost.
    setPlacing(true)
    let orderNoFinal = no
    try {
      const res = await api.post('/store/orders', {
        items: items.map((it) => ({ slug: it.product.slug, sku: it.sku, qty: it.qty })),
        address: addr, paymentMethod: method, ...(method === 'UPI_MANUAL' ? { utr } : {}),
        ...(user ? {} : { email: email.trim().toLowerCase() }),
      })
      if (!user) { try { localStorage.setItem('animalveda-guest-email', email.trim().toLowerCase()) } catch { /* ignore */ } }
      orderNoFinal = res?.order?.orderNo || no
      qc.invalidateQueries({ queryKey: ['my-orders'] })
    } catch (e2) {
      const down = e2 instanceof TypeError || /Route not found|Request failed \(5/.test(e2.message)
      if (!down) { setPlacing(false); return fail(e2.message === 'Validation failed' ? 'Please check your details and try again.' : e2.message) }
    }
    setPlacing(false)

    const order = {
      orderNo: orderNoFinal,
      email: user?.email || email.trim().toLowerCase() || 'guest@animalveda.com',
      customer: addr.name,
      createdAt: Date.now(),
      items: items.map((it) => ({ name: it.product.name, sku: it.sku, size: it.variant.size, price: it.variant.price, qty: it.qty })),
      subtotal, shippingFee: shipping, codFee, total,
      payment: method === 'UPI_MANUAL'
        ? { method: 'UPI_MANUAL', status: 'pending_verification', utr }
        : { method: 'COD', status: 'cod_pending' },
      address: addr,
      status: 'Pending Verification',
      statusHistory: [{ status: 'Pending Verification', at: Date.now() }],
    }
    place(order)
    // Happy "ta-da!" jingle 🎉 (the success page shows a dog — or a cat for cat orders)
    const forCat = items.some((it) => /\bcat\b|kitten|feline/i.test(`${it.product.name} ${it.product.short}`))
    playSound('celebrate')
    haptic([30, 50, 30, 50, 70])
    placed.current = true
    clear()
    nav(`/order/${orderNoFinal}`, { state: { animal: forCat ? 'cat' : 'dog' } })
  }

  const set = (k) => (v) => { setAddr((a) => ({ ...a, [k]: v })); fe.clear(k) }
  const E = fe.errors

  return (
    <div className="container-x py-5 sm:py-8">
      {/* Steps */}
      <CheckoutSteps />
      <h1 className="text-2xl sm:text-3xl font-extrabold mb-4 sm:mb-6">Checkout</h1>

      <form id="checkout-form" onSubmit={submit} noValidate className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-4 sm:gap-8 items-start">
        <div className="space-y-4 sm:space-y-6 min-w-0">
          {/* Mobile order summary (collapsible) */}
          <details className="lg:hidden card overflow-hidden group">
            <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer list-none">
              <span className="font-bold text-sm">Order summary <span className="text-ink-500 font-semibold">({items.length} items)</span></span>
              <span className="flex items-center gap-1 font-extrabold">{inr(total)} <ChevronDown size={16} className="group-open:rotate-180 transition" /></span>
            </summary>
            <div className="px-4 pb-4"><Summary items={items} subtotal={subtotal} shipping={shipping} codFee={codFee} total={total} mrpTotal={mrpTotal} saving={saving} /></div>
          </details>

          {/* Address */}
          <section className="card p-4 sm:p-6">
            <h2 className="font-extrabold text-base sm:text-lg mb-4 flex items-center gap-2"><Step n="1" icon={MapPin} /> Delivery address
              <span className="ml-auto font-sans text-[11px] font-semibold text-ink-500"><span className="text-red-500">*</span> required</span></h2>
            <button type="button" onClick={fillFromLocation} disabled={geo.status === 'busy'}
              className="w-full mb-4 flex items-center gap-3 rounded-2xl border-[1.5px] border-dashed border-brand-300 bg-brand-50/60 hover:bg-brand-50 px-4 py-3 text-left transition active:scale-[.99] disabled:opacity-80">
              <span className="w-10 h-10 rounded-xl bg-brand-500 text-white grid place-items-center shrink-0">
                {geo.status === 'busy' ? <Loader2 size={19} className="animate-spin" /> : <LocateFixed size={19} />}
              </span>
              <span className="min-w-0">
                <span className="block font-bold text-ink-900">{geo.status === 'busy' ? 'Finding your location…' : geo.status === 'done' ? 'Update from my current location' : 'Use my current location'}</span>
                <span className="block text-xs text-ink-500">Fills in your area, city, state and pincode automatically</span>
              </span>
            </button>
            {geo.msg && <p className={`-mt-2 mb-4 text-xs font-semibold rounded-lg px-3 py-2 ${geo.status === 'error' ? 'text-red-600 bg-red-50' : 'text-green-700 bg-green-50'}`} role={geo.status === 'error' ? 'alert' : 'status'}>{geo.msg}</p>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {user ? (
                <p className="sm:col-span-2 flex items-center gap-2 text-xs text-ink-500 bg-sand-50 rounded-lg px-3 py-2 min-w-0"><Mail size={14} className="shrink-0 text-brand-600" /><span className="truncate">Order updates go to <b className="text-ink-700">{user.email}</b></span></p>
              ) : (
                <div className="sm:col-span-2"><Field name="email" required error={E.email} label="Email" hint="for order updates" value={email} type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" onChange={(v) => { setEmail(v); fe.clear('email') }} /></div>
              )}
              <Field name="name" required error={E.name} label="Full name" value={addr.name} onChange={set('name')} autoComplete="name" />
              <Field name="phone" required error={E.phone} label="Phone" hint="10 digit" value={addr.phone} type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10}
                prefix="+91" onChange={(v) => set('phone')(v.replace(/\D/g, '').slice(0, 10))} />
              <div className="sm:col-span-2"><Field name="line1" required error={E.line1} label="Address" hint="House no, street, area" value={addr.line1} onChange={set('line1')} autoComplete="street-address" inputRef={addressRef} /></div>
              <div>
                <Field name="pincode" required error={E.pincode} label="Pincode" value={addr.pincode} inputMode="numeric" autoComplete="postal-code" maxLength={6}
                  onChange={(v) => set('pincode')(v.replace(/\D/g, '').slice(0, 6))} />
                {!E.pincode && !(pin.status === 'error' && addr.city && addr.state) && <PinStatus pin={pin} />}
              </div>
              <Field name="city" required error={E.city} label="City" hint={pin.status === 'found' ? 'auto-filled' : undefined} value={addr.city} onChange={set('city')} autoComplete="address-level2" />
              <div className="sm:col-span-2"><Field name="state" required error={E.state} label="State" hint={pin.status === 'found' ? 'auto-filled' : undefined} value={addr.state} onChange={set('state')} autoComplete="address-level1" /></div>
            </div>
          </section>

          {/* Payment */}
          <section className="card p-4 sm:p-6">
            <h2 className="font-extrabold text-base sm:text-lg mb-4 flex items-center gap-2"><Step n="2" icon={CreditCard} /> Payment</h2>
            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2.5 sm:gap-3">
              <Method active={method === 'UPI_MANUAL'} onClick={() => setMethod('UPI_MANUAL')} icon={Smartphone} title="UPI / QR" sub="Scan & pay, we verify manually" />
              <Method active={method === 'COD'} onClick={() => setMethod('COD')} icon={Banknote} title="Cash on Delivery" sub={`+ ${inr(COD_FEE)} COD fee`} />
            </div>

            {method === 'UPI_MANUAL' && (
              <div className="animate-fade-in mt-5 grid grid-cols-1 sm:grid-cols-[auto_minmax(0,1fr)] gap-5 items-start">
                <div className="bg-white p-3 rounded-xl border border-ink-100 w-fit mx-auto">
                  <QRCodeCanvas value={link} size={150} includeMargin={false} />
                </div>
                <div className="text-sm space-y-3 min-w-0">
                  <p className="text-ink-700">Scan the QR with any UPI app and pay <b>{inr(total)}</b>, or pay to:</p>
                  <div className="flex items-center gap-2 min-w-0">
                    <code className="flex-1 min-w-0 bg-ink-50 px-3 py-2 rounded-lg font-bold break-all text-[13px]">{UPI.id}</code>
                    <button type="button" onClick={copyUpi} aria-label="Copy UPI ID" className="btn-ghost !px-3 !py-2 shrink-0">{copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}</button>
                  </div>
                  <a href={link} className="btn-primary w-full sm:hidden">Pay {inr(total)} with UPI app</a>
                  <Field name="utr" required error={E.utr} label="UPI reference / UTR" hint="12 digits" value={utr} inputMode="numeric" maxLength={12} placeholder="e.g. 402311889076"
                    onChange={(v) => { setUtr(v.replace(/\D/g, '').slice(0, 12)); fe.clear('utr') }} />
                  <p className="text-xs text-ink-500 -mt-1">Enter the reference number shown in your UPI app after paying. Admin confirms the order once received.</p>
                </div>
              </div>
            )}

            {method === 'COD' && (
              <p className="animate-fade-in mt-4 text-sm text-ink-700 bg-brand-50 rounded-lg p-3">
                Pay {inr(total)} in cash when your order is delivered. A small COD fee of {inr(COD_FEE)} applies.
              </p>
            )}
          </section>

          {err && <p role="alert" className="lg:hidden text-sm font-semibold text-red-600 bg-red-50 rounded-xl p-3">{err}</p>}
        </div>

        {/* Desktop summary */}
        <aside className="hidden lg:block card p-5 lg:sticky lg:top-32 min-w-0">
          <h2 className="font-extrabold text-lg mb-4">Your order</h2>
          <Summary items={items} subtotal={subtotal} shipping={shipping} codFee={codFee} total={total} mrpTotal={mrpTotal} saving={saving} />
          {err && <p role="alert" className="text-sm text-red-600 mt-3">{err}</p>}
          <button type="submit" disabled={placing} className="btn-primary w-full mt-4 disabled:opacity-70">
            <Lock size={16} /> {method === 'COD' ? 'Place COD order' : 'I have paid — place order'}
          </button>
          <p className="text-xs text-ink-500 text-center mt-3">Demo checkout · no real payment is taken</p>
        </aside>
      </form>

      {/* Mobile sticky place-order bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-ink-100 shadow-[0_-8px_24px_-12px_rgba(26,26,23,.25)] px-4 pt-3"
        style={{ paddingBottom: 'calc(.75rem + env(safe-area-inset-bottom))' }}>
        {saving > 0 && (
          <p className="max-w-xl mx-auto -mt-0.5 mb-2 flex items-center justify-center gap-1.5 rounded-full bg-green-50 text-green-700 text-[11.5px] font-bold py-1 ring-1 ring-green-100">
            🎉 You’re saving {inr(saving)} on this order
          </p>
        )}
        <div className="flex items-center gap-3 max-w-xl mx-auto">
          <div className="shrink-0">
            <p className="text-[10px] uppercase tracking-wider text-ink-500 font-bold leading-none">To pay</p>
            <p key={total} className="animate-pop font-extrabold text-xl leading-tight text-ink-900">{inr(total)}</p>
            {mrpTotal > subtotal && <p className="text-[11px] text-ink-500 line-through leading-none">{inr(mrpTotal + (shipping === 0 ? SHIPPING_FEE : shipping) + codFee)}</p>}
          </div>
          <button type="submit" form="checkout-form" disabled={placing} className="btn-primary flex-1 min-w-0 !px-3 text-sm disabled:opacity-70">
            <Lock size={15} className="shrink-0" /><span className="truncate">{method === 'COD' ? 'Place COD order' : 'I have paid — place order'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function PinStatus({ pin }) {
  if (pin.status === 'idle') return <p className="text-[11px] text-ink-500 mt-1">City & state fill in automatically</p>
  if (pin.status === 'loading') return <p className="text-[11px] text-ink-500 mt-1">Finding your area…</p>
  if (pin.status === 'found') return <p className="text-[11px] font-semibold text-pine-600 mt-1 animate-fade-in">📍 {pin.data.city}, {pin.data.state}</p>
  if (pin.status === 'notfound') return <p className="text-[11px] font-semibold text-red-600 mt-1">We couldn’t find this pincode — please check it</p>
  return <p className="text-[11px] text-ink-500 mt-1">Couldn’t look it up — please type city & state</p>
}

function Summary({ items, subtotal, shipping, codFee, total, mrpTotal, saving }) {
  return (
    <>
      <div className="space-y-3 max-h-56 overflow-y-auto no-scrollbar mb-3">
        {items.map((it) => (
          <div key={it.id + it.sku} className="flex gap-3 text-sm min-w-0">
            <img src={it.product.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover bg-sand-100 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold line-clamp-2 leading-snug">{it.product.name}</p>
              <p className="text-ink-500 text-xs">{it.variant.size} × {it.qty}</p>
            </div>
            <span className="text-right shrink-0">
              <span className="block font-bold">{inr(it.lineTotal)}</span>
              {it.variant.mrp > it.variant.price && <span className="block text-[11px] text-ink-500 line-through">{inr(it.variant.mrp * it.qty)}</span>}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-ink-100 pt-3 space-y-1.5 text-sm">
        {mrpTotal > subtotal && <Row label="MRP total" value={inr(mrpTotal)} />}
        {mrpTotal > subtotal && <Row label="Discount" value={<span className="text-green-700 font-semibold">− {inr(mrpTotal - subtotal)}</span>} />}
        <Row label="Subtotal" value={inr(subtotal)} />
        <Row label="Delivery" value={shipping === 0 ? <span className="text-green-700 font-semibold"><span className="line-through text-ink-500 font-normal mr-1">{inr(SHIPPING_FEE)}</span>FREE</span> : inr(shipping)} />
        {codFee > 0 && <Row label="COD fee" value={inr(codFee)} />}
      </div>
      <div className="mt-3 rounded-2xl bg-pine-900 text-white p-4">
        <div className="flex items-end justify-between gap-3">
          <span>
            <span className="block text-[11px] uppercase tracking-wider text-white/60 font-bold">Total to pay</span>
            <span className="block text-[11px] text-white/60">incl. all taxes</span>
          </span>
          <span key={total} className="animate-pop text-2xl font-extrabold font-display">{inr(total)}</span>
        </div>
        {saving > 0 && (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-green-500/15 text-green-300 text-sm font-bold px-3 py-2 ring-1 ring-green-400/30">
            <span className="text-base">🎉</span> You’re saving {inr(saving)} on this order
          </p>
        )}
      </div>
    </>
  )
}

function CheckoutSteps() {
  const steps = [['Cart', ShoppingCart, 'done'], ['Details & pay', CreditCard, 'active'], ['Done', PartyPopper, 'todo']]
  return (
    <nav aria-label="Checkout progress" className="mb-4 sm:mb-6">
      <ol className="relative flex items-start justify-between max-w-md mx-auto sm:mx-0 px-2">
        {/* track */}
        <span aria-hidden="true" className="absolute left-[16%] right-[16%] top-[18px] h-1 rounded-full bg-ink-100" />
        <span aria-hidden="true" className="absolute left-[16%] w-[34%] top-[18px] h-1 rounded-full bg-gradient-to-r from-pine-600 to-brand-500" />
        {steps.map(([label, Icon, state], i) => (
          <li key={label} aria-current={state === 'active' ? 'step' : undefined} className="relative z-10 flex flex-col items-center gap-1.5 w-1/3">
            {state === 'done' ? (
              <Link to="/cart" className="w-10 h-10 rounded-full bg-pine-600 text-white grid place-items-center shadow-md shadow-pine-600/30 ring-4 ring-sand-50" aria-label="Back to cart"><Check size={18} strokeWidth={3} /></Link>
            ) : (
              <span className={`relative w-10 h-10 rounded-full grid place-items-center ring-4 ring-sand-50 ${state === 'active' ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/40' : 'bg-white text-ink-500 border-2 border-ink-200'}`}>
                {state === 'active' && <span className="absolute inset-0 rounded-full bg-brand-400 animate-ping opacity-30" />}
                <Icon size={17} className="relative" />
              </span>
            )}
            <span className={`text-[11px] sm:text-xs font-bold whitespace-nowrap ${state === 'active' ? 'text-brand-600' : state === 'done' ? 'text-pine-600' : 'text-ink-500'}`}>
              <span className="sr-only">Step {i + 1}: </span>{label}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  )
}

function Step({ n, icon: Icon }) {
  return <span className="w-7 h-7 rounded-full bg-brand-500 text-white grid place-items-center text-xs" aria-label={`Step ${n}`}><Icon size={14} /></span>
}

function Method({ active, onClick, icon: Icon, title, sub }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={active}
      className={`text-left p-3.5 sm:p-4 rounded-xl border-[1.5px] flex items-start gap-3 min-w-0 transition active:scale-[.98] ${active ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-brand-300'}`}>
      <span className={`mt-0.5 w-5 h-5 rounded-full border-2 grid place-items-center shrink-0 ${active ? 'border-brand-500' : 'border-ink-200'}`}>
        {active && <span className="w-2.5 h-2.5 rounded-full bg-brand-500 animate-pop" />}
      </span>
      <div className="min-w-0 flex-1"><p className="font-bold text-sm flex items-center gap-1.5"><Icon size={16} className={active ? 'text-brand-600' : 'text-ink-500'} />{title}</p><p className="text-xs text-ink-500">{sub}</p></div>
    </button>
  )
}
function Row({ label, value }) {
  return <div className="flex justify-between text-ink-700"><span>{label}</span><span>{value}</span></div>
}
