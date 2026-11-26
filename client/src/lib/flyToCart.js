// Animates a product thumbnail from the clicked card to the visible cart icon,
// then bumps the icon. Any element with [data-cart-target] can receive it.
export function flyToCart(sourceEl, imgSrc) {
  const targets = [...document.querySelectorAll('[data-cart-target]')]
  const target = targets.find((t) => t.offsetParent !== null && t.getBoundingClientRect().width > 0)
  const bump = () => {
    if (!target) return
    target.classList.remove('animate-bump')
    void target.offsetWidth
    target.classList.add('animate-bump')
  }
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!sourceEl || !target || reduce || !imgSrc) return bump()

  const s = sourceEl.getBoundingClientRect()
  const t = target.getBoundingClientRect()
  const size = Math.min(s.width, s.height, 120)
  const img = document.createElement('img')
  img.src = imgSrc
  img.className = 'fly-dot'
  Object.assign(img.style, {
    width: `${size}px`, height: `${size}px`,
    left: `${s.left + s.width / 2 - size / 2}px`, top: `${s.top + s.height / 2 - size / 2}px`,
  })
  document.body.appendChild(img)
  const dx = t.left + t.width / 2 - (s.left + s.width / 2)
  const dy = t.top + t.height / 2 - (s.top + s.height / 2)
  const anim = img.animate(
    [
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 70}px) scale(.6)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(.12)`, opacity: 0.6 },
    ],
    { duration: 750, easing: 'cubic-bezier(.5,-0.1,.6,1)' }
  )
  anim.onfinish = () => { img.remove(); bump() }
}
