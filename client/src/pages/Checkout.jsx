import { useState, useMemo } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { Smartphone, Banknote, Copy, Check, MapPin, CreditCard, Lock, ChevronDown } from 'lucide-react'
import { useCart, detailCart } from '@/store/cart'
import { useOrders } from '@/store/orders'
import { playSound, haptic } from '@/lib/feedback'
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
  const [method, setMethod] = useState('UPI_MANUAL')
  const [utr, setUtr] = useState('')
  const [copied, setCopied] = useState(false)
  const [err, setErr] = useState('')
  const [no] = useState(() => orderNo()) // stable across re-renders so QR note == order no

  if (items.length === 0) return <Navigate to="/cart" replace />

  const shipping = subtotal >= FREE_SHIP_ABOVE ? 0 : SHIPPING_FEE
  const codFee = method === 'COD' ? COD_FEE : 0
  const total = subtotal + shipping + codFee

  const link = upiLink({ amount: total, note: no })

  const copyUpi = () => { navigator.clipboard?.writeText(UPI.id); setCopied(true); setTimeout(() => setCopied(false), 1500) }

  const fail = (msg) => {
    setErr(msg)
    requestAnimationFrame(() => [...document.querySelectorAll('[role=alert]')].find((el) => el.offsetParent)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }

  const submit = (e) => {
    e.preventDefault()
    setErr('')
    if (!addr.name || !addr.phone || !addr.line1 || !addr.city || !addr.pincode) return fail('Please fill in all delivery details.')
    if (!/^\d{10}$/.test(addr.phone)) return fail('Enter a valid 10-digit phone number.')
    if (!/^\d{6}$/.test(addr.pincode)) return fail('Enter a valid 6-digit pincode.')
    if (method === 'UPI_MANUAL' && !/^\d{12}$/.test(utr)) return fail('Enter the 12-digit UPI reference / UTR number after paying.')

    const order = {
      orderNo: no,
      email: user?.email || 'guest@animalveda.in',
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
    playSound('success')
    haptic([30, 50, 30, 50, 70])
    clear()
    nav(`/order/${no}`)
  }

  const set = (k) => (v) => setAddr({ ...addr, [k]: v })

  return (
    <div className="container-x py-5 sm:py-8">
      {/* Steps */}
      <ol className="flex items-center gap-2 text-[11px] sm:text-xs font-bold text-ink-500 mb-4 sm:mb-6">
        <li className="text-pine-600">✓ Cart</li><li aria-hidden="true" className="flex-1 max-w-10 h-px bg-ink-200" />
        <li className="text-brand-600">2 Details & pay</li><li aria-hidden="true" className="flex-1 max-w-10 h-px bg-ink-200" />
        <li>3 Done</li>
      </ol>
      <h1 className="text-2xl sm:text-3xl font-extrabold mb-4 sm:mb-6">Checkout</h1>

      <form id="checkout-form" onSubmit={submit} noValidate className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-4 sm:gap-8 items-start">
        <div className="space-y-4 sm:space-y-6 min-w-0">
          {/* Mobile order summary (collapsible) */}
          <details className="lg:hidden card overflow-hidden group">
            <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer list-none">
              <span className="font-bold text-sm">Order summary <span className="text-ink-500 font-semibold">({items.length} items)</span></span>
              <span className="flex items-center gap-1 font-extrabold">{inr(total)} <ChevronDown size={16} className="group-open:rotate-180 transition" /></span>
            </summary>
            <div className="px-4 pb-4"><Summary items={items} subtotal={subtotal} shipping={shipping} codFee={codFee} total={total} /></div>
          </details>

          {/* Address */}
          <section className="card p-4 sm:p-6">
            <h2 className="font-extrabold text-base sm:text-lg mb-4 flex items-center gap-2"><Step n="1" icon={MapPin} /> Delivery address</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Full name" value={addr.name} onChange={set('name')} autoComplete="name" />
              <Field label="Phone" hint="10 digit" value={addr.phone} type="tel" inputMode="numeric" autoComplete="tel-national" maxLength={10}
                prefix="+91" onChange={(v) => set('phone')(v.replace(/\D/g, '').slice(0, 10))} />
              <div className="sm:col-span-2"><Field label="Address" hint="House no, street, area" value={addr.line1} onChange={set('line1')} autoComplete="street-address" /></div>
              <Field label="Pincode" value={addr.pincode} inputMode="numeric" autoComplete="postal-code" maxLength={6}
                onChange={(v) => set('pincode')(v.replace(/\D/g, '').slice(0, 6))} />
              <Field label="City" value={addr.city} onChange={set('city')} autoComplete="address-level2" />
              <div className="sm:col-span-2"><Field label="State" value={addr.state} onChange={set('state')} autoComplete="address-level1" /></div>
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
                  <Field label="UPI reference / UTR" hint="12 digits" value={utr} inputMode="numeric" maxLength={12} placeholder="e.g. 402311889076"
                    onChange={(v) => setUtr(v.replace(/\D/g, '').slice(0, 12))} />
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
          <Summary items={items} subtotal={subtotal} shipping={shipping} codFee={codFee} total={total} />
          {err && <p role="alert" className="text-sm text-red-600 mt-3">{err}</p>}
          <button type="submit" className="btn-primary w-full mt-4">
            <Lock size={16} /> {method === 'COD' ? 'Place COD order' : 'I have paid — place order'}
          </button>
          <p className="text-xs text-ink-500 text-center mt-3">Demo checkout · no real payment is taken</p>
        </aside>
      </form>

      {/* Mobile sticky place-order bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-ink-100 shadow-[0_-8px_24px_-12px_rgba(26,26,23,.25)] px-4 pt-3"
        style={{ paddingBottom: 'calc(.75rem + env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-3 max-w-xl mx-auto">
          <div className="shrink-0">
            <p className="text-[11px] text-ink-500 font-semibold leading-none">Total</p>
            <p key={total} className="animate-pop font-extrabold text-lg leading-tight">{inr(total)}</p>
          </div>
          <button type="submit" form="checkout-form" className="btn-primary flex-1 min-w-0 !px-3 text-sm">
            <Lock size={15} className="shrink-0" /><span className="truncate">{method === 'COD' ? 'Place COD order' : 'I have paid — place order'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function Summary({ items, subtotal, shipping, codFee, total }) {
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
            <span className="font-bold shrink-0">{inr(it.lineTotal)}</span>
          </div>
        ))}
      </div>
      <div className="border-t border-ink-100 pt-3 space-y-1 text-sm">
        <Row label="Subtotal" value={inr(subtotal)} />
        <Row label="Shipping" value={shipping === 0 ? 'FREE' : inr(shipping)} />
        {codFee > 0 && <Row label="COD fee" value={inr(codFee)} />}
      </div>
      <div className="border-t border-ink-100 mt-3 pt-3 flex justify-between text-lg font-extrabold">
        <span>Total</span><span>{inr(total)}</span>
      </div>
    </>
  )
}

function Step({ n, icon: Icon }) {
  return <span className="w-7 h-7 rounded-full bg-brand-500 text-white grid place-items-center text-xs" aria-label={`Step ${n}`}><Icon size={14} /></span>
}

function Field({ label, hint, value, onChange, prefix, ...rest }) {
  return (
    <label className="block min-w-0">
      <span className="font-bold text-sm">{label}{hint && <span className="font-medium text-ink-500"> · {hint}</span>}</span>
      <span className="mt-1 flex items-center w-full bg-white border border-ink-200 rounded-xl focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100 transition">
        {prefix && <span className="pl-3 pr-1 text-ink-500 font-semibold text-sm shrink-0">{prefix}</span>}
        <input value={value} onChange={(e) => onChange(e.target.value)} {...rest}
          className="w-full min-w-0 bg-transparent px-3 py-2.5 outline-none rounded-xl" />
      </span>
    </label>
  )
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
