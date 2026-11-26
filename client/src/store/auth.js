import { create } from 'zustand'
import { api, authToken } from '@/lib/api'

// Auth backed by the API. The session token is kept in localStorage and sent
// as a Bearer header (Safari on iPhone blocks the cross-site cookie).
//
// The last known user is cached too, so a reload shows the visitor as signed
// in instantly and a slow / sleeping API host never logs anyone out. Only a
// real "not authenticated" answer from the server ends the session — and even
// then, if Google (Clerk) still has a session, we silently sign back in.
//
// `seq` guards against a race: a slow /auth/me check must never overwrite a
// login that finished in the meantime.
const USER_KEY = 'animalveda-user'
const cache = {
  get: () => { try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null') } catch { return null } },
  set: (u) => { try { if (u) localStorage.setItem(USER_KEY, JSON.stringify(u)); else localStorage.removeItem(USER_KEY) } catch { /* ignore */ } },
}
let seq = 0
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const isAuthError = (e) => e?.status === 401 || /Not authenticated|Invalid or expired/i.test(e?.message || '')

// Wait for Clerk to load, then return a fresh session token if Google is still signed in.
async function clerkSessionToken() {
  for (let i = 0; i < 40 && !window.Clerk?.loaded; i++) await sleep(250)
  const session = window.Clerk?.session
  if (!session) return null
  try { return await session.getToken({ skipCache: true }) } catch { return null }
}

const cachedUser = authToken.get() ? cache.get() : null

export const useAuth = create((set, get) => {
  const signedIn = (user, token) => {
    if (token) authToken.set(token)
    cache.set(user)
    seq++
    set({ user, ready: true })
    return user
  }
  const signedOut = () => {
    authToken.set(null)
    cache.set(null)
    set({ user: null, ready: true })
  }

  return {
    user: cachedUser,
    ready: !!cachedUser, // true once we know whether the visitor is logged in

    async init() {
      const mine = ++seq
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          const { user } = await api.get('/auth/me')
          if (mine === seq) { cache.set(user); set({ user, ready: true }) }
          return
        } catch (e) {
          if (mine !== seq) return
          if (isAuthError(e)) {
            // Our session is gone — if Google is still signed in, swap it for a new one.
            const ct = await clerkSessionToken()
            if (ct && mine === seq) {
              try { const res = await api.post('/auth/clerk', { token: ct }); if (mine === seq) signedIn(res.user, res.token); return } catch { /* fall through */ }
            }
            if (mine === seq) signedOut()
            return
          }
          // Network error / host waking up: keep the cached user, try again.
          if (!get().user && !authToken.get()) set({ ready: true })
          await sleep(2000 * (attempt + 1))
        }
      }
      if (mine === seq) set({ ready: true })
    },

    async login({ email, password }) {
      const { user, token } = await api.post('/auth/login', { email, password })
      return signedIn(user, token)
    },

    async register({ name, email, phone, password }) {
      const { user, token } = await api.post('/auth/register', { name, email, phone, password })
      return signedIn(user, token)
    },

    // Exchange a Clerk (Google) session token for our own session
    async loginWithClerk(token) {
      const res = await api.post('/auth/clerk', { token })
      return signedIn(res.user, res.token)
    },

    // After a profile change: keep the store + cached copy in sync
    updateUser(user) {
      if (!user) return
      cache.set(user)
      set({ user })
    },

    async logout() {
      seq++
      try { await api.post('/auth/logout') } catch { /* ignore */ }
      signedOut()
      try { await window.Clerk?.signOut?.() } catch { /* ignore */ }
    },
  }
})

// Wake the API host early (free hosting sleeps when idle) so login feels instant.
let warmed = false
export function warmUpApi() {
  if (warmed) return
  warmed = true
  api.get('/health').catch(() => { warmed = false })
}
