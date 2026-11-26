import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from './api'

// Lightweight first-party analytics: one anonymous visitor id per browser,
// a "view" per page and a heartbeat every 45s while the tab is visible
// (powers the admin "live users" and traffic reports). No cookies, no 3rd parties.
const KEY = 'animalveda-sid'
function sid() {
  try {
    let v = localStorage.getItem(KEY)
    if (!v) { v = (crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36)); localStorage.setItem(KEY, v) }
    return v
  } catch { return 'nostorage-' + Math.random().toString(36).slice(2, 12) }
}
const send = (type, path) => api.post('/store/track', { sid: sid(), type, path, ref: type === 'view' ? document.referrer : '' }).catch(() => {})

export function useTracking() {
  const { pathname } = useLocation()
  useEffect(() => {
    if (pathname.startsWith('/admin')) return
    send('view', pathname)
  }, [pathname])
  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === 'visible') send('ping', window.location.pathname) }, 45000)
    const onVis = () => { if (document.visibilityState === 'visible') send('ping', window.location.pathname) }
    document.addEventListener('visibilitychange', onVis)
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis) }
  }, [])
}
