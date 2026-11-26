import { useState } from 'react'
import { Syringe, Stethoscope, Bath, HeartPulse, Loader2, Check, Home as HomeIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/store/auth'
import { Field, useFieldErrors, errorFeedback } from './FormField'
import { playSound, haptic } from '@/lib/feedback'

const SERVICES = [
  [Syringe, 'Vaccinations at home', 'On time, every time, without the clinic stress'],
  [Stethoscope, 'Health check-ups', 'A gentle vet visit in their favourite corner'],
  [Bath, 'Grooming & hygiene', 'Baths, nails and ears, done with patience'],
  [HeartPulse, 'Care for every animal', 'Cats, dogs, cows, goats and more'],
]

// "Coming soon" section: doorstep pet care & vaccination, with a waitlist form
// (saved as a request, so it shows up in Admin → Requests).
export default function DoorstepCare() {
  const user = useAuth((s) => s.user)
  const [f, setF] = useState({ name: user?.name || '', phone: user?.phone || '', city: '', animal: 'Dog' })
  const [state, setState] = useState('idle') // idle | busy | done
  const [err, setErr] = useState('')
  const fe = useFieldErrors()
  const set = (k) => (v) => { setF((s) => ({ ...s, [k]: v })); fe.clear(k) }

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!fe.validate({
      name: !f.name.trim() ? 'Please tell us your name.' : null,
      phone: !/^[6-9]\d{9}$/.test(f.phone) ? 'Enter a valid 10-digit mobile number.' : null,
    })) return
    setState('busy')
    try {
      await api.post('/requests', {
        need: 'Doorstep care waitlist', product: 'Doorstep pet care & vaccination (early access)',
        animal: f.animal, name: f.name.trim(), phone: f.phone, city: f.city.trim(), contactVia: 'Call',
        details: 'Wants to be told first when doorstep pet care and home vaccination launch.',
      })
      setState('done')
      playSound('success'); haptic([30, 50, 30])
    } catch (e2) {
      setState('idle'); setErr(e2.message || 'Couldn’t save that. Please try again.'); errorFeedback()
    }
  }

  return (
    <section className="container-x py-10 sm:py-14" aria-labelledby="doorstep-title">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#fff4e8] via-white to-[#eaf4ef] ring-1 ring-brand-100 grid lg:grid-cols-[1.05fr_1fr]">
        {/* photo */}
        <div className="relative min-h-[240px] sm:min-h-[320px] lg:min-h-full">
          <img src="https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?auto=format&fit=crop&w=1100&q=72" alt="A caring vet gently holding a cat" loading="lazy"
            className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-pine-900/70 via-pine-900/10 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-white/0" />
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-brand-500 text-white text-xs font-extrabold uppercase tracking-wider px-3 py-1.5 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Coming soon
          </span>
          <p className="absolute left-4 right-4 bottom-4 text-white font-display text-lg sm:text-xl leading-snug lg:hidden">
            “Home is where their heart is. Soon, so is their vet.”
          </p>
        </div>

        {/* copy */}
        <div className="p-5 sm:p-9">
          <p className="eyebrow mb-2 inline-flex items-center gap-1.5"><HomeIcon size={14} /> Pet care & vaccination at your doorstep</p>
          <h2 id="doorstep-title" className="font-display text-2xl sm:text-4xl font-semibold leading-tight text-ink-900">
            They’d never leave your side. <span className="text-brand-600">Soon, we’ll come to theirs.</span>
          </h2>
          <p className="text-ink-700 mt-3 leading-relaxed">
            They wait at the door every evening. They curl up beside you when you’re unwell. They love you without a single condition.
            Very soon, AnimalVeda will bring that love back home to them: gentle check-ups, grooming and vaccinations by caring, trained hands,
            right where they feel safest. No scary car rides, no crowded waiting rooms. Just home, and you beside them.
          </p>

          <ul className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2.5 mt-5">
            {SERVICES.map(([Icon, h, s]) => (
              <li key={h} className="flex gap-3 rounded-2xl bg-white/80 ring-1 ring-ink-100 p-3">
                <span className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 grid place-items-center shrink-0"><Icon size={19} /></span>
                <span className="min-w-0"><b className="block text-sm text-ink-900">{h}</b><span className="block text-xs text-ink-500 mt-0.5">{s}</span></span>
              </li>
            ))}
          </ul>

          {state === 'done' ? (
            <div role="status" className="mt-6 rounded-2xl bg-green-50 ring-1 ring-green-200 p-4 flex gap-3 animate-fade-in">
              <span className="w-10 h-10 rounded-full bg-green-500 text-white grid place-items-center shrink-0"><Check size={20} /></span>
              <p className="text-sm text-green-900"><b>You’re on the early list, {f.name.split(' ')[0]}! 🐾</b><br />We’ll call you first when doorstep care starts in your area. Give your {f.animal.toLowerCase()} a cuddle from us.</p>
            </div>
          ) : (
            <form onSubmit={submit} noValidate className="mt-6 rounded-2xl bg-white ring-1 ring-ink-100 p-4 shadow-sm">
              <p className="font-bold text-ink-900">Be the first to know when we launch</p>
              <p className="text-xs text-ink-500 mb-3">Early families get their first home visit at a special price.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field name="name" required error={fe.errors.name} label="Your name" autoComplete="name" value={f.name} onChange={set('name')} />
                <Field name="phone" required error={fe.errors.phone} label="Phone" prefix="+91" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel-national"
                  value={f.phone} onChange={(v) => set('phone')(v.replace(/\D/g, '').slice(0, 10))} />
                <Field name="city" optional label="City" autoComplete="address-level2" value={f.city} onChange={set('city')} />
                <div className="min-w-0">
                  <span className="font-bold text-sm text-ink-900">Your companion</span>
                  <div className="mt-1 grid grid-cols-4 gap-1.5">
                    {[['Dog', '🐶'], ['Cat', '🐱'], ['Cow', '🐄'], ['Other', '🐾']].map(([a, e]) => (
                      <button key={a} type="button" onClick={() => set('animal')(a)} aria-pressed={f.animal === a}
                        className={`rounded-xl py-2 text-[11px] font-bold border-[1.5px] transition active:scale-95 ${f.animal === a ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-100 bg-white text-ink-700'}`}>
                        <span className="block text-lg leading-none">{e}</span>{a}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {err && <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{err}</p>}
              <button type="submit" disabled={state === 'busy'} className="btn-primary w-full mt-4 disabled:opacity-70">
                {state === 'busy' ? <Loader2 size={17} className="animate-spin" /> : '💛'} Notify me first
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
