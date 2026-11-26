import { useEffect, useRef, useState } from 'react'
import { afterLoginPath } from '@/lib/nextPath'
import { Link, useNavigate } from 'react-router-dom'
import { AuthenticateWithRedirectCallback, useAuth as useClerkAuth } from '@clerk/react'
import { useAuth, warmUpApi } from '@/store/auth'
import { LogoMark } from '@/components/Logo'

// Step 1 of Google sign-in return: Clerk finishes the OAuth handshake here.
export function SsoCallback() {
  useEffect(() => { warmUpApi() }, [])
  return (
    <>
      <Waiting step={1} />
      <AuthenticateWithRedirectCallback signInFallbackRedirectUrl="/auth/complete" signUpFallbackRedirectUrl="/auth/complete" />
    </>
  )
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const isRetryable = (e) => e instanceof TypeError || /Request failed \((5\d\d)\)|Route not found|Failed to fetch/i.test(e?.message || '')

// Step 2: swap the Clerk session for our own store session, then go to the account.
export default function AuthComplete() {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth()
  const loginWithClerk = useAuth((s) => s.loginWithClerk)
  const nav = useNavigate()
  const [err, setErr] = useState('')
  const [slow, setSlow] = useState(false)
  const started = useRef(false)

  useEffect(() => { warmUpApi(); const t = setTimeout(() => setSlow(true), 6000); return () => clearTimeout(t) }, [])

  useEffect(() => {
    if (!isLoaded || started.current) return
    if (!isSignedIn) { setErr('Google sign-in was cancelled or has expired. Please try again.'); return }
    started.current = true
    ;(async () => {
      // Retry while the API host wakes up (it can take up to a minute after idling)
      for (let attempt = 0; attempt < 6; attempt++) {
        try {
          const token = await getToken({ skipCache: attempt > 0 })
          const user = await loginWithClerk(token)
          nav(afterLoginPath(user), { replace: true })
          return
        } catch (e) {
          if (!isRetryable(e) || attempt === 5) { setErr(e.message || 'Could not finish signing in.'); return }
          await sleep(2500 * (attempt + 1))
        }
      }
    })()
  }, [isLoaded, isSignedIn, getToken, loginWithClerk, nav])

  if (err) return (
    <div className="container-x py-20 max-w-md text-center">
      <LogoMark size={56} className="mx-auto" />
      <h1 className="text-2xl mt-4">Sign-in didn’t complete</h1>
      <p className="text-ink-500 mt-2 text-sm">{err}</p>
      <Link to="/login" replace className="btn-primary mt-6">Back to login</Link>
    </div>
  )
  return <Waiting step={2} slow={slow} />
}

function Waiting({ step, slow }) {
  return (
    <div className="container-x py-16 sm:py-24 max-w-sm text-center">
      <div className="relative w-20 h-20 mx-auto">
        <span className="absolute inset-0 rounded-full border-4 border-brand-100 border-t-brand-500 animate-spin" />
        <LogoMark size={56} className="absolute inset-0 m-auto" />
      </div>
      <h1 className="text-2xl mt-6">Signing you in…</h1>
      <ol className="mt-5 space-y-2 text-sm text-left w-fit mx-auto">
        <li className="flex items-center gap-2"><Dot done={step > 1} active={step === 1} /> Confirming your Google account</li>
        <li className="flex items-center gap-2"><Dot active={step === 2} /> Opening your AnimalVeda account</li>
      </ol>
      {slow && <p className="text-xs text-ink-500 mt-6 animate-fade-in">Our server is waking up. This can take up to a minute the first time. Please keep this page open.</p>}
    </div>
  )
}
function Dot({ done, active }) {
  return <span className={`w-4 h-4 rounded-full grid place-items-center text-[10px] text-white ${done ? 'bg-green-500' : active ? 'bg-brand-500 animate-pulse' : 'bg-ink-200'}`}>{done ? '✓' : ''}</span>
}
