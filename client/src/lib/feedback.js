// Haptic + sound + visual feedback for cart actions.
// - Vibration API on Android; iOS 18 Safari gets a haptic tick via the
//   hidden <input switch> trick (the only haptic iOS exposes to the web).
// - Sounds are synthesised with Web Audio — no audio files to download.
import { flyToCart } from './flyToCart'

const reduceMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/* ------------------------------- settings -------------------------------- */
const KEY = 'animalveda-sound'
export const soundOn = () => { try { return localStorage.getItem(KEY) !== 'off' } catch { return true } }
export const setSoundOn = (on) => { try { localStorage.setItem(KEY, on ? 'on' : 'off') } catch { /* ignore */ } }

/* -------------------------------- haptics -------------------------------- */
let iosSwitch
function iosTick() {
  if (!iosSwitch) {
    const label = document.createElement('label')
    label.setAttribute('aria-hidden', 'true')
    label.style.cssText = 'position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;overflow:hidden;left:-99px'
    const input = document.createElement('input')
    input.type = 'checkbox'
    input.setAttribute('switch', '')
    input.tabIndex = -1
    label.appendChild(input)
    document.body.appendChild(label)
    iosSwitch = label
  }
  iosSwitch.click()
}
export function haptic(pattern) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern)
    else if (/iP(hone|ad|od)/.test(navigator.userAgent)) iosTick()
  } catch { /* ignore */ }
}

/* --------------------------------- sound --------------------------------- */
let ctx
function audio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}
function tone(ac, { freq, to, start = 0, dur = 0.12, type = 'sine', vol = 0.18 }) {
  const t = ac.currentTime + start
  const o = ac.createOscillator()
  const g = ac.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(ac.destination)
  o.start(t)
  o.stop(t + dur + 0.02)
}
const SOUNDS = {
  // bright two-note "bloop-ding"
  add: (ac) => { tone(ac, { freq: 520, to: 780, dur: 0.09, type: 'triangle' }); tone(ac, { freq: 1040, start: 0.08, dur: 0.22, vol: 0.14 }) },
  // soft single pop going up
  inc: (ac) => tone(ac, { freq: 660, to: 900, dur: 0.08, type: 'triangle', vol: 0.12 }),
  // gentle downward "whoop"
  remove: (ac) => { tone(ac, { freq: 600, to: 260, dur: 0.18, type: 'triangle', vol: 0.14 }) },
  dec: (ac) => tone(ac, { freq: 700, to: 480, dur: 0.08, type: 'triangle', vol: 0.1 }),
  // two short low buzzes = "can't do that"
  limit: (ac) => { tone(ac, { freq: 220, dur: 0.09, type: 'square', vol: 0.06 }); tone(ac, { freq: 196, start: 0.12, dur: 0.12, type: 'square', vol: 0.06 }) },
  success: (ac) => [523, 659, 784, 1047].forEach((f, i) => tone(ac, { freq: f, start: i * 0.07, dur: 0.18, vol: 0.12 })),
}
/* ------------------------- animal sounds (order placed) ------------------------- */
function noiseBuffer(ac, dur) {
  const b = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate)
  const d = b.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  return b
}
// One "woof": a growly voiced tone that drops in pitch, shaped by a mouth
// formant, plus a short breathy burst at the start.
function woof(ac, at, pitch = 1) {
  const t = ac.currentTime + at
  const out = ac.createGain()
  out.gain.setValueAtTime(0.0001, t)
  out.gain.exponentialRampToValueAtTime(0.5, t + 0.02)
  out.gain.exponentialRampToValueAtTime(0.0001, t + 0.26)
  const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.4
  f.frequency.setValueAtTime(900 * pitch, t); f.frequency.exponentialRampToValueAtTime(420 * pitch, t + 0.22)
  const o = ac.createOscillator(); o.type = 'sawtooth'
  o.frequency.setValueAtTime(260 * pitch, t); o.frequency.exponentialRampToValueAtTime(120 * pitch, t + 0.24)
  const o2 = ac.createOscillator(); o2.type = 'square'
  o2.frequency.setValueAtTime(130 * pitch, t); o2.frequency.exponentialRampToValueAtTime(70 * pitch, t + 0.24)
  const g2 = ac.createGain(); g2.gain.value = 0.25
  const n = ac.createBufferSource(); n.buffer = noiseBuffer(ac, 0.1)
  const nf = ac.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 1500; nf.Q.value = 0.8
  const ng = ac.createGain(); ng.gain.setValueAtTime(0.35, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.08)
  o.connect(f); o2.connect(g2).connect(f); f.connect(out)
  n.connect(nf).connect(ng).connect(out)
  out.connect(ac.destination)
  o.start(t); o2.start(t); n.start(t)
  o.stop(t + 0.3); o2.stop(t + 0.3); n.stop(t + 0.1)
}
// "Mee-ow": nasal sawtooth gliding up then down through two vowel formants
function meow(ac, at = 0) {
  const t = ac.currentTime + at
  const o = ac.createOscillator(); o.type = 'sawtooth'
  o.frequency.setValueAtTime(520, t)
  o.frequency.linearRampToValueAtTime(760, t + 0.22)
  o.frequency.linearRampToValueAtTime(610, t + 0.5)
  o.frequency.linearRampToValueAtTime(430, t + 0.8)
  const vib = ac.createOscillator(); vib.frequency.value = 6
  const vg = ac.createGain(); vg.gain.value = 12
  vib.connect(vg).connect(o.frequency)
  const f1 = ac.createBiquadFilter(); f1.type = 'bandpass'; f1.Q.value = 5
  f1.frequency.setValueAtTime(700, t); f1.frequency.linearRampToValueAtTime(1100, t + 0.3); f1.frequency.linearRampToValueAtTime(650, t + 0.8)
  const f2 = ac.createBiquadFilter(); f2.type = 'bandpass'; f2.Q.value = 6
  f2.frequency.setValueAtTime(1800, t); f2.frequency.linearRampToValueAtTime(2300, t + 0.3); f2.frequency.linearRampToValueAtTime(1500, t + 0.8)
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.7, t + 0.08)
  g.gain.setValueAtTime(0.7, t + 0.55)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85)
  o.connect(f1).connect(g); o.connect(f2).connect(g)
  g.connect(ac.destination)
  o.start(t); vib.start(t); o.stop(t + 0.9); vib.stop(t + 0.9)
}
// kind: 'dog' (two happy barks) | 'cat' (a meow)
export function playAnimal(kind = 'dog') {
  if (!soundOn()) return
  try {
    const ac = audio(); if (!ac) return
    if (kind === 'cat') meow(ac)
    else { woof(ac, 0, 1.08); woof(ac, 0.3, 1) }
  } catch { /* ignore */ }
}

export function playSound(name) {
  if (!soundOn()) return
  try { const ac = audio(); if (ac) SOUNDS[name]?.(ac) } catch { /* ignore */ }
}

/* -------------------------------- visuals -------------------------------- */
const BITS = ['🐾', '✚', '●', '🐾', '★', '●']
const COLORS = ['#f8830b', '#1a3450', '#ffa027', '#3d6593', '#e06402']
function burst(el) {
  if (!el || reduceMotion()) return
  const r = el.getBoundingClientRect()
  const cx = r.left + r.width / 2
  const cy = r.top + r.height / 2
  for (let i = 0; i < 12; i++) {
    const s = document.createElement('span')
    s.className = 'burst-bit'
    s.textContent = BITS[i % BITS.length]
    s.style.color = COLORS[i % COLORS.length]
    s.style.left = `${cx - 8}px`
    s.style.top = `${cy - 8}px`
    s.style.fontSize = `${10 + Math.random() * 9}px`
    document.body.appendChild(s)
    const a = (Math.PI * 2 * i) / 12 + Math.random() * 0.4
    const d = 38 + Math.random() * 34
    s.animate(
      [
        { transform: 'translate(0,0) scale(.3) rotate(0deg)', opacity: 1 },
        { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d - 10}px) scale(1) rotate(${(Math.random() - 0.5) * 220}deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(${Math.cos(a) * d * 1.15}px, ${Math.sin(a) * d + 18}px) scale(.6)`, opacity: 0 },
      ],
      { duration: 700 + Math.random() * 250, easing: 'cubic-bezier(.2,.8,.3,1)' }
    ).onfinish = () => s.remove()
  }
}
function floatLabel(el, text, color) {
  if (!el || reduceMotion()) return
  const r = el.getBoundingClientRect()
  const s = document.createElement('span')
  s.className = 'plus-one'
  s.textContent = text
  if (color) s.style.color = color
  s.style.left = `${Math.max(8, Math.min(window.innerWidth - 130, r.left + r.width / 2 - 10))}px`
  s.style.whiteSpace = 'nowrap'
  s.style.top = `${r.top - 6}px`
  document.body.appendChild(s)
  s.animate(
    [{ transform: 'translateY(0) scale(.6)', opacity: 0 }, { transform: 'translateY(-14px) scale(1.15)', opacity: 1, offset: 0.3 }, { transform: 'translateY(-34px) scale(1)', opacity: 0 }],
    { duration: 800, easing: 'ease-out' }
  ).onfinish = () => s.remove()
}

/* ------------------------------- public API ------------------------------- */
// kind: 'add' (first add) | 'inc' | 'dec' | 'remove' | 'limit'
export function cartFeedback(kind, { button, image, imageSrc } = {}) {
  if (kind === 'add') {
    haptic([14, 40, 22])
    playSound('add')
    burst(button)
    flyToCart(image, imageSrc)
  } else if (kind === 'inc') {
    haptic(10)
    playSound('inc')
    floatLabel(button, '+1')
    flyToCart(null)
  } else if (kind === 'dec') {
    haptic(8)
    playSound('dec')
    floatLabel(button, '−1', '#6b6a63')
  } else if (kind === 'limit') {
    haptic([40, 40, 40])
    playSound('limit')
    floatLabel(button, 'Max 7 per order', '#dc2626')
    if (button && !reduceMotion()) button.animate(
      [{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }],
      { duration: 320 })
  } else if (kind === 'remove') {
    haptic([24, 30, 24])
    playSound('remove')
    floatLabel(button, 'Removed', '#6b6a63')
  }
}
