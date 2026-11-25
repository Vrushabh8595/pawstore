import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { QRCodeCanvas } from 'qrcode.react'
import { Smartphone, Banknote, Copy, Check } from 'lucide-react'
import { useCart } from '@/store/cart'
import { useOrders } from '@/store/orders'
import { useAuth } from '@/store/auth'
import { inr, SHIPPING_FEE, FREE_SHIP_ABOVE, COD_FEE, orderNo, upiLink, UPI } from '@/lib/format'

export default function Checkout() {
  const items = useCart((s) => s.detailed())
  const subtotal = useCart((s) => s.subtotal())
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

  if (items.length === 0) return <Navigate to="/cart" replace />

  const shipping = subtotal >= FREE_SHIP_ABOVE ? 0 : SHIPPING_FEE
  const codFee = method === 'COD' ? COD_FEE : 0
  const total = subtotal + shipping + codFee

  const no = orderNo()
  const link = upiLink({ amount: total, note: no })

  const copyUpi = () => { navigator.clipboard?.writeText(UPI.id); setCopied(true); setTimeout(() => setCopied(false), 1500) }

  const submit = (e) => {
    e.preventDefault()
    setErr('')
    if (!addr.name || !addr.phone || !addr.line1 || !addr.city || !addr.pincode) return setErr('Please fill in all delivery details.')
    if (!/^\d{10}$/.test(addr.phone)) return setErr('Enter a valid 10-digit phone number.')
    if (!/^\d{6}$/.test(addr.pincode)) return setErr('Enter a valid 6-digit pincode.')
    if (method === 'UPI_MANUAL' && !/^\d{12}$/.test(utr)) return setErr('Enter the 12-digit UPI reference / UTR number after paying.')

    const order = {
      orderNo: no,
      email: user?.email || 'guest@pawstore.in',
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
    clear()
    nav(`/order/${no}`)
  }

  return (
    <div className="container-x py-8">
      <h1 className="text-3xl font-extrabold mb-6">Checkout</h1>
      <form onSubmit={submit} className="grid lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-6">
          {/* Address */}
          <section className="card p-5">
            <h2 className="font-extrabold text-lg mb-4">Delivery address</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Full name" value={addr.name} onChange={(v) => setAddr({ ...addr, name: v })} />
              <Field label="Phone (10 digit)" value={addr.phone} onChange={(v) => setAddr({ ...addr, phone: v })} />
              <div className="sm:col-span-2"><Field label="Address" value={addr.line1} onChange={(v) => setAddr({ ...addr, line1: v })} /></div>
              <Field label="City" value={addr.city} onChange={(v) => setAddr({ ...addr, city: v })} />
              <Field label="State" value={addr.state} onChange={(v) => setAddr({ ...addr, state: v })} />
              <Field label="Pincode" value={addr.pincode} onChange={(v) => setAddr({ ...addr, pincode: v })} />
            </div>
          </section>

          {/* Payment */}
          <section className="card p-5">
            <h2 className="font-extrabold text-lg mb-4">Payment</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Method active={method === 'UPI_MANUAL'} onClick={() => setMethod('UPI_MANUAL')} icon={Smartphone} title="UPI / QR" sub="Scan & pay, we verify manually" />
              <Method active={method === 'COD'} onClick={() => setMethod('COD')} icon={Banknote} title="Cash on Delivery" sub={`+ ${inr(COD_FEE)} COD fee`} />
            </div>

            {method === 'UPI_MANUAL' && (
              <div className="mt-5 grid sm:grid-cols-[auto_1fr] gap-5 items-start">
                <div className="bg-white p-3 rounded-xl border border-[#ecece7] w-fit mx-auto">
                  <QRCodeCanvas value={link} size={160} includeMargin={false} />
                </div>
                <div className="text-sm space-y-3">
                  <p className="text-ink-700">Scan the QR with any UPI app and pay <b>{inr(total)}</b>, or pay to:</p>
                  <div className="flex items-center gap-2">
                    <code className="bg-ink-50 px-3 py-2 rounded-lg font-bold">{UPI.id}</code>
                    <button type="button" onClick={copyUpi} className="btn-ghost !px-3 !py-2">{copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}</button>
                  </div>
                  <a href={link} className="btn-ghost w-full sm:hidden">Pay with UPI app</a>
                  <div>
                    <label className="font-bold text-sm">UPI reference / UTR (12 digits)</label>
                    <input value={utr} onChange={(e) => setUtr(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      placeholder="e.g. 402311889076" inputMode="numeric"
                      className="w-full mt-1 border border-[#e5e5e0] rounded-lg px-3 py-2.5 outline-none focus:border-brand-400" />
                    <p className="text-xs text-ink-500 mt-1">Enter the reference number shown in your UPI app after paying. Admin confirms the order once received.</p>
                  </div>
                </div>
              </div>
            )}

            {method === 'COD' && (
              <p className="mt-4 text-sm text-ink-700 bg-brand-50 rounded-lg p-3">
                Pay {inr(total)} in cash when your order is delivered. A small COD fee of {inr(COD_FEE)} applies.
              </p>
            )}
          </section>
        </div>

        {/* Summary */}
        <aside className="card p-5 h-fit lg:sticky lg:top-24">
          <h2 className="font-extrabold text-lg mb-4">Your order</h2>
          <div className="space-y-3 max-h-56 overflow-y-auto no-scrollbar mb-3">
            {items.map((it) => (
              <div key={it.id + it.sku} className="flex gap-3 text-sm">
                <img src={it.product.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{it.product.name}</p>
                  <p className="text-ink-500">{it.variant.size} × {it.qty}</p>
                </div>
                <span className="font-bold">{inr(it.lineTotal)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-[#ecece7] pt-3 space-y-1 text-sm">
            <Row label="Subtotal" value={inr(subtotal)} />
            <Row label="Shipping" value={shipping === 0 ? 'FREE' : inr(shipping)} />
            {codFee > 0 && <Row label="COD fee" value={inr(codFee)} />}
          </div>
          <div className="border-t border-[#ecece7] mt-3 pt-3 flex justify-between text-lg font-extrabold">
            <span>Total</span><span>{inr(total)}</span>
          </div>
          {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
          <button type="submit" className="btn-primary w-full mt-4">
            {method === 'COD' ? 'Place COD order' : 'I have paid — place order'}
          </button>
          <p className="text-xs text-ink-500 text-center mt-3">Demo checkout · no real payment is taken</p>
        </aside>
      </form>
    </div>
  )
}

function Field({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="font-bold text-sm">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 border border-[#e5e5e0] rounded-lg px-3 py-2.5 outline-none focus:border-brand-400" />
    </label>
  )
}
function Method({ active, onClick, icon: Icon, title, sub }) {
  return (
    <button type="button" onClick={onClick}
      className={`text-left p-4 rounded-xl border flex items-start gap-3 ${active ? 'border-brand-500 bg-brand-50' : 'border-[#e5e5e0] hover:border-brand-300'}`}>
      <Icon size={22} className={active ? 'text-brand-600' : 'text-ink-500'} />
      <div><p className="font-bold text-sm">{title}</p><p className="text-xs text-ink-500">{sub}</p></div>
    </button>
  )
}
function Row({ label, value }) {
  return <div className="flex justify-between text-ink-700"><span>{label}</span><span>{value}</span></div>
}
