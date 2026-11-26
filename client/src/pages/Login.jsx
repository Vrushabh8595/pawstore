import Logo from '@/components/Logo'
import GoogleButton, { OrDivider } from '@/components/GoogleButton'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth, warmUpApi } from '@/store/auth'
import { Field, useFieldErrors, errorFeedback, isEmail } from '@/components/FormField'
import { AlertCircle } from 'lucide-react'

export default function Login() {
  const login = useAuth((s) => s.login)
  const nav = useNavigate()
  useEffect(() => { warmUpApi() }, [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const fe = useFieldErrors()

  const signedIn = useAuth((s) => s.user)
  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!fe.validate({
      email: !email.trim() ? 'Enter your email.' : !isEmail(email) ? 'This email doesn’t look right (e.g. name@gmail.com).' : null,
      password: !password ? 'Enter your password.' : null,
    })) return
    setBusy(true)
    try {
      const user = await login({ email, password })
      nav(user.role === 'admin' ? '/admin' : '/account')
    } catch (e2) {
      const m = e2.message || ''
      if (/invalid|incorrect|wrong|credentials/i.test(m)) fe.setError('password', 'Email or password is incorrect. Try again or use Google.')
      else { setErr(m || 'Login failed. Please try again.'); errorFeedback() }
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
        <h1 className="text-2xl text-center">Welcome back</h1>
        <p className="text-ink-500 text-center text-sm mt-1">Login to track orders and checkout faster.</p>

        <div className="mt-6"><GoogleButton label="Continue with Google" /></div>
        <OrDivider />
        <form onSubmit={submit} noValidate className="space-y-3">
          <Field name="email" required error={fe.errors.email} label="Email" type="email" inputMode="email" autoComplete="email" value={email} onChange={(v) => { setEmail(v); fe.clear('email') }} />
          <Field name="password" required error={fe.errors.password} label="Password" type="password" autoComplete="current-password" value={password} onChange={(v) => { setPassword(v); fe.clear('password') }} />
          {err && <p role="alert" className="flex items-start gap-1.5 text-sm font-semibold text-red-600 bg-red-50 rounded-xl p-3"><AlertCircle size={16} className="shrink-0 mt-px" />{err}</p>}
          <button disabled={busy} className="btn-primary w-full disabled:opacity-60">
            {busy ? 'Logging in…' : 'Login'}
          </button>
        </form>

        <p className="text-center text-sm text-ink-500 mt-4">
          New here? <Link to="/register" className="text-brand-600 font-semibold">Create an account</Link>
        </p>
      </div>
    </div>
  )
}
