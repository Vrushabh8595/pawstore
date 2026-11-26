// "Use my current location" for checkout: browser GPS → address.
// Reverse geocoding uses OpenStreetMap Nominatim (street-level), with
// BigDataCloud's free client endpoint as a fallback. No API keys needed.

export class LocateError extends Error {}

function position() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new LocateError('Your browser can’t share location. Please type your address.'))
    navigator.geolocation.getCurrentPosition(resolve, (e) => {
      if (e.code === 1) reject(new LocateError('Location access is blocked. Allow location for this site in your browser settings, or type your address.'))
      else if (e.code === 3) reject(new LocateError('Finding your location took too long. Please try again or type your address.'))
      else reject(new LocateError('Couldn’t find your location. Turn on location (GPS) and try again.'))
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 })
  })
}

const clean = (parts) => {
  const out = []
  for (const p of parts.map((x) => (x || '').trim()).filter(Boolean)) if (!out.some((o) => o.toLowerCase() === p.toLowerCase())) out.push(p)
  return out.join(', ')
}
const pin6 = (s) => (String(s || '').replace(/\s/g, '').match(/\d{6}/) || [''])[0]

async function nominatim(lat, lon) {
  const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=en`, { signal: AbortSignal.timeout(10000) })
  if (!r.ok) throw new Error('nominatim ' + r.status)
  const d = await r.json()
  const a = d.address || {}
  return {
    line1: clean([a.house_number && a.road ? `${a.house_number} ${a.road}` : a.house_number, a.building || a.amenity || a.shop, !a.house_number && a.road, a.neighbourhood || a.residential || a.hamlet, a.suburb || a.quarter || a.city_district]),
    city: a.city || a.town || a.village || a.municipality || a.county || a.state_district || '',
    state: a.state || '',
    pincode: pin6(a.postcode),
  }
}

async function bigDataCloud(lat, lon) {
  const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`, { signal: AbortSignal.timeout(10000) })
  if (!r.ok) throw new Error('bdc ' + r.status)
  const d = await r.json()
  return { line1: clean([d.locality]), city: d.city || d.locality || '', state: d.principalSubdivision || '', pincode: pin6(d.postcode) }
}

export async function locateAddress() {
  const pos = await position()
  const { latitude: lat, longitude: lon, accuracy } = pos.coords
  let addr = null
  try { addr = await nominatim(lat, lon) } catch { /* try fallback */ }
  if (!addr || (!addr.city && !addr.pincode)) {
    try { const b = await bigDataCloud(lat, lon); addr = { ...b, ...Object.fromEntries(Object.entries(addr || {}).filter(([, v]) => v)) } } catch { /* ignore */ }
  }
  if (!addr || (!addr.city && !addr.pincode && !addr.line1)) throw new LocateError('We found you on the map but couldn’t read the address. Please type it in.')
  return { ...addr, accuracy: Math.round(accuracy || 0), lat, lon }
}
