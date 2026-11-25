import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Dummy auth for the scaffold. Swap for real JWT/httpOnly-cookie calls to the
// backend (POST /auth/login, GET /auth/me) later. The admin account is hardcoded
// here only for demoing the admin dashboard.
const DEMO_ADMIN = { email: 'admin@pawstore.in', password: 'admin123' }

export const useAuth = create(
  persist(
    (set) => ({
      user: null,
      login: ({ email, password }) => {
        const role = email === DEMO_ADMIN.email && password === DEMO_ADMIN.password ? 'admin' : 'user'
        const user = { name: email.split('@')[0], email, role }
        set({ user })
        return user
      },
      register: ({ name, email }) => {
        const user = { name, email, role: 'user' }
        set({ user })
        return user
      },
      logout: () => set({ user: null }),
    }),
    { name: 'pawstore-auth' }
  )
)

export const DEMO_CREDENTIALS = DEMO_ADMIN
