// Transactional email over HTTPS (Render's free plan blocks SMTP ports).
// Set ONE of these on the server:
//   BREVO_API_KEY  — brevo.com (free 300 emails/day; verify the sender address once)
//   RESEND_API_KEY — resend.com (needs a verified domain to email customers)
// plus MAIL_FROM, e.g. "AnimalVeda <care@animalveda.com>" (a sender verified with the provider).
// Without a key, emails are skipped and logged — the rest of the app keeps working.
const FROM = () => process.env.MAIL_FROM || 'AnimalVeda <gulhanev33@gmail.com>'

function parseFrom(from) {
  const m = /^(.*)<(.+)>$/.exec(from.trim())
  return m ? { name: m[1].trim().replace(/^"|"$/g, ''), email: m[2].trim() } : { name: 'AnimalVeda', email: from.trim() }
}

export function mailEnabled() {
  return !!(process.env.BREVO_API_KEY || process.env.RESEND_API_KEY)
}

export async function sendMail({ to, subject, html, text }) {
  const list = [].concat(to).filter(Boolean)
  if (!list.length) return { skipped: 'no recipient' }
  try {
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
    console.log(`[mail] skipped (no BREVO_API_KEY / RESEND_API_KEY): "${subject}" → ${list.join(', ')}`)
    return { skipped: 'not configured' }
  } catch (e) {
    console.error('[mail] failed:', e.message)
    return { error: e.message }
  }
}
