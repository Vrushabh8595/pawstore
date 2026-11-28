import { Syringe, Stethoscope, Bath, HeartPulse, Home as HomeIcon } from 'lucide-react'

const SERVICES = [
  [Syringe, 'Vaccinations at home'],
  [Stethoscope, 'Health check-ups'],
  [Bath, 'Grooming & hygiene'],
  [HeartPulse, 'Care for every animal'],
]

// Compact "coming soon" teaser for doorstep pet care & vaccination
export default function DoorstepCare() {
  return (
    <section className="container-x py-8 sm:py-10" aria-labelledby="doorstep-title">
      <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[#fff4e8] via-white to-[#eaf4ef] ring-1 ring-brand-100 grid sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="relative h-48 sm:h-auto">
          {/* Photo: Pexels (free licence) */}
          <img src="https://images.pexels.com/photos/8406574/pexels-photo-8406574.jpeg?auto=compress&cs=tinysrgb&w=1000" alt="A young woman cuddling her Siberian husky at home" loading="lazy"
            className="absolute inset-0 w-full h-full object-cover object-[55%_40%]" />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-brand-500 text-white text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-1 shadow-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Coming soon
          </span>
        </div>
        <div className="p-5 sm:p-7">
          <p className="eyebrow mb-1.5 inline-flex items-center gap-1.5"><HomeIcon size={14} /> Pet care at your doorstep</p>
          <h2 id="doorstep-title" className="font-display text-xl sm:text-3xl font-semibold leading-tight text-ink-900">
            They’d never leave your side. <span className="text-brand-600">Soon, we’ll come to theirs.</span>
          </h2>
          <p className="text-ink-700 text-sm sm:text-base mt-2 leading-relaxed">
            Gentle vet visits and vaccinations at home, where they feel safest. No scary car rides, just love and care at your door.
          </p>
          <ul className="flex flex-wrap gap-2 mt-4">
            {SERVICES.map(([Icon, label]) => (
              <li key={label} className="inline-flex items-center gap-1.5 rounded-full bg-white ring-1 ring-ink-100 px-3 py-1.5 text-xs sm:text-sm font-semibold text-ink-900">
                <Icon size={15} className="text-brand-600" /> {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
