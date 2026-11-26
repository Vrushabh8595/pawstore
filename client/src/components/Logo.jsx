// AnimalVeda logo — an icon-only mark (no wordmark): white paw with a navy
// medical cross on a warm orange disc, finished with a soft inner ring.
// The brand name stays available to screen readers and search engines.
let uid = 0
export function LogoMark({ size = 40, className = '', title = 'AnimalVeda' }) {
  const id = `avg${++uid}`
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id={id} x1="8" y1="4" x2="40" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffab3d" />
          <stop offset=".55" stopColor="#f8830b" />
          <stop offset="1" stopColor="#d85f02" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="24" fill={`url(#${id})`} />
      <circle cx="24" cy="24" r="21.2" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="1.2" />
      <g fill="#fff">
        <ellipse cx="13.4" cy="20.2" rx="3.3" ry="4.3" transform="rotate(-24 13.4 20.2)" />
        <ellipse cx="19.6" cy="13.6" rx="3.5" ry="4.7" transform="rotate(-8 19.6 13.6)" />
        <ellipse cx="28.4" cy="13.6" rx="3.5" ry="4.7" transform="rotate(8 28.4 13.6)" />
        <ellipse cx="34.6" cy="20.2" rx="3.3" ry="4.3" transform="rotate(24 34.6 20.2)" />
        <path d="M24 20.6c5.4 0 10.6 6 10.6 11 0 3.6-2.7 5.4-5.8 5.4-1.9 0-3.1-.9-4.8-.9s-2.9.9-4.8.9c-3.1 0-5.8-1.8-5.8-5.4 0-5 5.2-11 10.6-11z" />
      </g>
      <g fill="#1a3450">
        <rect x="22.6" y="25.3" width="2.8" height="8.6" rx="1" />
        <rect x="19.7" y="28.2" width="8.6" height="2.8" rx="1" />
      </g>
    </svg>
  )
}

// Full logo = an image (public/logo.svg) with the "AnimalVeda" name drawn as
// vector outlines — it's a picture, not live text, so it looks identical everywhere.
// `light` uses white lettering for dark backgrounds.
export default function Logo({ light = false, className = 'h-8 sm:h-10' }) {
  return (
    <img src={light ? '/logo-light.svg' : '/logo.svg'} alt="AnimalVeda" width="245" height="48"
      className={`w-auto select-none ${className}`} draggable="false" />
  )
}
