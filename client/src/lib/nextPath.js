// Where to send someone after they log in (e.g. back to the product they were reviewing).
// Only same-site paths are accepted, so this can't be abused to redirect off-site.
const KEY = 'animalveda-next'
const safe = (p) => (typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') && !p.startsWith('/\\') ? p : null)

export function rememberNext(search) {
  try { const p = safe(new URLSearchParams(search).get('next')); if (p) sessionStorage.setItem(KEY, p) } catch { /* ignore */ }
}
export function afterLoginPath(user) {
  if (user?.role === 'admin') return '/admin'
  if (user?.role === 'author') return '/author'
  try { const p = safe(sessionStorage.getItem(KEY)); sessionStorage.removeItem(KEY); if (p) return p } catch { /* ignore */ }
  return '/account'
}
