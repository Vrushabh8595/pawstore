import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, Users as UsersIcon, Radio, IndianRupee, UserPlus } from 'lucide-react'
import { api } from '@/lib/api'
import { inr } from '@/lib/format'
import { PageHead, Stat, Loading, ErrorBox, fmtNum, fmtDate, timeAgo } from './ui'

const LIVE_MS = 2 * 60 * 1000
const isLive = (d) => d && Date.now() - new Date(d).getTime() < LIVE_MS

export default function AdminUsers() {
  const [q, setQ] = useState('')
  const [debounced, setDebounced] = useState('')
  const [sort, setSort] = useState('new')
  useEffect(() => { const t = setTimeout(() => setDebounced(q), 300); return () => clearTimeout(t) }, [q])
  const res = useQuery({ queryKey: ['admin-users', debounced, sort], queryFn: () => api.get(`/admin/users?q=${encodeURIComponent(debounced)}&sort=${sort}`), refetchInterval: 30_000 })
  const users = res.data?.users || []
  const live = users.filter((u) => isLive(u.lastSeen)).length
  const spent = users.reduce((n, u) => n + (u.spent || 0), 0)
  const new7 = users.filter((u) => Date.now() - new Date(u.createdAt).getTime() < 7 * 864e5).length

  return (
    <div>
      <PageHead title="Users" sub="Search a customer to open their dashboard: orders, spend and activity." />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
        <Stat icon={UsersIcon} label={debounced ? 'Matching users' : 'Total users'} value={fmtNum(users.length)} />
        <Stat icon={Radio} tone="green" label="Logged-in users online" value={fmtNum(live)} live />
        <Stat icon={IndianRupee} tone="orange" label="Lifetime spend (shown)" value={inr(spent)} />
        <Stat icon={UserPlus} tone="violet" label="Joined this week" value={fmtNum(new7)} />
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <div className="flex items-center flex-1 min-w-[220px] bg-white rounded-full px-4 ring-1 ring-ink-200 focus-within:ring-brand-400">
          <Search size={17} className="text-ink-500" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, email or phone…" className="w-full bg-transparent py-2.5 px-2.5 outline-none" />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="bg-white ring-1 ring-ink-200 rounded-full px-4 py-2 text-sm font-semibold">
          <option value="new">Newest first</option><option value="spent">Top spenders</option><option value="orders">Most orders</option><option value="recent">Recently active</option>
        </select>
      </div>

      {res.isLoading ? <Loading /> : res.isError ? <ErrorBox error={res.error} /> : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[820px]">
            <thead className="bg-sand-50 text-left text-ink-500 text-xs uppercase tracking-wide">
              <tr><th className="px-4 py-3">Customer</th><th className="px-3">Orders</th><th className="px-3">Spent</th><th className="px-3">✓ / ⏳ / ✕</th><th className="px-3">Last order</th><th className="px-3">Last seen</th><th className="px-3">Joined</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-t border-ink-100 hover:bg-sand-50/60">
                  <td className="px-4 py-3">
                    <Link to={`/admin/users/${u._id}`} className="flex items-center gap-3 group">
                      <Avatar name={u.name} src={u.avatar} live={isLive(u.lastSeen)} />
                      <span className="min-w-0"><span className="flex items-center gap-1.5 font-bold group-hover:text-brand-600 min-w-0"><span className="truncate">{u.name}</span>{u.blocked && <span className="shrink-0 text-[10px] font-extrabold uppercase tracking-wider text-white bg-red-500 rounded-full px-1.5 py-0.5">Blocked</span>}</span><span className="block text-xs text-ink-500 truncate">{u.email}{u.phone ? ` · ${u.phone}` : ''}</span></span>
                    </Link>
                  </td>
                  <td className="px-3 font-semibold">{u.orderCount}</td>
                  <td className="px-3 font-bold">{inr(u.spent)}</td>
                  <td className="px-3"><span className="text-green-600 font-bold">{u.success}</span> / <span className="text-amber-600 font-bold">{u.pending}</span> / <span className="text-red-600 font-bold">{u.failed}</span></td>
                  <td className="px-3 text-ink-500">{u.lastOrderAt ? timeAgo(u.lastOrderAt) : 'None'}</td>
                  <td className="px-3">{isLive(u.lastSeen) ? <span className="text-green-600 font-bold">Online now</span> : <span className="text-ink-500">{timeAgo(u.lastSeen)}</span>}</td>
                  <td className="px-3 text-ink-500">{fmtDate(u.createdAt)}</td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={7} className="px-4 py-12 text-center text-ink-500">No users found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Customer photo (Google photo or one they uploaded) with an initials fallback.
// Only server-validated data:image URLs are ever shown.
const SAFE_IMG = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/
export function Avatar({ name = '?', src, live, size = 'w-10 h-10 text-sm' }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  const img = SAFE_IMG.test(src || '') ? src : null
  return (
    <span className={`relative grid place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white font-extrabold shrink-0 ${size}`}>
      {img ? <img src={img} alt="" loading="lazy" className="w-full h-full rounded-full object-cover bg-sand-100" /> : initials}
      {live && <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 ring-2 ring-white" />}
    </span>
  )
}
