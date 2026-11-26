import crypto from 'node:crypto'

// Verifies a Clerk session JWT (RS256) using Clerk's public JWKS — no Clerk
// secret key needed. The Frontend API host comes from the publishable key.
const PK = process.env.CLERK_PUBLISHABLE_KEY || 'pk_test_YWxlcnQtb3J5eC05NDE0LmNsZXJrLmFjY291bnRzLmRldiQ'
const FRONTEND_API = process.env.CLERK_FRONTEND_API ||
  'https://' + Buffer.from(PK.split('_').pop(), 'base64').toString('utf8').replace(/\$$/, '')

let jwks = { keys: [], at: 0 }
async function keyFor(kid) {
  const fresh = Date.now() - jwks.at < 60 * 60 * 1000
  let jwk = fresh && jwks.keys.find((k) => k.kid === kid)
  if (!jwk) {
    const r = await fetch(`${FRONTEND_API}/.well-known/jwks.json`)
    if (!r.ok) throw new Error('Could not load Clerk signing keys')
    jwks = { keys: (await r.json()).keys || [], at: Date.now() }
    jwk = jwks.keys.find((k) => k.kid === kid)
  }
  if (!jwk) throw new Error('Unknown Clerk signing key')
  return crypto.createPublicKey({ key: jwk, format: 'jwk' })
}

const b64json = (s) => JSON.parse(Buffer.from(s, 'base64url').toString('utf8'))

export async function verifyClerkToken(token, allowedOrigins = []) {
  const parts = String(token || '').split('.')
  if (parts.length !== 3) throw new Error('Malformed token')
  const [h, p, sig] = parts
  const header = b64json(h)
  if (header.alg !== 'RS256') throw new Error('Unexpected token algorithm')
  const ok = crypto.verify('RSA-SHA256', Buffer.from(`${h}.${p}`), await keyFor(header.kid), Buffer.from(sig, 'base64url'))
  if (!ok) throw new Error('Invalid token signature')
  const claims = b64json(p)
  const now = Math.floor(Date.now() / 1000)
  const skew = 60
  if (claims.iss !== FRONTEND_API) throw new Error('Token issuer mismatch')
  if (claims.exp && now > claims.exp + skew) throw new Error('Token expired')
  if (claims.nbf && now + skew < claims.nbf) throw new Error('Token not yet valid')
  if (claims.azp && allowedOrigins.length && !allowedOrigins.includes(claims.azp)) throw new Error('Token origin not allowed')
  return claims
}
