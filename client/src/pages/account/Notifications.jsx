import { Link } from 'react-router-dom'
import { BellOff, CheckCheck } from 'lucide-react'
import { useNotificationFeed, markRead, Thumb, ago } from '@/components/Notifications'
import StatusBadge from '@/components/StatusBadge'
import RefreshButton from './RefreshButton'

// Customer's order updates (status changes made by the AnimalVeda team)
export default function AccountNotifications() {
  const { items, unread, refetch, data } = useNotificationFeed()
  const readAll = async () => { await markRead(); refetch() }
  const open = (n) => { if (!n.read) markRead([n._id]).then(() => refetch()) }

  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
        <h1 className="text-2xl sm:text-3xl">Notifications</h1>
        <RefreshButton />
      </div>
      {unread > 0 && (
        <div className="flex items-center justify-between gap-3 mb-3 text-sm">
          <span className="text-ink-500"><b className="text-ink-900">{unread}</b> unread</span>
          <button onClick={readAll} className="inline-flex items-center gap-1 font-bold text-brand-600"><CheckCheck size={16} /> Mark all read</button>
        </div>
      )}
      {!data ? (
        <div className="space-y-3">{[0, 1].map((i) => <div key={i} className="card p-4 h-20 animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="card p-10 text-center text-ink-500">
          <BellOff size={36} className="mx-auto mb-3 text-brand-400" />
          No notifications yet. When we confirm, ship or deliver your order you’ll see it here — with a sound alert.
        </div>
      ) : (
        <ul className="space-y-2.5">
          {items.map((n) => (
            <li key={n._id}>
              <Link to={`/account/orders/${n.orderNo}`} onClick={() => open(n)}
                className={`card p-3.5 sm:p-4 flex gap-3 items-start hover:border-brand-300 transition ${n.read ? '' : 'border-brand-200 bg-brand-50/50'}`}>
                <Thumb src={n.image} />
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2 flex-wrap">
                    <b className="text-ink-900">{n.title}</b>
                    {!n.read && <span className="text-[10px] font-extrabold uppercase tracking-wider text-white bg-brand-500 rounded-full px-1.5 py-0.5">New</span>}
                  </span>
                  <span className="block text-sm text-ink-700 mt-0.5">{n.body}</span>
                  <span className="flex items-center gap-2 flex-wrap mt-1.5 text-xs text-ink-500">
                    {n.status && <StatusBadge status={n.status} />} Order {n.orderNo} · {ago(n.createdAt)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
