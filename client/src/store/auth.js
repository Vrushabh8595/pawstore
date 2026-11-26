import { create } from 'zustand'
import { api } from '@/lib/api'

// Real auth backed by the API. The session is an httpOnly cookie set by the
// backend, so we don't persist the user in localStorage — we verify via
// GET /auth/me on load instead.
export const useAuth = create((set) => ({
  user: null,
  ready: false, // true once the initial session check has finished

  async init() {
    try {
      const { user } = await api.get('/auth/me')
      set({ user, ready: true })
    } catch {
      set({ user: null, ready: true })
    }
  },

  async login({ email, password }) {
    const { user } = await api.post('/auth/login', { email, password })
    set({ user })
    return user
  },

  async register({ name, email, phone, password }) {
    const { user } = await api.post('/auth/register', { name, email, phone, password })
    set({ user })
    return user
  },

  // Exchange a Clerk (Google) session token for our own session cookie
  async loginWithClerk(token) {
    const { user } = await api.post('/auth/clerk', { token })
    set({ user })
    return user
  },

  async logout() {
    try { await api.post('/auth/logout') } catch {}
    try { await window.Clerk?.signOut?.() } catch {}
    set({ user: null })
  },
}))
