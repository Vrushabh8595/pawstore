import { create } from 'zustand'
import { api, authToken } from '@/lib/api'

// Real auth backed by the API. The session is an httpOnly cookie set by the
// backend, so we don't persist the user in localStorage — we verify via
// GET /auth/me on load instead.
//
// `seq` guards against a race: the first-load /auth/me check can be slow (the
// API host may be waking up) and must never overwrite a login that finished
// in the meantime (e.g. returning from Google sign-in).
let seq = 0

export const useAuth = create((set) => ({
  user: null,
  ready: false, // true once we know whether the visitor is logged in

  async init() {
    const mine = ++seq
    try {
      const { user } = await api.get('/auth/me')
      if (mine === seq) set({ user, ready: true })
    } catch (e) {
      if (/401|Not authenticated|Invalid or expired/i.test(e.message)) authToken.set(null)
      if (mine === seq) set({ user: null, ready: true })
    }
  },

  async login({ email, password }) {
    const { user, token } = await api.post('/auth/login', { email, password })
    authToken.set(token)
    seq++
    set({ user, ready: true })
    return user
  },

  async register({ name, email, phone, password }) {
    const { user, token } = await api.post('/auth/register', { name, email, phone, password })
    authToken.set(token)
    seq++
    set({ user, ready: true })
    return user
  },

  // Exchange a Clerk (Google) session token for our own session cookie
  async loginWithClerk(token) {
    const res = await api.post('/auth/clerk', { token })
    authToken.set(res.token)
    const user = res.user
    seq++
    set({ user, ready: true })
    return user
  },

  async logout() {
    seq++
    set({ user: null, ready: true })
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    authToken.set(null)
    try { await window.Clerk?.signOut?.() } catch { /* ignore */ }
  },
}))

// Wake the API host early (free hosting sleeps when idle) so login feels instant.
let warmed = false
export function warmUpApi() {
  if (warmed) return
  warmed = true
  api.get('/health').catch(() => { warmed = false })
}
