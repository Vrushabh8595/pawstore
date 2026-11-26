import { z } from 'zod'

// Profile input is checked against strict allow-lists: anything that could be
// HTML, script or a template (<, >, {, }, `, $, quotes in odd places, control
// characters…) is refused outright rather than "cleaned", so nothing a user
// types can ever run in the store or the admin panel.

const NO_CTRL = /^[^\u0000-\u001f\u007f]*$/
const SUSPICIOUS = /(javascript:|vbscript:|data:|on\w+\s*=|<|>|\{\{|\$\{|`)/i

const clean = (s) => s.normalize('NFC').replace(/\s+/g, ' ').trim()

const text = (label, re, min, max, msg) =>
  z.string()
    .transform(clean)
    .refine((v) => v.length >= min, `${label} is too short`)
    .refine((v) => v.length <= max, `${label} is too long`)
    .refine((v) => NO_CTRL.test(v) && !SUSPICIOUS.test(v), `${label} contains characters that aren’t allowed`)
    .refine((v) => re.test(v), msg)

export const nameField = text('Name', /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u, 2, 60, 'Use letters only for your name')
export const phoneField = z.string().trim().regex(/^([6-9]\d{9})?$/, 'Enter a valid 10-digit mobile number')

const optionalText = (label, re, max, msg) =>
  z.string().transform(clean).pipe(z.union([z.literal(''), text(label, re, 2, max, msg)]))

export const addressSchema = z.object({
  line1: text('Address', /^[\p{L}\p{M}\p{N} ,./#()&'’:-]+$/u, 5, 160, 'Use letters, numbers and , . / # - only'),
  landmark: optionalText('Landmark', /^[\p{L}\p{M}\p{N} ,./#()&'’:-]+$/u, 80, 'Use letters, numbers and , . / # - only').optional(),
  city: text('City', /^[\p{L}\p{M} .'-]+$/u, 2, 60, 'Use letters only for the city'),
  state: text('State', /^[\p{L}\p{M} .&'-]+$/u, 2, 60, 'Use letters only for the state'),
  pincode: z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit pincode'),
}).strict()

// Photo: only real JPEG / PNG / WebP bytes, max ~200 KB. SVG and anything
// else is refused (SVG can carry scripts). The file's first bytes must match
// the type it claims to be.
const MAX_AVATAR_BYTES = 200 * 1024
const MAGIC = {
  jpeg: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  png: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  webp: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
}
export function checkAvatar(value) {
  if (value === '') return { ok: true, value: '' } // remove photo
  const m = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)
  if (!m) return { ok: false, message: 'Please choose a JPG, PNG or WebP photo' }
  const bytes = Buffer.from(m[2], 'base64')
  if (bytes.length > MAX_AVATAR_BYTES) return { ok: false, message: 'Photo is too large (max 200 KB)' }
  if (bytes.length < 100 || !MAGIC[m[1]](bytes)) return { ok: false, message: 'That file isn’t a valid image' }
  return { ok: true, value }
}
export const avatarField = z.string().max(300_000, 'Photo is too large (max 200 KB)').superRefine((v, ctx) => {
  const r = checkAvatar(v)
  if (!r.ok) ctx.addIssue({ code: 'custom', message: r.message })
})

// Only these keys may be changed; role, blocked, email, password… are refused (strict).
export const profileSchema = z.object({
  name: nameField.optional(),
  phone: phoneField.optional(),
  avatar: avatarField.optional(),
  address: addressSchema.nullable().optional(),
}).strict()

export const publicUser = (u) => ({
  id: u._id,
  _id: u._id,
  name: u.name,
  email: u.email,
  phone: u.phone || '',
  role: u.role,
  avatar: u.avatar || '',
  provider: u.provider || 'password',
  address: u.addresses?.[0] ? {
    line1: u.addresses[0].line1 || '', landmark: u.addresses[0].landmark || '',
    city: u.addresses[0].city || '', state: u.addresses[0].state || '', pincode: u.addresses[0].pincode || '',
  } : null,
  blocked: !!u.blocked,
  blockedReason: u.blocked ? u.blockedReason || '' : '',
  createdAt: u.createdAt,
})
