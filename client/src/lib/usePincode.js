import { useEffect, useState } from 'react'

// Looks up an Indian PIN code (India Post open API) and returns the city
// (district) and state. Results are cached for the session.
const cache = new Map()

export async function lookupPincode(pin) {
  if (cache.has(pin)) return cache.get(pin)
  const p = fetch(`https://api.postalpincode.in/pincode/${pin}`)
    .then((r) => r.json())
    .then((d) => {
      const po = d?.[0]?.Status === 'Success' ? d[0].PostOffice || [] : []
      if (!po.length) return null
      return { city: po[0].District, state: po[0].State, areas: [...new Set(po.map((x) => x.Name))] }
    })
    .catch(() => undefined) // undefined = lookup unavailable (network), null = not found
  cache.set(pin, p)
  const res = await p
  if (res === undefined) cache.delete(pin) // allow retry
  return res
}

// status: 'idle' | 'loading' | 'found' | 'notfound' | 'error'
export function usePincode(pin, onFound) {
  const [state, setState] = useState({ status: 'idle', data: null })
  useEffect(() => {
    if (!/^\d{6}$/.test(pin || '')) { setState({ status: 'idle', data: null }); return }
    let live = true
    setState({ status: 'loading', data: null })
    lookupPincode(pin).then((data) => {
      if (!live) return
      if (data) { setState({ status: 'found', data }); onFound?.(data) }
      else setState({ status: data === null ? 'notfound' : 'error', data: null })
    })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin])
  return state
}
