import { useState } from 'react'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { RefreshCw, Check } from 'lucide-react'
import { useAuth } from '@/store/auth'
import { haptic } from '@/lib/feedback'

// Refreshes orders, order details and notifications in place — no full page reload.
export default function RefreshButton({ className = '' }) {
  const qc = useQueryClient()
  const init = useAuth((s) => s.init)
  const fetching = useIsFetching({ predicate: (q) => ['my-orders', 'my-order', 'notifications'].includes(q.queryKey[0]) })
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const spinning = busy || fetching > 0

  const refresh = async () => {
    if (busy) return
    haptic(8)
    setBusy(true); setDone(false)
    try {
      await Promise.all([
        qc.refetchQueries({ queryKey: ['my-orders'], type: 'active' }),
        qc.refetchQueries({ queryKey: ['my-order'], type: 'active' }),
        qc.refetchQueries({ queryKey: ['notifications'], type: 'active' }),
        init(),
      ])
      setDone(true)
      setTimeout(() => setDone(false), 1800)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button type="button" onClick={refresh} disabled={busy} aria-label="Refresh orders and notifications"
      className={`inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-sm font-bold text-ink-700 hover:border-brand-300 hover:text-brand-600 active:scale-95 transition disabled:opacity-80 ${className}`}>
      {done && !spinning ? <Check size={15} className="text-green-600" /> : <RefreshCw size={15} className={spinning ? 'animate-spin' : ''} />}
      <span>{done && !spinning ? 'Updated' : spinning ? 'Refreshing…' : 'Refresh'}</span>
    </button>
  )
}
