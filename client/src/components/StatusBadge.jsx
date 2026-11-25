const styles = {
  'Pending Verification': 'bg-amber-100 text-amber-700',
  Confirmed: 'bg-blue-100 text-blue-700',
  Packed: 'bg-indigo-100 text-indigo-700',
  Shipped: 'bg-violet-100 text-violet-700',
  'Out for Delivery': 'bg-cyan-100 text-cyan-700',
  Delivered: 'bg-green-100 text-green-700',
  'Payment Rejected': 'bg-red-100 text-red-700',
  Cancelled: 'bg-ink-100 text-ink-700',
  Returned: 'bg-orange-100 text-orange-700',
}

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${styles[status] || 'bg-ink-100 text-ink-700'}`}>
      {status}
    </span>
  )
}

export function PaymentBadge({ payment }) {
  const map = {
    paid: ['Paid', 'bg-green-100 text-green-700'],
    pending_verification: ['Verifying', 'bg-amber-100 text-amber-700'],
    cod_pending: ['COD', 'bg-ink-100 text-ink-700'],
    rejected: ['Rejected', 'bg-red-100 text-red-700'],
  }
  const [label, cls] = map[payment.status] || ['—', 'bg-ink-100 text-ink-700']
  return <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>
}
