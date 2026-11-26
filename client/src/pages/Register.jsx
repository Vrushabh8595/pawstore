import Logo from '@/components/Logo'
import GoogleButton, { OrDivider } from '@/components/GoogleButton'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth, warmUpApi } from '@/store/auth'
import { Field, useFieldErrors, errorFeedback, isEmail } from '@/components/FormField'
import { AlertCircle } from 'lucide-react'

export default function Register() {
  const register = useAuth((s) => s.register)
  const nav = useNavigate()
  useEffect(() => { warmUpApi() }, [])
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [err, setErr] = useState('')
  const fe = useFieldErrors()
  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); fe.clear(k) }

  const [busy, setBusy] = useState(false)

  const signedIn = useAuth((s) => s.user)
  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!fe.validate({
      name: form.name.trim().length < 2 ? 'Enter your full name.' : null,
      email: !form.email.trim() ? 'Enter your email.' : !isEmail(form.email) ? 'This email doesn’t look right (e.g. name@gmail.com).' : null,
      phone: form.phone && !/^[6-9]\d{9}$/.test(form.phone) ? 'Enter a valid 10-digit mobile number, or leave it empty.' : null,
      password: !form.password ? 'Create a password.' : form.password.length < 6 ? 'Use at least 6 characters.' : null,
    })) return
    setBusy(true)
    try {
      await register(form)
      nav('/account')
    } catch (e2) {
      const m = e2.message || ''
      if (/already|exists|registered/i.test(m)) fe.setError('email', 'An account with this email already exists — log in instead.')
      else { setErr(m || 'Could not create account.'); errorFeedback() }
    } finally {
      setBusy(false)
    }
  }

  // Already signed in (e.g. Google session restored) — skip the form
  if (signedIn && !busy) return <Navigate to={signedIn.role === 'admin' ? '/admin' : '/account'} replace />
  return (
    <div className="container-x py-16 max-w-md">
      <div className="card p-8">
        <div className="flex justify-center mb-6"><Logo className="h-11" /></div>
        <h1 className="text-2xl text-center">Create your account</h1>
        <div className="mt-6"><GoogleButton label="Sign up with Google" /></div>
        <OrDivider />
        <form onSubmit={submit} noValidate className="space-y-3">
          <p className="text-[11px] text-ink-500 text-right -mb-1"><span className="text-red-500">*</span> required</p>
          <Field name="name" required error={fe.errors.name} label="Full name" autoComplete="name" value={form.name} onChange={set('name')} />
          <Field name="email" required error={fe.errors.email} label="Email" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={set('email')} />
          <Field name="phone" optional error={fe.errors.phone} label="Phone" type="tel" inputMode="numeric" prefix="+91" autoComplete="tel-national" maxLength={10} value={form.phone} onChange={(v) => set('phone')(v.replace(/\D/g, '').slice(0, 10))} />
          <Field name="password" required error={fe.errors.password} label="Password" hint="min 6 characters" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} />
          {err && <p role="alert" className="flex items-start gap-1.5 text-sm font-semibold text-red-600 bg-red-50 rounded-xl p-3"><AlertCircle size={16} className="shrink-0 mt-px" />{err}</p>}
          <button disabled={busy} className="btn-primary w-full disabled:opacity-60">{busy ? 'Creating…' : 'Create account'}</button>
        </form>
        <p className="text-center text-sm text-ink-500 mt-4">
          Already have an account? <Link to="/login" className="text-brand-600 font-semibold">Login</Link>
        </p>
      </div>
    </div>
  )
}
