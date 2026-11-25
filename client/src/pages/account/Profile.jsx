import { useAuth } from '@/store/auth'

export default function Profile() {
  const user = useAuth((s) => s.user)
  return (
    <div>
      <h1 className="text-2xl font-extrabold mb-5">Profile</h1>
      <div className="card p-6 max-w-lg space-y-4">
        <Field label="Name" value={user?.name} />
        <Field label="Email" value={user?.email} />
        <Field label="Role" value={user?.role} />
        <p className="text-sm text-ink-500">Profile editing and saved addresses connect to the backend (<code>PATCH /auth/me</code>) once the API is wired up.</p>
      </div>
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-sm font-bold">{label}</p>
      <p className="text-ink-700 capitalize">{value || '—'}</p>
    </div>
  )
}
