import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthenticateWithRedirectCallback, useAuth as useClerkAuth } from '@clerk/react'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/store/auth'

// Step 1 of Google sign-in return: Clerk finishes the OAuth handshake here.
export function SsoCallback() {
  return (
    <>
      <Waiting text="Signing you in with Google…" />
      <AuthenticateWithRedirectCallback signInFallbackRedirectUrl="/auth/complete" signUpFallbackRedirectUrl="/auth/complete" />
    </>
  )
}

// Step 2: swap the Clerk session for our own store session.
export default function AuthComplete() {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth()
  const loginWithClerk = useAuth((s) => s.loginWithClerk)
  const nav = useNavigate()
  const [err, setErr] = useState('')
  const started = useRef(false)

  useEffect(() => {
    if (!isLoaded || started.current) return
    if (!isSignedIn) { setErr('Google sign-in was cancelled or expired.'); return }
    started.current = true
    ;(async () => {
      try {
        const token = await getToken()
        const user = await loginWithClerk(token)
        nav(user.role === 'admin' ? '/admin' : '/account', { replace: true })
      } catch (e) {
        setErr(e.message || 'Could not finish signing in.')
      }
    })()
  }, [isLoaded, isSignedIn, getToken, loginWithClerk, nav])

  if (err) return (
    <div className="container-x py-20 max-w-md text-center">
      <h1 className="text-2xl">Sign-in didn’t complete</h1>
      <p className="text-ink-500 mt-2 text-sm">{err}</p>
      <Link to="/login" className="btn-primary mt-6">Back to login</Link>
    </div>
  )
  return <Waiting text="Almost there…" />
}

function Waiting({ text }) {
  return (
    <div className="container-x py-24 text-center text-ink-500">
      <Loader2 className="mx-auto animate-spin text-brand-500" size={32} />
      <p className="mt-3 font-semibold">{text}</p>
    </div>
  )
}
