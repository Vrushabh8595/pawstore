import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { create } from 'zustand'
import { Bell, X, CheckCheck, PackageCheck, ShoppingBag } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { playSound, haptic, unlockAudioOnFirstGesture } from '@/lib/feedback'
import { inr } from '@/lib/format'
import StatusBadge from './StatusBadge'

// In-app notifications.
//  • Admin: "new order" alerts (ka-ching sound, desktop notification, toast).
//  • Customer: order status updates (chime, vibration, toast).
// The server is polled every 15 s while signed in; only one <NotificationAlerts>
// is mounted per page, the bells just read the same cached query.

const POLL_MS = 10_000
const useToasts = create((set) => ({
  list: [],
  push: (t) => set((s) => ({ list: [...s.list.filter((x) => x._id !== t._id), t].slice(-4) })),
  drop: (id) => set((s) => ({ list: s.list.filter((x) => x._id !== id) })),
}))

const linkFor = (n, admin) => (admin ? `/admin/orders?open=${encodeURIComponent(n.orderNo)}` : `/account/orders/${encodeURIComponent(n.orderNo)}`)
const seenKey = (uid) => `animalveda-notif-seen-${uid}`
export const ago = (d) => {
  const s = Math.max(1, Math.round((Date.now() - new Date(d)) / 1000))
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.round(s / 60)} min ago`
  if (s < 86400) return `${Math.round(s / 3600)} h ago`
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function useNotificationFeed() {
  const user = useAuth((s) => s.user)
  const uid = user?.id || user?._id
  const q = useQuery({
    queryKey: ['notifications', uid],
    queryFn: () => api.get('/notifications'),
    enabled: !!uid,
    refetchInterval: () => (document.visibilityState === 'visible' ? POLL_MS : 30_000),
    refetchIntervalInBackground: true, // keep alerting while the admin works in another tab
    refetchOnWindowFocus: true,
    staleTime: 5_000,
  })
  return { user, uid, items: q.data?.items || [], unread: q.data?.unread || 0, refetch: q.refetch, data: q.data }
}

export async function markRead(ids) {
  try { await api.post('/notifications/read', ids ? { ids } : {}) } catch { /* ignore */ }
}

/* ------------------------------ alerts + toasts ------------------------------ */
export function NotificationAlerts({ admin = false }) {
  const { uid, items, unread, data } = useNotificationFeed()
  const qc = useQueryClient()
  const push = useToasts((s) => s.push)
  const baseTitle = useRef(document.title)
  useEffect(() => { unlockAudioOnFirstGesture() }, [])

  useEffect(() => {
    if (!uid || !data) return
    let seen = null
    try { seen = localStorage.getItem(seenKey(uid)) } catch { /* ignore */ }
    const newest = items[0]?.createdAt
    // First visit on this device: only surface unread updates from the last day
    const since = seen ? new Date(seen) : new Date(Date.now() - 24 * 3600e3)
    const fresh = items.filter((n) => new Date(n.createdAt) > since && !n.read).reverse()
    if (!seen) { try { localStorage.setItem(seenKey(uid), newest || new Date(0).toISOString()) } catch { /* ignore */ } }
    if (!fresh.length) return
    try { localStorage.setItem(seenKey(uid), newest) } catch { /* ignore */ }
    fresh.splice(0, Math.max(0, fresh.length - 4)) // never flood the screen

    fresh.forEach((n) => push({ ...n, admin }))
    playSound(admin ? 'newOrder' : 'notify')
    haptic(admin ? [120, 80, 120, 80, 200] : [60, 40, 90])
    // Desktop notification when the tab is in the background (admin laptop, or any browser that allows it)
    if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible') {
      fresh.slice(-3).forEach((n) => {
        try {
          const dn = new Notification(n.title, { body: n.body, icon: n.image || '/apple-touch-icon.png', tag: n._id, requireInteraction: admin })
          dn.onclick = () => { window.focus(); window.location.assign(linkFor(n, admin)); dn.close() }
        } catch { /* ignore */ }
      })
    }
    // Refresh the screens that show these orders
    if (admin) { qc.invalidateQueries({ queryKey: ['admin-orders'] }); qc.invalidateQueries({ queryKey: ['admin-dashboard'] }) }
    else { qc.invalidateQueries({ queryKey: ['my-orders'] }); fresh.forEach((n) => qc.invalidateQueries({ queryKey: ['my-order', n.orderNo] })) }
  }, [uid, data, items, admin, push, qc])

  // Unread count in the tab title, so the admin notices from another tab
  useEffect(() => {
    if (!admin) return
    const t = baseTitle.current.replace(/^\(\d+\)\s*/, '')
    document.title = unread ? `(${unread}) ${t}` : t
  }, [admin, unread])

  return <Toasts />
}

function Toasts() {
  const list = useToasts((s) => s.list)
  return (
    <div className="fixed z-[70] inset-x-3 top-3 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-[360px] space-y-2 pointer-events-none" aria-live="polite">
      {list.map((t) => <Toast key={t._id} t={t} />)}
    </div>
  )
}

function Toast({ t }) {
  const drop = useToasts((s) => s.drop)
  const nav = useNavigate()
  useEffect(() => { const id = setTimeout(() => drop(t._id), t.admin ? 20_000 : 9_000); return () => clearTimeout(id) }, [t, drop])
  const open = () => { markRead([t._id]); drop(t._id); nav(linkFor(t, t.admin)) }
  return (
    <div role="status" className="pointer-events-auto animate-toast-in card bg-white p-3 pr-2 flex gap-3 items-start shadow-[0_18px_40px_-16px_rgba(26,52,80,.45)] ring-1 ring-brand-100">
      <Thumb src={t.image} admin={t.admin} />
      <button type="button" onClick={open} className="flex-1 min-w-0 text-left">
        <p className="text-[11px] font-extrabold uppercase tracking-wider text-brand-600">{t.admin ? '🛒 New order' : '🐾 Order update'}</p>
        <p className="font-bold text-sm text-ink-900 leading-snug">{t.title}</p>
        <p className="text-xs text-ink-500 mt-0.5 line-clamp-2">{t.body}</p>
        <span className="inline-block mt-1.5 text-xs font-bold text-brand-600">{t.admin ? 'Open order →' : 'View order →'}</span>
      </button>
      <button type="button" onClick={() => drop(t._id)} aria-label="Dismiss" className="p-1 text-ink-500 hover:text-ink-900"><X size={16} /></button>
    </div>
  )
}

export function Thumb({ src, admin, size = 'w-12 h-12' }) {
  const [bad, setBad] = useState(false)
  return (
    <span className={`${size} shrink-0 rounded-xl overflow-hidden grid place-items-center ${admin ? 'bg-brand-50 text-brand-600' : 'bg-sand-100 text-pine-700'}`}>
      {src && !bad ? <img src={src} alt="" className="w-full h-full object-contain bg-white" onError={() => setBad(true)} /> : admin ? <ShoppingBag size={20} /> : <PackageCheck size={20} />}
    </span>
  )
}

/* ---------------------------------- bell ---------------------------------- */
export function NotificationBell({ admin = false, className = '' }) {
  const { uid, items, unread, refetch } = useNotificationFeed()
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])
  if (!uid) return null

  const go = async (n) => { setOpen(false); if (!n.read) { await markRead([n._id]); refetch() } nav(linkFor(n, admin)) }
  const all = async () => { await markRead(); refetch() }

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        className={`relative p-2 sm:p-2.5 rounded-xl transition ${admin ? 'text-white hover:bg-white/10' : 'hover:bg-sand-100'}`}>
        <Bell size={21} className={unread ? 'animate-wiggle' : ''} />
        {unread > 0 && (
          <span key={unread} className="absolute top-0.5 right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold grid place-items-center ring-2 ring-white animate-pop">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[380px] z-[60] card bg-white shadow-[0_24px_60px_-20px_rgba(26,52,80,.5)] overflow-hidden text-ink-900 animate-fade-in">
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
            <p className="font-bold">{admin ? 'Store alerts' : 'Notifications'}</p>
            {unread > 0 && <button type="button" onClick={all} className="text-xs font-bold text-brand-600 inline-flex items-center gap-1"><CheckCheck size={14} /> Mark all read</button>}
          </div>
          <div className="max-h-[60vh] overflow-y-auto overscroll-contain">
            {items.length === 0 ? (
              <p className="p-8 text-center text-sm text-ink-500">{admin ? 'New orders will show up here.' : 'Updates about your orders will show up here.'}</p>
            ) : items.map((n) => (
              <button key={n._id} type="button" onClick={() => go(n)}
                className={`w-full text-left flex gap-3 px-4 py-3 border-b border-ink-100 last:border-0 hover:bg-sand-50 ${n.read ? '' : 'bg-brand-50/60'}`}>
                <Thumb src={n.image} admin={admin} size="w-11 h-11" />
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="font-bold text-sm truncate">{n.title}</span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-brand-500 shrink-0" aria-label="unread" />}
                  </span>
                  <span className="block text-xs text-ink-500 line-clamp-2 mt-0.5">{n.body}</span>
                  <span className="flex items-center gap-2 mt-1 text-[11px] text-ink-500">
                    {n.status && !admin && <StatusBadge status={n.status} />}
                    {admin && n.amount ? <b className="text-ink-900">{inr(n.amount)}</b> : null}
                    {ago(n.createdAt)}
                  </span>
                </span>
              </button>
            ))}
          </div>
          <Link to={admin ? '/admin/orders' : '/account/notifications'} onClick={() => setOpen(false)} className="block text-center text-sm font-bold text-brand-600 py-2.5 border-t border-ink-100 hover:bg-sand-50">
            {admin ? 'All orders' : 'All notifications'}
          </Link>
        </div>
      )}
    </div>
  )
}

/* ------------------- admin: turn on sound + desktop alerts ------------------- */
// Browsers only allow sound after a click and need permission for desktop alerts.
export function AdminAlertSetup() {
  const [perm, setPerm] = useState(() => ('Notification' in window ? Notification.permission : 'unsupported'))
  const [armed, setArmed] = useState(() => { try { return localStorage.getItem('av-alerts-armed') === '1' } catch { return false } })
  if (armed && perm !== 'default') return null
  const enable = async () => {
    playSound('newOrder') // also unlocks audio for this tab
    try { localStorage.setItem('av-alerts-armed', '1') } catch { /* ignore */ }
    setArmed(true)
    if ('Notification' in window && Notification.permission === 'default') setPerm(await Notification.requestPermission())
  }
  return (
    <div className="mb-5 rounded-2xl p-3.5 sm:p-4 flex flex-wrap items-center gap-3 bg-pine-900 text-white shadow-lg shadow-pine-900/20">
      <span className="w-10 h-10 rounded-xl bg-brand-500 grid place-items-center shrink-0"><Bell size={19} /></span>
      <p className="flex-1 min-w-[200px] text-sm">
        <b>Turn on new-order alerts.</b>{' '}
        <span className="text-white/70">Plays a ka-ching sound{perm !== 'unsupported' ? ' and shows a desktop notification' : ''} the moment an order comes in — even when this tab is in the background.</span>
      </p>
      <button type="button" onClick={enable} className="btn-primary !py-2 !px-4 text-sm">Turn on alerts</button>
    </div>
  )
}
