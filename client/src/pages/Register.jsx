import Logo from '@/components/Logo'
import GoogleButton, { OrDivider } from '@/components/GoogleButton'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth, warmUpApi } from '@/store/auth'

export default function Register() {
  const register = useAuth((s) => s.register)
  const nav = useNavigate()
  useEffect(() => { warmUpApi() }, [])
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const [busy, setBusy] = useState(false)

  const signedIn = useAuth((s) => s.user)
  const submit = async (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return setErr('Please fill all required fields.')
    if (form.password.length < 6) return setErr('Password must be at least 6 characters.')
    setBusy(true)
    setErr('')
    try {
      await register(form)
      nav('/account')
    } catch (e2) {
      setErr(e2.message || 'Could not create account.')
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
        <form onSubmit={submit} className="space-y-3">
          <Field label="Full name" value={form.name} onChange={set('name')} />
          <Field label="Email" type="email" value={form.email} onChange={set('email')} />
          <Field label="Phone" value={form.phone} onChange={set('phone')} />
          <Field label="Password" type="password" value={form.password} onChange={set('password')} />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button disabled={busy} className="btn-primary w-full disabled:opacity-60">{busy ? 'Creating…' : 'Create account'}</button>
        </form>
        <p className="text-center text-sm text-ink-500 mt-4">
          Already have an account? <Link to="/login" className="text-brand-600 font-semibold">Login</Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, type = 'text', value, onChange }) {
  return (
    <label className="block">
      <span className="font-bold text-sm">{label}</span>
      <input type={type} value={value} onChange={onChange}
        className="w-full mt-1 border border-[#e5e5e0] rounded-lg px-3 py-2.5 outline-none focus:border-brand-400" />
    </label>
  )
}
