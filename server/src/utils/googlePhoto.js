import { bytesToDataUrl, MAX_THUMB_BYTES } from './profile.js'

// Downloads a customer's Google profile photo (via Clerk's image URL) and
// returns it as validated data URLs we can store: a 256px photo and a 64px
// thumbnail. Only Clerk / Google image hosts are allowed, over HTTPS, so this
// can't be used to make the server fetch anything else.
const ALLOWED_HOSTS = ['img.clerk.com', 'images.clerk.dev', 'lh3.googleusercontent.com']

function safeUrl(raw) {
  try {
    const u = new URL(String(raw || ''))
    if (u.protocol !== 'https:' || !ALLOWED_HOSTS.includes(u.hostname) || u.username || u.password || u.port) return null
    return u
  } catch { return null }
}

// Clerk's image proxy resizes on request; Google photo URLs end in "=s96-c" style sizes.
function sized(u, px) {
  const s = new URL(u)
  if (s.hostname === 'img.clerk.com' || s.hostname === 'images.clerk.dev') {
    s.search = new URLSearchParams({ width: String(px), height: String(px), fit: 'crop', quality: '85' }).toString()
  } else if (s.hostname === 'lh3.googleusercontent.com') {
    s.pathname = s.pathname.replace(/=s\d+(-c)?$/, '') + `=s${px}-c`
  }
  return s.toString()
}

async function download(url, maxBytes) {
  const r = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(6000), headers: { accept: 'image/jpeg,image/png,image/webp' } })
  if (!r.ok) return null
  const len = Number(r.headers.get('content-length') || 0)
  if (len && len > maxBytes) return null
  const buf = Buffer.from(await r.arrayBuffer())
  return bytesToDataUrl(buf, maxBytes)
}

export const isAllowedPhotoUrl = (raw) => !!safeUrl(raw)

export async function fetchGooglePhoto(raw) {
  const u = safeUrl(raw)
  if (!u) return null
  try {
    const [avatar, thumb] = await Promise.all([
      download(sized(u, 256), 200 * 1024).catch(() => null),
      download(sized(u, 64), MAX_THUMB_BYTES).catch(() => null),
    ])
    if (!avatar) return null
    return { avatar, avatarThumb: thumb || undefined }
  } catch {
    return null
  }
}
