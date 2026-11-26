// Small UI kit for the admin panel: stat cards, SVG charts, helpers.
import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { inr } from '@/lib/format'

export const fmtNum = (n) => new Intl.NumberFormat('en-IN').format(n || 0)
export const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'None')
export const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : 'None')
export function timeAgo(d) {
  if (!d) return 'never'
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`
  return fmtDate(d)
}
export const shortDay = (iso) => new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
export const custName = (o) => o.user?.name || o.customerName || o.shippingAddress?.name || 'Guest'

export function PageHead({ title, sub, right }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl">{title}</h1>
        {sub && <p className="text-ink-500 text-sm mt-1">{sub}</p>}
      </div>
      {right}
    </div>
  )
}

const TONES = {
  orange: 'bg-brand-50 text-brand-600', navy: 'bg-pine-50 text-pine-700', green: 'bg-green-50 text-green-600',
  red: 'bg-red-50 text-red-600', amber: 'bg-amber-50 text-amber-600', violet: 'bg-violet-50 text-violet-600', blue: 'bg-blue-50 text-blue-600',
}
export function Stat({ icon: Icon, label, value, hint, tone = 'navy', live }) {
  return (
    <div className="card p-4 sm:p-5 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <span className={`grid place-items-center w-10 h-10 rounded-xl ${TONES[tone]}`}><Icon size={19} /></span>
        {live && <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-green-600"><span className="relative flex w-2 h-2"><span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-70" /><span className="relative w-2 h-2 rounded-full bg-green-500" /></span>Live</span>}
      </div>
      <p className="text-xs font-semibold text-ink-500 mt-3">{label}</p>
      <p className="text-2xl font-extrabold text-ink-900 mt-0.5 truncate">{value}</p>
      {hint && <p className="text-xs text-ink-500 mt-0.5 truncate">{hint}</p>}
    </div>
  )
}

export function Panel({ title, right, children, className = '' }) {
  return (
    <section className={`card p-4 sm:p-5 min-w-0 ${className}`}>
      {(title || right) && <div className="flex items-center justify-between gap-3 mb-4"><h2 className="text-lg">{title}</h2>{right}</div>}
      {children}
    </section>
  )
}

// Bar chart with optional line overlay; hover shows values.
export function BarLineChart({ data, bar, line, barLabel, lineLabel, money = false, height = 200 }) {
  const [hover, setHover] = useState(null)
  const W = 640, H = height, P = { l: 8, r: 8, t: 12, b: 26 }
  const iw = W - P.l - P.r, ih = H - P.t - P.b
  const maxB = Math.max(1, ...data.map((d) => d[bar] || 0))
  const maxL = Math.max(1, ...data.map((d) => d[line] || 0))
  const bw = iw / data.length
  const pts = data.map((d, i) => [P.l + bw * i + bw / 2, P.t + ih - ((d[line] || 0) / maxL) * ih])
  const fmt = (v) => (money ? inr(v) : fmtNum(v))
  const h = hover != null ? data[hover] : null
  return (
    <div className="relative">
      <div className="flex items-center gap-4 text-xs font-semibold text-ink-500 mb-2">
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-brand-400" />{barLabel}</span>
        {line && <span className="inline-flex items-center gap-1.5"><span className="w-3 h-0.5 rounded bg-pine-700" />{lineLabel}</span>}
        {h && <span className="ml-auto text-ink-900">{shortDay(h.date)}: {barLabel} <b>{fmt(h[bar])}</b>{line && <> · {lineLabel} <b>{fmtNum(h[line])}</b></>}</span>}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" onMouseLeave={() => setHover(null)}>
        {[0.25, 0.5, 0.75, 1].map((f) => <line key={f} x1={P.l} x2={W - P.r} y1={P.t + ih * (1 - f)} y2={P.t + ih * (1 - f)} stroke="#e9e7e2" strokeDasharray="3 4" />)}
        {data.map((d, i) => {
          const bh = ((d[bar] || 0) / maxB) * ih
          return (
            <g key={d.date} onMouseEnter={() => setHover(i)}>
              <rect x={P.l + bw * i} y={P.t} width={bw} height={ih} fill="transparent" />
              <rect x={P.l + bw * i + bw * 0.18} y={P.t + ih - bh} width={bw * 0.64} height={Math.max(bh, 1)} rx="4"
                fill={hover === i ? '#e06402' : '#ffa027'} />
              {(data.length <= 14 || i % Math.ceil(data.length / 10) === 0) && (
                <text x={P.l + bw * i + bw / 2} y={H - 8} textAnchor="middle" fontSize="10" fill="#6b6a63">{shortDay(d.date)}</text>
              )}
            </g>
          )
        })}
        {line && <polyline points={pts.map((p) => p.join(',')).join(' ')} fill="none" stroke="#213f61" strokeWidth="2.5" strokeLinejoin="round" />}
        {line && pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={hover === i ? 5 : 3} fill="#fff" stroke="#213f61" strokeWidth="2" />)}
      </svg>
    </div>
  )
}

// Horizontal bars (top lists)
export function HBars({ rows, valueKey, labelKey = '_id', format = fmtNum, color = 'bg-brand-400', empty = 'No data yet' }) {
  const max = Math.max(1, ...rows.map((r) => r[valueKey] || 0))
  if (!rows.length) return <p className="text-sm text-ink-500 py-6 text-center">{empty}</p>
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r[labelKey]} className="text-sm flex items-center gap-3">
          {'image' in r && <ItemImg src={r.image} alt={r[labelKey]} className="w-10 h-10" />}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between gap-3 mb-1"><span className="font-semibold truncate">{r[labelKey]}</span><span className="font-bold shrink-0">{format(r[valueKey])}</span></div>
            <div className="h-2 rounded-full bg-ink-50 overflow-hidden"><div className={`h-full rounded-full ${color}`} style={{ width: `${((r[valueKey] || 0) / max) * 100}%` }} /></div>
          </div>
        </li>
      ))}
    </ul>
  )
}

// Ring showing order outcome split
export function OutcomeRing({ success = 0, pending = 0, failed = 0 }) {
  const total = success + pending + failed
  const C = 2 * Math.PI * 42
  const seg = [[success, '#16a34a'], [pending, '#f59e0b'], [failed, '#dc2626']]
  let off = 0
  return (
    <div className="flex items-center gap-5">
      <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90 shrink-0">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#f6f5f3" strokeWidth="14" />
        {total > 0 && seg.map(([v, c], i) => {
          const len = (v / total) * C
          const el = <circle key={i} cx="50" cy="50" r="42" fill="none" stroke={c} strokeWidth="14" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-off} />
          off += len
          return el
        })}
      </svg>
      <ul className="space-y-2 text-sm">
        {[['Successful', success, 'bg-green-600'], ['Pending', pending, 'bg-amber-500'], ['Failed / cancelled', failed, 'bg-red-600']].map(([l, v, c]) => (
          <li key={l} className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded-full ${c}`} /><span className="text-ink-700">{l}</span><b className="ml-auto pl-3">{fmtNum(v)}</b></li>
        ))}
        <li className="text-xs text-ink-500 pt-1">Total {fmtNum(total)} orders</li>
      </ul>
    </div>
  )
}

export function Loading({ label = 'Loading…' }) {
  return <div className="grid place-items-center py-20 text-ink-500 text-sm"><span className="w-8 h-8 rounded-full border-4 border-brand-200 border-t-brand-500 animate-spin mb-3" />{label}</div>
}
export function ErrorBox({ error }) {
  return (
    <div className="card p-6 text-sm">
      <p className="font-bold text-red-600">Couldn’t load data</p>
      <p className="text-ink-500 mt-1">{error?.message || 'Unknown error'}. If you just deployed, make sure the latest server is live on Render.</p>
    </div>
  )
}

// Product photo (falls back to a paw tile).
// • Mouse / trackpad hover → large zoomed preview next to it.
// • Click / tap (when not inside a link or button) → full-screen view.
export function ItemImg({ src, alt = '', className = 'w-12 h-12', zoom = true }) {
  const [bad, setBad] = useState(false)
  const [pos, setPos] = useState(null)
  const [full, setFull] = useState(false)
  const ref = useRef(null)
  const canZoom = zoom && src && !bad
  const show = (e) => {
    if (!canZoom || e.pointerType === 'touch') return
    const r = ref.current.getBoundingClientRect()
    const size = Math.min(380, window.innerWidth - 24, window.innerHeight - 24)
    const right = r.right + 14 + size <= window.innerWidth
    const left = right ? r.right + 14 : Math.max(12, r.left - 14 - size)
    const top = Math.min(Math.max(12, r.top + r.height / 2 - size / 2), window.innerHeight - size - 12)
    setPos({ left, top, size })
  }
  const openFull = (e) => {
    if (!canZoom || e.target.closest('a,button')) return
    e.stopPropagation(); setPos(null); setFull(true)
  }
  return (
    <span ref={ref} onPointerEnter={show} onPointerLeave={() => setPos(null)} onClick={openFull}
      className={`${className} shrink-0 rounded-xl bg-white ring-1 ring-ink-100 overflow-hidden grid place-items-center ${canZoom ? 'cursor-zoom-in' : ''}`}>
      {src && !bad ? <img src={src} alt={alt} loading="lazy" className={`w-full h-full object-contain p-0.5 transition-transform duration-200 ${canZoom ? 'hover:scale-125' : ''}`} onError={() => setBad(true)} /> : <span className="text-lg" aria-hidden="true">🐾</span>}
      {pos && createPortal(
        <span role="presentation" className="fixed z-[100] pointer-events-none rounded-2xl bg-white p-3 shadow-[0_24px_60px_-12px_rgba(26,52,80,.55)] ring-1 ring-ink-100 animate-zoom-in"
          style={{ left: pos.left, top: pos.top, width: pos.size, height: pos.size }}>
          <img src={src} alt="" className="w-full h-full object-contain rounded-xl" />
          {alt && <span className="absolute inset-x-3 bottom-3 rounded-lg bg-pine-900/85 text-white text-xs font-semibold px-2.5 py-1.5 line-clamp-2">{alt}</span>}
        </span>,
        document.body
      )}
      {full && createPortal(
        <span role="dialog" aria-label={alt || 'Product photo'} onClick={() => setFull(false)}
          className="fixed inset-0 z-[110] bg-black/80 grid place-items-center p-4 cursor-zoom-out animate-fade-in">
          <img src={src} alt={alt} className="max-w-full max-h-[85vh] rounded-2xl bg-white p-3 object-contain" />
          {alt && <span className="mt-3 text-white text-sm font-semibold text-center">{alt}</span>}
        </span>,
        document.body
      )}
    </span>
  )
}

// Overlapping stack of an order's product photos (+N)
export function ItemStack({ items = [], max = 3, size = 'w-11 h-11' }) {
  const shown = items.slice(0, max)
  const more = items.length - shown.length
  return (
    <span className="flex items-center -space-x-3 shrink-0">
      {shown.map((i, k) => <ItemImg key={k} src={i.image} alt={i.name} className={`${size} ring-2 !ring-white shadow-sm`} />)}
      {more > 0 && <span className={`${size} rounded-xl bg-pine-800 text-white text-xs font-extrabold grid place-items-center ring-2 ring-white`}>+{more}</span>}
    </span>
  )
}
