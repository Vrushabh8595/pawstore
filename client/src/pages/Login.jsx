import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Dog } from 'lucide-react'
import { useAuth, DEMO_CREDENTIALS } from '@/store/auth'

export default function Login() {
  const login = useAuth((s) => s.login)
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!email || !password) return setErr('Enter email and password.')
    const user = login({ email, password })
    nav(user.role === 'admin' ? '/admin' : '/account')
  }

  return (
    <div className="container-x py-16 max-w-md">
      <div className="card p-8">
        <div className="flex items-center gap-2 font-extrabold text-xl justify-center mb-6">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-500 text-white"><Dog size={20} /></span>
          PawStore
        </div>
        <h1 className="text-2xl font-extrabold text-center">Welcome back</h1>
        <p className="text-ink-500 text-center text-sm mt-1">Login to track orders and checkout faster.</p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <Field label="Email" type="email" value={email} onChange={setEmail} />
          <Field label="Password" type="password" value={password} onChange={setPassword} />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="btn-primary w-full">Login</button>
        </form>

        <p className="text-center text-sm text-ink-500 mt-4">
          New here? <Link to="/register" className="text-brand-600 font-semibold">Create an account</Link>
        </p>

        <div className="mt-6 text-xs bg-ink-50 rounded-lg p-3 text-ink-500">
          <b>Demo logins</b> (dummy auth):<br />
          User: any email + password<br />
          Admin: <b>{DEMO_CREDENTIALS.email}</b> / <b>{DEMO_CREDENTIALS.password}</b>
        </div>
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
