// Same allow-lists the server enforces. The server is the real guard; these
// just give instant, friendly messages.
export const BAD = /(javascript:|vbscript:|data:|on\w+\s*=|<|>|\{\{|\$\{|`)/i
export const RX = {
  name: /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u,
  line: /^[\p{L}\p{M}\p{N} ,./#()&'’:-]+$/u,
  place: /^[\p{L}\p{M} .&'-]+$/u,
}
export const textError = (v, label, re, min, max, msg) => {
  const s = String(v || '').replace(/\s+/g, ' ').trim()
  if (s.length < min) return min > 1 ? `Enter your ${label.toLowerCase()}.` : null
  if (s.length > max) return `${label} is too long.`
  if (BAD.test(s) || /[\u0000-\u001f\u007f]/.test(s)) return `${label} contains characters that aren’t allowed.`
  if (!re.test(s)) return msg
  return null
}
export const phoneError = (v, required = true) =>
  !v ? (required ? 'Enter a 10-digit mobile number.' : null) : !/^[6-9]\d{9}$/.test(v) ? 'Enter a valid 10-digit mobile number.' : null
