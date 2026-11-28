import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronLeft, ChevronRight, PawPrint } from 'lucide-react'

const SLIDES = [
  {
    eyebrow: 'Everyday nutrition', title: ['Food they’ll', 'wag', 'for.'], sub: 'Vet-approved meals made with real meat, first.',
    cta: 'Shop dry food', to: '/category/dry-food', price: 'From ₹236', sticker: ['Up to', '20%', 'OFF'],
    theme: { bg: 'bg-pine-800', text: 'text-white', sub: 'text-white/75', hi: 'text-brand-400', arch: 'bg-brand-400', ring: 'border-white/25', chip: 'bg-white/10 text-white ring-white/20', sticker: 'bg-brand-400 text-ink-900', blob: 'bg-pine-600' },
    img: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=1000&q=70',
  },
  {
    eyebrow: 'For your fur baby', title: ['Love your', 'baby?', 'So do we.'], sub: 'The best for their health, made with love.',
    cta: 'Shop baby’s health', to: '/category/health', price: 'Vet-approved care', sticker: ['Made with', 'LOVE', 'for babies'],
    theme: { bg: 'bg-gradient-to-br from-[#dff0fb] via-[#eef6fc] to-[#fff1e2]', text: 'text-ink-900', sub: 'text-ink-700', hi: 'text-brand-600', arch: 'bg-pine-800', ring: 'border-brand-300', chip: 'bg-white text-pine-800 ring-brand-200', sticker: 'bg-pine-800 text-white', blob: 'bg-brand-100' },
    img: 'https://images.unsplash.com/photo-1617895153857-82fe79adfcd4?auto=format&fit=crop&crop=faces,center&w=1000&q=75',
    imgAlt: 'Siberian husky puppy with bright blue eyes',
  },
  {
    eyebrow: 'Treats & rewards', title: ['Good pups', 'deserve', 'more.'], sub: 'Tasty, healthy and tail-wag approved treats.',
    cta: 'Shop treats', to: '/category/treats', price: 'From ₹99', sticker: ['Use', 'WAGGY10', 'for 10% off'],
    theme: { bg: 'bg-brand-500', text: 'text-white', sub: 'text-white/85', hi: 'text-ink-900', arch: 'bg-brand-200', ring: 'border-white/35', chip: 'bg-white/15 text-white ring-white/25', sticker: 'bg-ink-900 text-white', blob: 'bg-brand-400' },
    img: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=1000&q=70',
  },
  {
    eyebrow: 'Cats, dogs & every animal', title: ['Care for', 'every', 'paw.'], sub: 'Medicines & food for cats, dogs and every animal.',
    cta: 'Shop health', to: '/category/health', price: 'Or request any medicine →', sticker: ['Send a', 'PHOTO', 'we source it'],
    theme: { bg: 'bg-gradient-to-br from-[#e4f4ec] via-[#f1f8f2] to-[#fff3e3]', text: 'text-ink-900', sub: 'text-ink-700', hi: 'text-pine-600', arch: 'bg-[#cfe9dc]', ring: 'border-pine-400/40', chip: 'bg-white text-ink-900 ring-ink-200', sticker: 'bg-pine-600 text-white', blob: 'bg-brand-100' },
    img: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&crop=faces,center&w=1000&q=72',
    imgAlt: 'Tabby cat looking up',
  },
]

const DURATION = 5.5 // seconds per slide

export default function HeroCarousel() {
  const [slide, setSlide] = useState(0)
  const [cycle, setCycle] = useState(0)   // bumps to restart the autoplay timer
  const [hover, setHover] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [drag, setDrag] = useState(0)
  const g = useRef({ id: null, x: 0, y: 0, t: 0, axis: null, dx: 0 })
  const lastManual = useRef(0)
  const moved = useRef(false)
  const n = SLIDES.length

  // Any manual change restarts the timer so autoplay never fires mid-gesture
  const go = (i, manual = true) => {
    setSlide(((i % n) + n) % n)
    if (manual) { lastManual.current = Date.now(); setCycle((c) => c + 1) }
  }
  const onAuto = () => {
    if (dragging || Date.now() - lastManual.current < 800) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    go(slide + 1, false)
  }

  // Swipe: lock to an axis after 8px so vertical page scrolling is never hijacked
  const down = (e) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    g.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), axis: null, dx: 0 }
    moved.current = false
  }
  const move = (e) => {
    const s = g.current
    if (s.id !== e.pointerId) return
    const dx = e.clientX - s.x
    const dy = e.clientY - s.y
    if (!s.axis) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      s.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
      if (s.axis === 'x') { setDragging(true); e.currentTarget.setPointerCapture?.(e.pointerId) }
    }
    if (s.axis !== 'x') return
    s.dx = dx
    moved.current = true
    setDrag(dx)
  }
  const up = (e) => {
    const s = g.current
    if (s.id !== e.pointerId) return
    if (s.axis === 'x') {
      const w = e.currentTarget.clientWidth || 1
      const v = s.dx / Math.max(1, performance.now() - s.t) // px per ms
      if (s.dx < -w * 0.18 || v < -0.45) go(slide + 1)
      else if (s.dx > w * 0.18 || v > 0.45) go(slide - 1)
      else { lastManual.current = Date.now(); setCycle((c) => c + 1) } // snap back, restart timer
    }
    g.current = { id: null, x: 0, y: 0, t: 0, axis: null, dx: 0 }
    setDrag(0)
    setDragging(false)
  }

  const paused = hover || dragging

  return (
    <section className={`relative overflow-hidden pt-3 sm:pt-5 ${paused ? 'hero-paused' : ''}`}
      aria-roledescription="carousel" aria-label="Featured offers"
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setHover(false)}>
      <div className="container-x">
        <div
          className="flex gap-3 sm:gap-5 touch-pan-y select-none [--w:100%] [--g:.75rem] sm:[--g:1.25rem]"
          style={{
            // One full-width slide at a time on every screen size
            transform: `translateX(calc(${-slide} * (var(--w) + var(--g)) + ${drag}px))`,
            transition: dragging ? 'none' : 'transform .55s cubic-bezier(.22,1,.36,1)',
          }}
          onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
          onDragStart={(e) => e.preventDefault()}
          onClickCapture={(e) => { if (moved.current) { e.preventDefault(); e.stopPropagation(); moved.current = false } }}>
          {SLIDES.map((s, i) => {
            const t = s.theme
            const active = i === slide
            return (
              <div key={i} aria-hidden={!active} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${n}`}
                className={`hero-slide ${active ? 'is-active' : ''} relative shrink-0 basis-[var(--w)] overflow-hidden rounded-[1.75rem] sm:rounded-[2.25rem] ${t.bg} ${t.text}
                  h-[420px] sm:h-[400px] lg:h-[460px] transition-[opacity,transform] duration-500 ${active ? 'opacity-100' : 'opacity-0 scale-[.97]'}`}>
                {/* Decorations */}
                <span aria-hidden="true" className={`absolute -left-16 -bottom-24 w-64 h-64 rounded-full ${t.blob} opacity-60`} />
                <span aria-hidden="true" className={`absolute left-[44%] top-8 w-24 h-24 rounded-full border-2 border-dashed ${t.ring} animate-spin-slow hidden sm:block`} />
                <PawPrint aria-hidden="true" className="absolute left-[38%] bottom-10 opacity-15 rotate-[-20deg] hidden sm:block" size={54} />
                <PawPrint aria-hidden="true" className="absolute right-5 top-5 opacity-15 rotate-12 sm:hidden" size={34} />

                {/* Arch image */}
                <div className="absolute right-0 bottom-0 w-[64%] h-[54%] sm:w-[48%] sm:h-[92%] sm:right-[4%]">
                  <div className={`absolute inset-0 rounded-t-full ${t.arch}`} />
                  <div className="absolute inset-[6px] bottom-0 rounded-t-full overflow-hidden">
                    <img src={s.img} alt={s.imgAlt || ""} draggable="false" loading={i === 0 ? 'eager' : 'lazy'}
                      className="hero-img w-full h-full object-cover" />
                  </div>
                  {/* Sticker */}
                  <div style={{ '--r': '-10deg' }}
                    className={`reveal reveal-4 animate-float absolute right-0 -top-5 sm:-right-4 sm:top-[10%] w-[74px] h-[74px] sm:w-28 sm:h-28 rounded-full grid place-items-center text-center leading-none shadow-xl ring-4 ring-white/30 ${t.sticker}`}>
                    <div>
                      <p className="text-[8px] sm:text-[11px] font-bold uppercase tracking-wider opacity-85">{s.sticker[0]}</p>
                      <p className="font-display font-bold text-sm sm:text-2xl my-0.5">{s.sticker[1]}</p>
                      <p className="text-[8px] sm:text-[10px] font-bold uppercase tracking-wide opacity-85">{s.sticker[2]}</p>
                    </div>
                  </div>
                </div>

                {/* Copy */}
                <div className="relative h-full flex flex-col p-5 sm:p-10 lg:p-14 sm:justify-center sm:max-w-[54%]">
                  <span className={`reveal reveal-1 w-fit inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-extrabold uppercase tracking-[.14em] px-3 py-1.5 rounded-full ring-1 ${t.chip}`}>
                    <PawPrint size={12} /> {s.eyebrow}
                  </span>
                  <h2 className="reveal reveal-2 font-display font-semibold leading-[.98] mt-3 sm:mt-5 text-[2.15rem] min-[360px]:text-[2.5rem] sm:text-6xl lg:text-7xl tracking-tight">
                    {s.title[0]}<br />
                    <span className={`italic ${t.hi}`}>{s.title[1]}</span> {s.title[2]}
                  </h2>
                  <p className={`reveal reveal-3 mt-3 text-sm sm:text-lg max-w-[15rem] sm:max-w-sm hidden min-[360px]:line-clamp-3 sm:line-clamp-none ${t.sub}`}>{s.sub}</p>
                  <div className="reveal reveal-4 mt-auto sm:mt-7 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 w-fit">
                    <Link to={s.to} tabIndex={active ? 0 : -1} draggable="false"
                      className="group inline-flex items-center gap-2 bg-white text-ink-900 font-extrabold text-sm sm:text-base pl-5 pr-2 py-2 rounded-full shadow-lg hover:shadow-xl active:scale-95 transition">
                      {s.cta}
                      <span className="grid place-items-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-brand-500 text-white group-hover:translate-x-1 transition"><ArrowRight size={17} /></span>
                    </Link>
                    <span className={`text-xs sm:text-sm font-bold ${t.sub}`}>{s.price}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-3 sm:mt-4">
          <div className="flex-1 flex gap-1.5 sm:max-w-sm">
            {SLIDES.map((_, i) => (
              <button key={i} onClick={() => go(i)} aria-label={`Go to slide ${i + 1}`} aria-current={i === slide}
                className="relative h-1.5 flex-1 rounded-full bg-ink-200 overflow-hidden before:absolute before:-inset-y-3 before:inset-x-0 before:content-['']">
                {i < slide && <span className="absolute inset-0 bg-brand-500" />}
                {i === slide && (
                  <span key={`${slide}-${cycle}`} className="hero-progress absolute inset-0 bg-brand-500"
                    style={{ '--dur': `${DURATION}s` }} onAnimationEnd={onAuto} />
                )}
              </button>
            ))}
          </div>
          <div className="hidden sm:flex gap-2 ml-auto">
            <button onClick={() => go(slide - 1)} aria-label="Previous slide"
              className="w-10 h-10 grid place-items-center rounded-full bg-white ring-1 ring-ink-200 hover:ring-brand-400 hover:text-brand-600 active:scale-90 transition"><ChevronLeft size={20} /></button>
            <button onClick={() => go(slide + 1)} aria-label="Next slide"
              className="w-10 h-10 grid place-items-center rounded-full bg-ink-900 text-white hover:bg-brand-500 active:scale-90 transition"><ChevronRight size={20} /></button>
          </div>
        </div>

        {/* Trust strip */}
        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar -mx-[1.1rem] px-[1.1rem] lg:hidden">
          {[['🚚', 'Free delivery ₹999+'], ['💵', 'COD available'], ['✅', 'Vet approved'], ['↩️', '7-day returns']].map(([e, l]) => (
            <span key={l} className="shrink-0 inline-flex items-center gap-1.5 text-[11px] font-bold text-ink-700 bg-white ring-1 ring-ink-100 rounded-full px-3 py-1.5">{e} {l}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
