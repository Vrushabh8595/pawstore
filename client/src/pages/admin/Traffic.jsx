import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Eye, Users, Repeat, Layers, Radio, Smartphone, Monitor, Tablet } from 'lucide-react'
import { api } from '@/lib/api'
import { PageHead, Stat, Panel, BarLineChart, HBars, Loading, ErrorBox, fmtNum, timeAgo } from './ui'

const DEV = { mobile: Smartphone, desktop: Monitor, tablet: Tablet }

export default function Traffic() {
  const [days, setDays] = useState(7)
  const t = useQuery({ queryKey: ['admin-traffic', days], queryFn: () => api.get(`/admin/traffic?days=${days}`), refetchInterval: 60_000 })
  const live = useQuery({ queryKey: ['admin-live'], queryFn: () => api.get('/admin/live'), refetchInterval: 10_000 })

  return (
    <div>
      <PageHead title="Traffic" sub="First-party analytics — no cookies, admin visits excluded."
        right={
          <div className="flex bg-white rounded-full p-1 ring-1 ring-ink-200">
            {[[1, 'Today'], [7, '7 days'], [30, '30 days'], [90, '90 days']].map(([d, l]) => (
              <button key={d} onClick={() => setDays(d)} className={`px-3.5 py-1.5 rounded-full text-sm font-bold transition ${days === d ? 'bg-pine-800 text-white' : 'text-ink-700'}`}>{l}</button>
            ))}
          </div>
        } />

      {t.isLoading ? <Loading /> : t.isError ? <ErrorBox error={t.error} /> : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            <Stat icon={Radio} tone="green" label="Live right now" value={fmtNum(live.data?.count)} live />
            <Stat icon={Users} tone="orange" label="Unique visitors" value={fmtNum(t.data.visitors)} />
            <Stat icon={Eye} tone="blue" label="Page views" value={fmtNum(t.data.views)} />
            <Stat icon={Layers} tone="navy" label="Pages / visitor" value={t.data.pagesPerVisitor} />
            <Stat icon={Repeat} tone="violet" label="Returning visitors" value={fmtNum(t.data.returning)} />
          </div>

          {days > 1 && (
            <Panel title="Visitors & page views" className="mt-4">
              <BarLineChart data={t.data.series} bar="views" line="visitors" barLabel="Page views" lineLabel="Visitors" height={220} />
            </Panel>
          )}

          <div className="grid lg:grid-cols-3 gap-4 mt-4">
            <Panel title="Top pages">
              <HBars rows={t.data.pages} valueKey="views" format={(n) => `${fmtNum(n)} views`} />
            </Panel>
            <Panel title="Where visitors come from">
              <HBars rows={t.data.refs} valueKey="views" color="bg-pine-500" />
            </Panel>
            <Panel title="Devices">
              <ul className="space-y-3">
                {t.data.devices.map((d) => {
                  const Icon = DEV[d._id] || Monitor
                  const pct = t.data.views ? Math.round((d.views / t.data.views) * 100) : 0
                  return (
                    <li key={d._id} className="flex items-center gap-3 text-sm">
                      <span className="grid place-items-center w-9 h-9 rounded-xl bg-sand-100"><Icon size={17} /></span>
                      <span className="capitalize font-semibold flex-1">{d._id || 'unknown'}</span>
                      <b>{pct}%</b>
                    </li>
                  )
                })}
                {t.data.devices.length === 0 && <p className="text-sm text-ink-500 py-6 text-center">No data yet</p>}
              </ul>
            </Panel>
          </div>
        </>
      )}

      <Panel title="Who’s on the site right now" className="mt-4" right={<span className="text-xs text-ink-500">updates every 10s</span>}>
        {!live.data ? <Loading /> : live.data.sessions.length === 0 ? <p className="text-sm text-ink-500 py-6 text-center">Nobody online at the moment.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead className="text-left text-ink-500 text-xs"><tr><th className="py-2">Visitor</th><th>Viewing</th><th>Device</th><th>Pages</th><th>On site since</th><th>Last active</th></tr></thead>
              <tbody>
                {live.data.sessions.map((s) => {
                  const Icon = DEV[s.device] || Monitor
                  return (
                    <tr key={s._id} className="border-t border-ink-100">
                      <td className="py-2.5">{s.user ? <Link to={`/admin/users/${s.user._id}`} className="font-bold hover:text-brand-600">{s.user.name}</Link> : <span className="text-ink-500">Guest · {s.sid.slice(0, 6)}</span>}</td>
                      <td className="font-mono text-xs">{s.path}</td>
                      <td><Icon size={15} className="text-ink-500" /></td>
                      <td>{s.views || 0}</td>
                      <td className="text-ink-500 text-xs">{timeAgo(s.firstSeen)}</td>
                      <td className="text-green-600 text-xs font-bold">{timeAgo(s.lastSeen)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  )
}
