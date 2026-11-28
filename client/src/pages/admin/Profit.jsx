import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, keepPreviousData } from '@tanstack/react-query'
import { IndianRupee, Package, Truck, Undo2, TrendingUp, TrendingDown, Percent, Clock, AlertTriangle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import { inr } from '@/lib/format'
import { PageHead, Stat, Panel, Loading, ErrorBox, fmtNum, fmtDate, ItemImg } from './ui'

const PERIODS = [['day', 'Day'], ['week', 'Week'], ['month', 'Month'], ['year', 'Year'], ['custom', 'Custom']]
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
const shift = (iso, period, dir) => {
  const d = new Date(iso + 'T12:00:00')
  if (period === 'day') d.setDate(d.getDate() + dir)
  else if (period === 'week') d.setDate(d.getDate() + 7 * dir)
  else if (period === 'month') d.setMonth(d.getMonth() + dir, Math.min(d.getDate(), 28))
  else if (period === 'year') d.setFullYear(d.getFullYear() + dir)
  return d.toLocaleDateString('en-CA')
}
const label = (iso, by) => by === 'month'
  ? new Date(iso + '-01T12:00:00').toLocaleDateString('en-IN', { month: 'short' })
  : new Date(iso + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
const signed = (n) => (n < 0 ? '−' + inr(-n) : inr(n))

export default function Profit() {
  const [period, setPeriod] = useState('month')
  const [date, setDate] = useState(today)
  const [from, setFrom] = useState(() => shift(today(), 'month', -1))
  const [to, setTo] = useState(today)
  const qs = period === 'custom' ? `period=custom&from=${from}&to=${to}` : `period=${period}&date=${date}`
  const q = useQuery({ queryKey: ['admin-profit', qs], queryFn: () => api.get(`/admin/profit?${qs}`), placeholderData: keepPreviousData })

  const d = q.data
  const t = d?.totals
  const rangeText = d ? (d.start === d.end ? fmtDate(d.start) : `${fmtDate(d.start)} – ${fmtDate(d.end)}`) : ''
  const atToday = date >= today()

  return (
    <div>
      <PageHead title="Profit & loss" sub="Only you can see this. Costs come from the cost price and courier charge on each product."
        right={<button onClick={() => q.refetch()} className="btn-ghost !py-2 !px-3.5 text-sm"><RefreshCw size={15} className={q.isFetching ? 'animate-spin' : ''} /> Refresh</button>} />

      {/* Period picker */}
      <div className="card p-3 sm:p-4 mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl bg-sand-100 p-1" role="tablist" aria-label="Period">
          {PERIODS.map(([k, l]) => (
            <button key={k} role="tab" aria-selected={period === k} onClick={() => setPeriod(k)}
              className={`px-3 sm:px-4 py-1.5 rounded-lg text-sm font-bold transition ${period === k ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-900'}`}>{l}</button>
          ))}
        </div>
        {period === 'custom' ? (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <label className="inline-flex items-center gap-1.5 font-semibold text-ink-700">From <input type="date" value={from} max={today()} onChange={(e) => e.target.value && setFrom(e.target.value)} className="border border-ink-200 rounded-lg px-2 py-1.5" /></label>
            <label className="inline-flex items-center gap-1.5 font-semibold text-ink-700">To <input type="date" value={to} max={today()} onChange={(e) => e.target.value && setTo(e.target.value)} className="border border-ink-200 rounded-lg px-2 py-1.5" /></label>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button onClick={() => setDate(shift(date, period, -1))} aria-label="Previous" className="w-9 h-9 grid place-items-center rounded-lg ring-1 ring-ink-200 hover:ring-brand-400"><ChevronLeft size={18} /></button>
            <input type="date" value={date} max={today()} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="Pick a date" className="border border-ink-200 rounded-lg px-2 py-1.5 text-sm" />
            <button onClick={() => setDate(shift(date, period, 1) > today() ? today() : shift(date, period, 1))} disabled={atToday} aria-label="Next" className="w-9 h-9 grid place-items-center rounded-lg ring-1 ring-ink-200 hover:ring-brand-400 disabled:opacity-40"><ChevronRight size={18} /></button>
            {!atToday && <button onClick={() => setDate(today())} className="text-sm font-bold text-brand-600 px-2">Today</button>}
          </div>
        )}
        {d && <p className="text-sm font-semibold text-ink-500 sm:ml-auto">{rangeText}</p>}
      </div>

      {q.isLoading ? <Loading label="Working out your profit…" /> : q.isError ? <ErrorBox error={q.error} /> : (
        <div className={q.isFetching ? 'opacity-70 transition-opacity' : ''}>
          {/* Headline */}
          <div className={`card p-5 sm:p-6 mb-4 flex flex-wrap items-center gap-4 ${t.net < 0 ? 'ring-2 ring-red-200' : 'ring-2 ring-green-200'}`}>
            <span className={`w-12 h-12 rounded-2xl grid place-items-center ${t.net < 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>{t.net < 0 ? <TrendingDown /> : <TrendingUp />}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink-500">{t.net < 0 ? 'Net loss' : 'Net profit'} · {rangeText}</p>
              <p className={`text-3xl sm:text-4xl font-extrabold ${t.net < 0 ? 'text-red-600' : 'text-green-700'}`}>{signed(t.net)}</p>
            </div>
            <p className="text-sm text-ink-700 sm:ml-auto max-w-md">
              {fmtNum(t.orders)} completed order{t.orders === 1 ? '' : 's'} earned {inr(t.sales + t.fees)}. After {inr(t.goodsCost)} stock cost, {inr(t.courierCost)} courier and {inr(t.returnsLoss)} lost on {fmtNum(t.returns)} return{t.returns === 1 ? '' : 's'}, you {t.net < 0 ? 'lost' : 'kept'} {inr(Math.abs(t.net))} ({d.margin}%).
            </p>
          </div>

          {(d.missingOrders > 0 || d.estimated > 0) && (
            <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 flex gap-2.5 text-sm text-amber-800">
              <AlertTriangle size={18} className="shrink-0 mt-0.5 text-amber-600" />
              <p>
                {d.missingOrders > 0 && <>{d.missingOrders} order{d.missingOrders > 1 ? 's have' : ' has'} items with no cost price, so profit looks higher than it is. <Link to="/admin/products" className="font-bold underline">Add costs</Link>. </>}
                {d.estimated > 0 && <>{d.estimated} older order{d.estimated > 1 ? 's were' : ' was'} placed before costs were tracked, so today’s costs are used for {d.estimated > 1 ? 'them' : 'it'}.</>}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
            <Stat icon={IndianRupee} tone="green" label="Sales (completed orders)" value={inr(t.sales + t.fees)} hint={`${inr(t.sales)} products + ${inr(t.fees)} delivery/COD fees`} />
            <Stat icon={Package} tone="navy" label="Stock cost (what you paid)" value={inr(t.goodsCost)} hint={`${fmtNum(t.orders)} orders`} />
            <Stat icon={Truck} tone="blue" label="Courier charges" value={inr(t.courierCost)} hint="Delivered orders, one way" />
            <Stat icon={Undo2} tone="red" label="Loss from returns" value={inr(t.returnsLoss)} hint={`${fmtNum(t.returns)} returned · courier both ways`} />
            <Stat icon={TrendingUp} tone="green" label="Gross profit (before returns)" value={signed(t.gross)} hint="Sales − stock − courier" />
            <Stat icon={Percent} tone="violet" label="Net margin" value={`${d.margin}%`} hint="Net profit ÷ sales" />
            <Stat icon={Clock} tone="amber" label="Pending orders" value={fmtNum(d.pending.orders)} hint={`${inr(d.pending.value)} not counted yet`} />
            <Stat icon={AlertTriangle} tone="orange" label="Cancelled / rejected" value={fmtNum(d.cancelled.orders)} hint="No cost counted" />
          </div>

          {d.series.length > 1 && (
            <Panel title={`Net profit by ${d.by}`} className="mt-4">
              <ProfitChart data={d.series} by={d.by} />
            </Panel>
          )}

          <Panel title="Profit by product" className="mt-4" right={<span className="text-xs text-ink-500">Loss-making first</span>}>
            {d.products.length === 0 ? <p className="text-sm text-ink-500 py-6 text-center">No completed or returned orders in this period.</p> : (
              <div className="overflow-x-auto -mx-4 sm:-mx-5">
                <table className="w-full text-sm min-w-[720px]">
                  <thead className="text-left text-ink-500 bg-ink-50">
                    <tr>{['Product', 'Sold', 'Sales', 'Stock cost', 'Courier', 'Returned', 'Return loss', 'Profit'].map((h) => <th key={h} className="px-4 py-2.5 font-semibold whitespace-nowrap">{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {d.products.map((p) => (
                      <tr key={p.name} className={`border-t border-ink-100 ${p.profit < 0 ? 'bg-red-50/50' : ''}`}>
                        <td className="px-4 py-2.5"><span className="flex items-center gap-2.5 min-w-0"><ItemImg src={p.image} alt={p.name} className="w-9 h-9" /><span className="font-semibold truncate max-w-[220px]">{p.name}</span></span></td>
                        <td className="px-4 py-2.5">{fmtNum(p.qty)}</td>
                        <td className="px-4 py-2.5">{inr(p.sales)}</td>
                        <td className="px-4 py-2.5">{inr(p.goodsCost)}</td>
                        <td className="px-4 py-2.5">{inr(p.courierCost)}</td>
                        <td className="px-4 py-2.5">{p.returned ? fmtNum(p.returned) : '–'}</td>
                        <td className="px-4 py-2.5 text-red-600">{p.returnsLoss ? inr(p.returnsLoss) : '–'}</td>
                        <td className={`px-4 py-2.5 font-extrabold ${p.profit < 0 ? 'text-red-600' : 'text-green-700'}`}>{signed(p.profit)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>

          <Panel title={`Returned orders (${d.returns.length})`} className="mt-4" right={<span className="text-xs text-ink-500">Loss = courier charge × 2</span>}>
            {d.returns.length === 0 ? <p className="text-sm text-ink-500 py-6 text-center">No returns in this period. 🎉</p> : (
              <ul className="divide-y divide-ink-100 -my-1">
                {d.returns.map((r) => (
                  <li key={r.orderNo}>
                    <Link to={`/admin/orders?open=${r.orderNo}`} className="flex items-center gap-3 py-2.5 group">
                      <span className="w-9 h-9 rounded-xl bg-red-50 text-red-600 grid place-items-center shrink-0"><Undo2 size={16} /></span>
                      <span className="flex-1 min-w-0">
                        <b className="group-hover:text-brand-600">{r.orderNo}</b> <span className="text-xs text-ink-500">· {[r.customer, fmtDate(r.createdAt)].filter(Boolean).join(' · ')}</span>
                        <span className="block text-xs text-ink-500 truncate">{r.items}</span>
                      </span>
                      <span className="text-right shrink-0"><b className="block text-red-600">−{inr(r.loss)}</b><span className="text-xs text-ink-500">order {inr(r.total)}</span></span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </div>
  )
}

// Bars above/below zero: green profit, red loss
function ProfitChart({ data, by }) {
  const [hover, setHover] = useState(null)
  const W = 640, H = 200, P = { l: 8, r: 8, t: 12, b: 8 }
  const iw = W - P.l - P.r, ih = H - P.t - P.b
  const max = Math.max(1, ...data.map((d) => d.net))
  const min = Math.min(0, ...data.map((d) => d.net))
  const span = max - min || 1
  const y0 = P.t + (max / span) * ih
  const bw = iw / data.length
  const h = hover != null ? data[hover] : null
  const step = Math.ceil(data.length / 7) // date labels in HTML so they stay readable on phones
  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-ink-500 mb-2 min-h-[1.25rem]">
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-green-500" />Profit</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-red-500" />Loss</span>
        {h && <span className="ml-auto text-ink-900">{label(h.date, by)}: <b className={h.net < 0 ? 'text-red-600' : 'text-green-700'}>{signed(h.net)}</b> · {h.orders} orders{h.returns ? ` · ${h.returns} returned` : ''}</span>}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" onMouseLeave={() => setHover(null)}>
        <line x1={P.l} x2={W - P.r} y1={y0} y2={y0} stroke="#c9c6bd" />
        {data.map((d, i) => {
          const bh = (Math.abs(d.net) / span) * ih
          const x = P.l + bw * i
          return (
            <g key={d.date} onMouseEnter={() => setHover(i)} onClick={() => setHover(i)}>
              <rect x={x} y={P.t} width={bw} height={ih} fill="transparent" />
              {d.net !== 0 && <rect x={x + bw * 0.16} y={d.net > 0 ? y0 - bh : y0} width={bw * 0.68} height={Math.max(bh, 1.5)} rx="3"
                fill={d.net < 0 ? (hover === i ? '#b91c1c' : '#ef4444') : (hover === i ? '#15803d' : '#22c55e')} />}
            </g>
          )
        })}
      </svg>
      <div className="relative h-5 text-[11px] text-ink-500">
        {data.map((d, i) => i % step === 0 && (
          <span key={d.date} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: `${((P.l + (W - P.l - P.r) / data.length * (i + 0.5)) / W) * 100}%` }}>{label(d.date, by)}</span>
        ))}
      </div>
    </div>
  )
}
