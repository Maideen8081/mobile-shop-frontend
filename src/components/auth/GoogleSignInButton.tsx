import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'
import {
  GOOGLE_CLIENT_ID,
  type GoogleCredentialResponse,
  initGoogleIdentity,
  loadGoogleIdentity,
  releaseGoogleHandler,
} from './googleIdentity'

interface Props {
  /** Button wording: "Sign in with Google" on login, "Sign up with Google" on registration. */
  mode?: 'signin' | 'signup'
  /** Called with the sign-in error message instead of the default toast, e.g. for pages with their own toast. */
  onError?: (message: string) => void
  className?: string
}

function errorMessage(err: unknown): string {
  const data = (err as { response?: { data?: { message?: string; detail?: string } } })?.response?.data
  return data?.message || data?.detail || 'Google sign-in failed. Please try again.'
}

/**
 * Official "Sign in with Google" button. Google issues an ID token in a popup,
 * the API verifies it and starts the normal session, then we redirect like a
 * password login would.
 */
export default function GoogleSignInButton({ mode = 'signin', onError, className = '' }: Props) {
  const navigate = useNavigate()
  const toast = useToast()
  const { googleLogin } = useAuth()
  const slot = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading')
  const [busy, setBusy] = useState(false)
  // Width Google rendered its button at, so the busy state can take its exact place.
  const [buttonWidth, setButtonWidth] = useState(0)
  const elapsed = useElapsedSeconds(busy)

  const fail = useCallback((message: string) => {
    if (onError) onError(message)
    else toast.show(message, 'error')
  }, [onError, toast])

  const handleCredential = useCallback(async ({ credential }: GoogleCredentialResponse) => {
    if (!credential) return
    setBusy(true)
    try {
      const created = await googleLogin(credential)
      toast.show(created ? 'Welcome to PhoneFix! Your account is ready.' : 'Welcome back!', 'success')
      const redirect = sessionStorage.getItem('redirect_after_login')
      sessionStorage.removeItem('redirect_after_login')
      // A brand-new account has an empty cart and wishlist, so a saved
      // "return to" page (often left over from browsing while signed out)
      // is no use to it: start new customers on the home page.
      navigate(created ? '/home' : redirect || '/home', { replace: true })
    } catch (err) {
      fail(errorMessage(err))
      setBusy(false)
    }
  }, [googleLogin, toast, navigate, fail])

  // GIS holds on to the callback, so give it a stable function that forwards to the latest handler.
  const handlerRef = useRef(handleCredential)
  useEffect(() => { handlerRef.current = handleCredential })
  const dispatch = useCallback((r: GoogleCredentialResponse) => { handlerRef.current(r) }, [])

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    let cancelled = false
    let observer: ResizeObserver | undefined

    loadGoogleIdentity()
      .then((gis) => {
        if (cancelled || !slot.current) return
        initGoogleIdentity(gis, dispatch)
        const el = slot.current
        let lastWidth = 0
        const render = () => {
          // GIS accepts 200–400px; match the container so it lines up with our inputs.
          const width = Math.max(200, Math.min(400, Math.floor(el.clientWidth)))
          if (width === lastWidth) return
          lastWidth = width
          setButtonWidth(width)
          el.innerHTML = ''
          gis.renderButton(el, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            shape: 'rectangular',
            logo_alignment: 'center',
            text: mode === 'signup' ? 'signup_with' : 'continue_with',
            width,
          })
        }
        render()
        observer = new ResizeObserver(render)
        observer.observe(el)
        setStatus('ready')
      })
      .catch(() => { if (!cancelled) setStatus('unavailable') })

    return () => {
      cancelled = true
      observer?.disconnect()
      releaseGoogleHandler(dispatch)
    }
  }, [dispatch, mode])

  if (!GOOGLE_CLIENT_ID) return null

  return (
    <div className={`relative w-full ${className}`} aria-busy={busy || status === 'loading'}>
      {/* Google renders its own accessible button into this slot. It stays
          mounted (just hidden) while signing in so it doesn't re-render. */}
      <div
        ref={slot}
        className={`flex justify-center w-full transition-opacity duration-200 ${busy ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
        style={{ minHeight: 44, colorScheme: 'light' }}
        aria-hidden={busy || undefined}
      />

      {status === 'loading' && (
        <div className="absolute inset-0 rounded-xl animate-pulse" style={{ background: '#F3EDE9' }} aria-hidden="true" />
      )}
      {status === 'unavailable' && (
        <p className="text-center text-xs py-3" style={{ color: '#857d79' }} role="status">
          Google sign-in couldn't load. Check your connection or any content blockers, then refresh.
        </p>
      )}
      {busy && <SigningInState width={buttonWidth} elapsed={elapsed} />}
    </div>
  )
}

/** Seconds since `active` became true; resets to 0 when it turns false. */
function useElapsedSeconds(active: boolean) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    if (!active) return
    const started = Date.now()
    const id = window.setInterval(() => setSeconds(Math.floor((Date.now() - started) / 1000)), 500)
    return () => {
      window.clearInterval(id)
      setSeconds(0)
    }
  }, [active])
  return seconds
}

/**
 * Takes the Google button's exact place while the API verifies the token.
 * The API host sleeps when idle, so the first sign-in can take a while; the
 * copy changes as time passes so a slow wake-up doesn't look like a hang.
 */
function SigningInState({ width, elapsed }: { width: number; elapsed: number }) {
  const [title, hint] =
    elapsed < 4 ? ['Signing you in…', 'Verifying your Google account']
    : elapsed < 12 ? ['Still working…', 'Setting up your session']
    : ['Almost there…', 'The first sign-in can take up to a minute']

  return (
    <div className="absolute inset-0 flex justify-center" role="status" aria-live="polite">
      <div
        className="relative h-11 overflow-hidden flex items-center justify-center gap-3 px-4 bg-white"
        style={{ width: width || '100%', border: '1px solid #dadce0', borderRadius: 4 }}
      >
        <svg className="animate-spin shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="#e8eaed" strokeWidth="3" />
          <path d="M21 12a9 9 0 0 0-9-9" stroke="#cb202d" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <span className="min-w-0 text-left leading-tight">
          <span className="block text-sm font-semibold truncate" style={{ color: '#1b1210' }}>{title}</span>
          <span className="block text-[11px] truncate" style={{ color: '#857d79' }}>{hint}</span>
        </span>
        <span className="google-signin-progress absolute left-0 bottom-0 h-[2px]" aria-hidden="true" />
      </div>
    </div>
  )
}
