// Transactional email over HTTPS (Render's free plan blocks SMTP ports).
// Set ONE of these on the server:
//   MAIL_WEBHOOK_URL + MAIL_WEBHOOK_SECRET — a Google Apps Script web app that
//                  sends from your own Gmail (see server/gmail-relay.gs). Free, ~100/day.
//   BREVO_API_KEY  — brevo.com (free 300 emails/day; verify the sender address once)
//   RESEND_API_KEY — resend.com (needs a verified domain to email customers)
// plus MAIL_FROM, e.g. "AnimalVeda <care@animalveda.com>" (a sender verified with the provider).
// Without a key, emails are skipped and logged — the rest of the app keeps working.
const FROM = () => process.env.MAIL_FROM || 'AnimalVeda <gulhanev33@gmail.com>'

function parseFrom(from) {
  const m = /^(.*)<(.+)>$/.exec(from.trim())
  return m ? { name: m[1].trim().replace(/^"|"$/g, ''), email: m[2].trim() } : { name: 'AnimalVeda', email: from.trim() }
}

export function mailProvider() {
  if (process.env.MAIL_WEBHOOK_URL) return 'gmail'
  if (process.env.BREVO_API_KEY) return 'brevo'
  if (process.env.RESEND_API_KEY) return 'resend'
  return null
}
export const mailEnabled = () => !!mailProvider()

export async function sendMail({ to, subject, html, text }) {
  const list = [].concat(to).filter(Boolean)
  if (!list.length) return { skipped: 'no recipient' }
  try {
    if (process.env.MAIL_WEBHOOK_URL) {
      const from = parseFrom(FROM())
      const r = await fetch(process.env.MAIL_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'content-type': 'text/plain;charset=utf-8' }, // Apps Script reads the raw body
        body: JSON.stringify({ secret: process.env.MAIL_WEBHOOK_SECRET || '', to: list, subject, html, text, fromName: from.name }),
        redirect: 'follow',
        signal: AbortSignal.timeout(20000),
      })
      const out = await r.json().catch(() => null)
      if (!r.ok || !out?.ok) throw new Error(`Gmail relay: ${out?.error || r.status}`)
      return { ok: true, remaining: out.remaining }
    }
    if (process.env.BREVO_API_KEY) {
      const r = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ sender: parseFrom(FROM()), to: list.map((email) => ({ email })), subject, htmlContent: html, textContent: text }),
        signal: AbortSignal.timeout(15000),
      })
      if (!r.ok) throw new Error(`Brevo ${r.status}: ${(await r.text()).slice(0, 200)}`)
      return { ok: true }
    }
    if (process.env.RESEND_API_KEY) {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' },
        body: JSON.stringify({ from: FROM(), to: list, subject, html, text }),
        signal: AbortSignal.timeout(15000),
      })
      if (!r.ok) throw new Error(`Resend ${r.status}: ${(await r.text()).slice(0, 200)}`)
      return { ok: true }
    }
    console.log(`[mail] skipped (email not set up): "${subject}" → ${list.join(', ')}`)
    return { skipped: 'not configured' }
  } catch (e) {
    console.error('[mail] failed:', e.message)
    return { error: e.message }
  }
}
