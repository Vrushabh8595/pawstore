// Profile photo with an initials fallback. Only data:image/jpeg|png|webp URLs
// (validated by the server) are ever used as the image source.
const SAFE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/

export const initials = (name) => (name || '?').split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase()

export default function Avatar({ user, size = 44, className = '' }) {
  const src = SAFE.test(user?.avatar || '') ? user.avatar : null
  const style = { width: size, height: size, fontSize: Math.round(size * 0.36) }
  return src ? (
    <img src={src} alt="" style={style} className={`rounded-full object-cover shrink-0 bg-sand-100 ${className}`} />
  ) : (
    <span style={style} className={`grid place-items-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-white font-extrabold shrink-0 ${className}`}>
      {initials(user?.name)}
    </span>
  )
}
