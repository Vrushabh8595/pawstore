import { useCallback, useId, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { playSound, haptic } from '@/lib/feedback'

// Shared form field used across the site: red * for required fields,
// "optional" tag for optional ones, and an error message under the field.
export function Field({ label, hint, required, optional, error, value, onChange, prefix, inputRef, name, as = 'input', className = '', ...rest }) {
  const id = useId()
  const Tag = as
  return (
    <div className={`block min-w-0 ${className}`} data-field={name}>
      <label htmlFor={id} className="font-bold text-sm text-ink-900">
        {label}
        {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        {hint && <span className="font-medium text-ink-500"> · {hint}</span>}
        {optional && <span className="font-medium text-ink-500"> · optional</span>}
      </label>
      <span key={error ? `e-${error}` : 'ok'}
        className={`mt-1 flex items-center w-full bg-white border rounded-xl transition ${error
          ? 'border-red-400 ring-2 ring-red-100 animate-shake'
          : 'border-ink-200 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-100'}`}>
        {prefix && <span className="pl-3 pr-1 text-ink-500 font-semibold text-sm shrink-0">{prefix}</span>}
        <Tag id={id} ref={inputRef} name={name} value={value} onChange={(e) => onChange(e.target.value)}
          required={required} aria-required={required || undefined} aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined} {...rest}
          className={`w-full min-w-0 bg-transparent px-3 py-2.5 outline-none rounded-xl ${as === 'textarea' ? 'resize-y' : ''}`} />
      </span>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1 flex items-start gap-1 text-xs font-semibold text-red-600 animate-fade-in">
          <AlertCircle size={13} className="shrink-0 mt-px" />{error}
        </p>
      )}
    </div>
  )
}

// Buzz + vibrate when a form can't be submitted
export function errorFeedback() {
  playSound('error')
  haptic([40, 40, 60])
}

// Per-field errors: validate({ field: 'message' | null, ... }) in visual order.
// Shows every message, plays the error sound and jumps to the first bad field.
export function useFieldErrors() {
  const [errors, setErrors] = useState({})
  const validate = useCallback((rules) => {
    const found = Object.fromEntries(Object.entries(rules).filter(([, m]) => m))
    setErrors(found)
    const first = Object.keys(found)[0]
    if (!first) return true
    errorFeedback()
    requestAnimationFrame(() => {
      const box = document.querySelector(`[data-field="${first}"]`)
      box?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      box?.querySelector('input,textarea,select')?.focus({ preventScroll: true })
    })
    return false
  }, [])
  const clear = useCallback((k) => setErrors((e) => (e[k] ? { ...e, [k]: undefined } : e)), [])
  const setError = useCallback((k, msg) => { setErrors((e) => ({ ...e, [k]: msg })); errorFeedback() }, [])
  return { errors, validate, clear, setError }
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v || '').trim())
