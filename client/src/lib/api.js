// Tiny fetch wrapper for the PawStore backend API.
// Base URL comes from VITE_API_URL (set on Vercel). Falls back to same-origin.
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '')

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + '/api' + path, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  const data = text ? JSON.parse(text) : null
  if (!res.ok) throw new Error((data && data.message) || ('Request failed (' + res.status + ')'))
  return data
}

export const api = {
  base: BASE,
  get: (p) => request(p),
  post: (p, body) => request(p, { method: 'POST', body }),
  patch: (p, body) => request(p, { method: 'PATCH', body }),
  del: (p) => request(p, { method: 'DELETE' }),
}
