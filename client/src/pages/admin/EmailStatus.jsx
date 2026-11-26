import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Mail, MailCheck, MailWarning, Loader2, ChevronDown } from 'lucide-react'
import { api } from '@/lib/api'

// Shows whether order emails are switched on, with a "send test email" button.
export default function EmailStatus() {
  const q = useQuery({ queryKey: ['admin-email-status'], queryFn: () => api.get('/admin/email-status'), staleTime: 60_000 })
  const test = useMutation({ mutationFn: () => api.post('/admin/email-test', {}) })
  const [help, setHelp] = useState(false)
  if (!q.data) return null
  const on = !!q.data.provider

  if (on) {
    return (
      <div className="mb-5 flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 text-green-700 ring-1 ring-green-200 px-3 py-1 font-bold"><MailCheck size={15} /> Order emails on</span>
        <span className="text-ink-500">New orders go to <b className="text-ink-700">{q.data.adminEmail}</b></span>
        <button onClick={() => test.mutate()} disabled={test.isPending} className="ml-auto inline-flex items-center gap-1.5 font-bold text-brand-600 disabled:opacity-60">
          {test.isPending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />} Send test email
        </button>
        {test.isSuccess && <p className="w-full text-xs font-semibold text-green-700">✓ Test email sent to {test.data.to}. Check the inbox (and Spam the first time).</p>}
        {test.error && <p className="w-full text-xs font-semibold text-red-600">Couldn’t send: {test.error.message}</p>}
      </div>
    )
  }

  return (
    <div className="mb-5 card p-4 border-amber-200 bg-amber-50">
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-amber-400 text-white grid place-items-center shrink-0"><MailWarning size={19} /></span>
        <p className="flex-1 min-w-[200px] text-sm text-amber-900">
          <b>Order emails are off.</b> Customers and {q.data.adminEmail} won’t get emails until email is connected on the server. In-app alerts still work.
        </p>
        <button onClick={() => setHelp((h) => !h)} className="inline-flex items-center gap-1 text-sm font-bold text-amber-900">
          How to turn on <ChevronDown size={15} className={help ? 'rotate-180 transition' : 'transition'} />
        </button>
      </div>
      {help && (
        <ol className="mt-3 ml-1 list-decimal list-inside space-y-1.5 text-sm text-amber-900">
          <li>Open <a className="underline font-semibold" href="https://script.google.com/home/projects/create" target="_blank" rel="noreferrer">script.google.com → New project</a> while signed in as {q.data.adminEmail}.</li>
          <li>Paste the “AnimalVeda Gmail relay” script, then <b>Deploy → New deployment → Web app</b> (Execute as: Me, Who has access: Anyone) and authorize.</li>
          <li>On Render → pawstore → Environment, add <code className="bg-white/70 px-1 rounded">MAIL_WEBHOOK_URL</code> (the web app URL) and <code className="bg-white/70 px-1 rounded">MAIL_WEBHOOK_SECRET</code> (the secret in the script).</li>
          <li>Come back here and press <b>Send test email</b>.</li>
        </ol>
      )}
    </div>
  )
}
