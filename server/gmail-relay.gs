/**
 * AnimalVeda email relay: sends the store's order emails from your own Gmail.
 * Paste this whole file into a new project at https://script.google.com
 * (signed in as the Gmail that should send the emails), then:
 *   Deploy → New deployment → type "Web app" → Execute as: Me,
 *   Who has access: Anyone → Deploy → Authorize → copy the Web app URL.
 * On Render (pawstore → Environment) add:
 *   MAIL_WEBHOOK_URL    = the Web app URL
 *   MAIL_WEBHOOK_SECRET = the SECRET below (same value)
 */
const SECRET = 'PASTE_YOUR_SECRET_HERE'

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents)
    if (!SECRET || SECRET === 'PASTE_YOUR_SECRET_HERE' || d.secret !== SECRET) return out({ ok: false, error: 'bad secret' })
    const to = [].concat(d.to || []).filter(String).join(',')
    if (!to) return out({ ok: false, error: 'no recipient' })
    MailApp.sendEmail({
      to: to,
      subject: String(d.subject || 'AnimalVeda'),
      htmlBody: d.html || undefined,
      body: d.text || 'Please open this email in an app that shows HTML.',
      name: d.fromName || 'AnimalVeda',
    })
    return out({ ok: true, remaining: MailApp.getRemainingDailyQuota() })
  } catch (err) {
    return out({ ok: false, error: String(err && err.message || err) })
  }
}

function out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)
}
