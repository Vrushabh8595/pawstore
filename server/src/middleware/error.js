// Wraps async route handlers so thrown errors reach the error handler.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

export function notFound(req, res) {
  res.status(404).json({ message: 'Route not found' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  // Malformed JSON / bad ids are the client's fault, not a crash
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid request body' })
  if (err.type === 'entity.too.large') return res.status(413).json({ message: 'Request is too large' })
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' })
  if (err.code === 11000) return res.status(409).json({ message: 'That already exists' })
  const status = err.status || err.statusCode || 500
  if (status >= 500) console.error(err)
  // Never leak internal error details (stack, DB messages) to the public
  const expose = status < 500 || process.env.NODE_ENV !== 'production'
  res.status(status).json({ message: expose ? err.message || 'Error' : 'Something went wrong. Please try again.', ...(expose && err.errors ? { errors: err.errors } : {}) })
}

// Validate request body/query against a Zod schema.
export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source])
  if (!result.success) {
    return res.status(400).json({ message: 'Validation failed', errors: result.error.flatten().fieldErrors })
  }
  req[source] = result.data
  next()
}
