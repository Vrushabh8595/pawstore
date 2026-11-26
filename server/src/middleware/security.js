import rateLimit from 'express-rate-limit'

// Strip MongoDB operators ($gt, $where…) and dotted keys from anything the
// client sends, so request data can never turn into a query operator
// (NoSQL injection). Runs on body, query and params.
function clean(value, depth = 0) {
  if (depth > 10 || value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map((v) => clean(v, depth + 1))
  for (const key of Object.keys(value)) {
    if (key.startsWith('$') || key.includes('.') || key === '__proto__' || key === 'constructor' || key === 'prototype') delete value[key]
    else value[key] = clean(value[key], depth + 1)
  }
  return value
}
export function sanitize(req, res, next) {
  if (req.body) clean(req.body)
  if (req.params) clean(req.params)
  if (req.query) {
    // Express 4 lets us mutate req.query in place; also drop array/object query params
    for (const k of Object.keys(req.query)) {
      if (k.startsWith('$') || k.includes('.')) delete req.query[k]
      else if (typeof req.query[k] === 'object') req.query[k] = String([].concat(req.query[k])[0] ?? '')
    }
  }
  next()
}

const limiter = (windowMs, limit, message, extra = {}) =>
  rateLimit({ windowMs, limit, standardHeaders: 'draft-7', legacyHeaders: false, message: { message }, ...extra })

// Whole API: generous ceiling per IP to blunt scraping / floods
export const apiLimiter = limiter(60 * 1000, 300, 'Too many requests. Please slow down and try again in a minute.')
// Login: only failed attempts count, so real users are never locked out
export const loginLimiter = limiter(15 * 60 * 1000, 10, 'Too many failed login attempts. Please wait 15 minutes and try again.', { skipSuccessfulRequests: true })
export const registerLimiter = limiter(60 * 60 * 1000, 10, 'Too many accounts created from this network. Please try again later.')
export const orderLimiter = limiter(15 * 60 * 1000, 15, 'Too many orders in a short time. Please wait a few minutes.')
export const claimLimiter = limiter(15 * 60 * 1000, 20, 'Too many attempts. Please try again later.')
export const trackLimiter = limiter(60 * 1000, 120, 'Too many requests.')
