import Logo from '@/components/Logo'
import GoogleButton, { OrDivider } from '@/components/GoogleButton'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth, warmUpApi } from '@/store/auth'

export default function Login() {
  const login = useAuth((s) => s.login)
  const nav = useNavigate()
  useEffect(() => { warmUpApi() }, [])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!email || !password) return setErr('Enter email and password.')
    setBusy(true)
    setErr('')
    try {
      const user = await login({ email, password })
      nav(user.role === 'admin' ? '/admin' : '/account')
    } catch (e2) {
      setErr(e2.message || 'Login failed. Check your email and password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="container-x py-16 max-w-md">
      <div className="card p-8">
        <div className="flex justify-center mb-6"><Logo className="h-11" /></div>
        <h1 className="text-2xl text-center">Welcome back</h1>
        <p className="text-ink-500 text-center text-sm mt-1">Login to track orders and checkout faster.</p>

        <div className="mt-6"><GoogleButton label="Continue with Google" /></div>
        <OrDivider />
        <form onSubmit={submit} className="space-y-3">
          <Field label="Email" type="email" value={email} onChange={setEmail} />
          <Field label="Password" type="password" value={password} onChange={setPassword} />
          {err && <p className="text-sm text-red-600">{err}</p>}
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

function Field({ label, type = 'text', value, onChange }) {
  return (
    <label className="block">
      <span className="font-bold text-sm">{label}</span>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 border border-[#e5e5e0] rounded-lg px-3 py-2.5 outline-none focus:border-brand-400" />
    </label>
  )
}
