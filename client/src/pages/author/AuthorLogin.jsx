import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AlertCircle, PenLine } from 'lucide-react'
import Logo from '@/components/Logo'
import { useAuth, warmUpApi } from '@/store/auth'
import { Field, useFieldErrors, errorFeedback, isEmail } from '@/components/FormField'

// /author/login: the one sign-in page for all blog authors (email + password from the admin)
const CAN_WRITE = ['author', 'admin']

export default function AuthorLogin() {
  const login = useAuth((s) => s.login)
  const logout = useAuth((s) => s.logout)
  const signedIn = useAuth((s) => s.user)
  const nav = useNavigate()
  useEffect(() => { warmUpApi() }, [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const fe = useFieldErrors()

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    if (!fe.validate({
      email: !email.trim() ? 'Enter your email.' : !isEmail(email) ? 'This email doesn’t look right.' : null,
      password: !password ? 'Enter your password.' : null,
    })) return
    setBusy(true)
    try {
      const user = await login({ email, password })
      if (!CAN_WRITE.includes(user?.role)) {
        await logout()
        setErr('This login is only for blog authors. Customers can log in from the shop.')
        errorFeedback()
        return
      }
      nav('/author', { replace: true })
    } catch (e2) {
      const m = e2.message || ''
      if (/invalid|incorrect|wrong|credentials/i.test(m)) fe.setError('password', 'Email or password is incorrect.')
      else { setErr(m || 'Login failed. Please try again.'); errorFeedback() }
    } finally {
      setBusy(false)
    }
  }

  if (signedIn && CAN_WRITE.includes(signedIn.role) && !busy) return <Navigate to="/author" replace />
  return (
    <div className="min-h-screen bg-sand-50 grid place-items-center px-4 py-12">
      <div className="card p-8 w-full max-w-md">
        <div className="flex justify-center mb-5"><Logo className="h-11" /></div>
        <p className="flex justify-center"><span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[.16em] text-brand-700 bg-brand-50 rounded-full px-3 py-1"><PenLine size={13} /> Authors</span></p>
        <h1 className="text-2xl text-center mt-3">Author login</h1>
        <p className="text-ink-500 text-center text-sm mt-1">Sign in with the email and password the AnimalVeda team gave you.</p>
        {signedIn && !CAN_WRITE.includes(signedIn.role) && (
          <p className="mt-4 text-sm text-ink-700 bg-sand-100 rounded-xl p-3">You’re signed in as a customer ({signedIn.email}). Log in below with your author account instead.</p>
        )}
        <form onSubmit={submit} noValidate className="space-y-3 mt-6">
          <Field name="email" required error={fe.errors.email} label="Email" type="email" inputMode="email" autoComplete="username" value={email} onChange={(v) => { setEmail(v); fe.clear('email') }} />
          <Field name="password" required error={fe.errors.password} label="Password" type="password" autoComplete="current-password" value={password} onChange={(v) => { setPassword(v); fe.clear('password') }} />
          {err && <p role="alert" className="flex items-start gap-1.5 text-sm font-semibold text-red-600 bg-red-50 rounded-xl p-3"><AlertCircle size={16} className="shrink-0 mt-px" />{err}</p>}
          <button disabled={busy} className="btn-primary w-full disabled:opacity-60">{busy ? 'Logging in…' : 'Login'}</button>
        </form>
        <p className="text-center text-xs text-ink-500 mt-4">Forgot your password? Ask the AnimalVeda admin to reset it.</p>
      </div>
    </div>
  )
}
