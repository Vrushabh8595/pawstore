import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Dog } from 'lucide-react'
import { useAuth } from '@/store/auth'

export default function Register() {
  const register = useAuth((s) => s.register)
  const nav = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [err, setErr] = useState('')
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.password) return setErr('Please fill all required fields.')
    register(form)
    nav('/account')
  }

  return (
    <div className="container-x py-16 max-w-md">
      <div className="card p-8">
        <div className="flex items-center gap-2 font-extrabold text-xl justify-center mb-6">
          <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-500 text-white"><Dog size={20} /></span>
          PawStore
        </div>
        <h1 className="text-2xl font-extrabold text-center">Create your account</h1>
        <form onSubmit={submit} className="mt-6 space-y-3">
          <Field label="Full name" value={form.name} onChange={set('name')} />
          <Field label="Email" type="email" value={form.email} onChange={set('email')} />
          <Field label="Phone" value={form.phone} onChange={set('phone')} />
          <Field label="Password" type="password" value={form.password} onChange={set('password')} />
          {err && <p className="text-sm text-red-600">{err}</p>}
          <button className="btn-primary w-full">Create account</button>
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
