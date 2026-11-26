import { Ban, Phone, Mail } from 'lucide-react'

export const SUPPORT_PHONE = '7620377278'
export const SUPPORT_EMAIL = 'care@animalveda.com'
export const BLOCKED_TEXT = 'Your account has been blocked, so you can’t place orders right now. Please contact our support team to get unblocked and keep shopping with AnimalVeda.'

// Shown to customers an admin has blocked. `compact` = slim site-wide bar.
export default function BlockedNotice({ compact = false }) {
  if (compact) {
    return (
      <div role="alert" className="bg-red-600 text-white text-[12.5px] sm:text-sm">
        <div className="container-x py-2 flex items-center gap-2">
          <Ban size={15} className="shrink-0" />
          <p className="flex-1 min-w-0">You’ve been blocked from shopping. Please contact our support team to get unblocked.</p>
          <a href={`tel:${SUPPORT_PHONE}`} className="shrink-0 font-bold underline underline-offset-2">Call support</a>
        </div>
      </div>
    )
  }
  return (
    <div role="alert" className="card p-6 sm:p-8 text-center max-w-lg mx-auto border-red-200 animate-fade-in">
      <span className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 grid place-items-center mx-auto"><Ban size={28} /></span>
      <h2 className="text-xl sm:text-2xl mt-4">You can’t place orders right now</h2>
      <p className="text-ink-700 mt-2 leading-relaxed">{BLOCKED_TEXT}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5">
        <a href={`tel:${SUPPORT_PHONE}`} className="btn-primary !py-2.5"><Phone size={16} /> Call +91 {SUPPORT_PHONE}</a>
        <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Please unblock my AnimalVeda account')}`} className="btn-ghost !py-2.5"><Mail size={16} /> Email support</a>
      </div>
    </div>
  )
}
