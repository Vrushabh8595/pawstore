// Tiny fetch wrapper for the AnimalVeda backend API.
// Base URL comes from VITE_API_URL (set on Vercel). Falls back to same-origin.
//
// Auth: the server also sets an httpOnly cookie, but browsers like Safari on
// iPhone block cookies from another domain (vercel.app → onrender.com), so we
// keep the session token and send it as an Authorization header too.
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')
const TOKEN_KEY = 'animalveda-token'

export const authToken = {
  get: () => { try { return localStorage.getItem(TOKEN_KEY) } catch { return null } },
  set: (t) => {
    try {
      if (t) localStorage.setItem(TOKEN_KEY, t)
      else localStorage.removeItem(TOKEN_KEY)
    } catch { /* ignore */ }
  },
}

async function request(path, { method = 'GET', body } = {}) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  const token = authToken.get()
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(BASE + '/api' + path, {
    method,
    credentials: 'include',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data = null
  try { data = text ? JSON.parse(text) : null } catch { /* non-JSON (e.g. host waking up) */ }
  if (!res.ok) {
    const err = new Error((data && data.message) || ('Request failed (' + res.status + ')'))
    err.status = res.status
    throw err
  }
  return data
}

export const api = {
  base: BASE,
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body }),
  patch: (p, body) => request(p, { method: 'PATCH', body }),
  del: (p) => request(p, { method: 'DELETE' }),
}
