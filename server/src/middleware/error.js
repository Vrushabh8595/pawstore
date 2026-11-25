// Wraps async route handlers so thrown errors reach the error handler.
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)

export function notFound(req, res) {
  res.status(404).json({ message: 'Route not found' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const status = err.status || 500
  if (status === 500) console.error(err)
  res.status(status).json({ message: err.message || 'Server error', errors: err.errors })
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
