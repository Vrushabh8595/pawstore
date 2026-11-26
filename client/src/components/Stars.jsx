import { Star } from 'lucide-react'

// Read-only star row; supports halves (4.5 → 4 full + 1 half)
export default function Stars({ value = 0, size = 14, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${value} out of 5 stars`} role="img">
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, value - (i - 1)))
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star size={size} className="absolute inset-0 text-ink-200 fill-ink-100" />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star size={size} className="text-amber-400 fill-amber-400" />
              </span>
            )}
          </span>
        )
      })}
    </span>
  )
}
