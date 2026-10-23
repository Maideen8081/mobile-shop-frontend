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
      navigate(redirect || '/home', { replace: true })
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
      {/* Google renders its own accessible button into this slot. */}
      <div ref={slot} className="flex justify-center w-full" style={{ minHeight: 44, colorScheme: 'light' }} />

      {status === 'loading' && (
        <div className="absolute inset-0 rounded-xl animate-pulse" style={{ background: '#F3EDE9' }} aria-hidden="true" />
      )}
      {status === 'unavailable' && (
        <p className="text-center text-xs py-3" style={{ color: '#857d79' }} role="status">
          Google sign-in couldn't load. Check your connection or any content blockers, then refresh.
        </p>
      )}
      {busy && (
        <div className="absolute inset-0 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold"
          style={{ background: 'rgba(255,255,255,0.92)', color: '#1b1210' }} role="status">
          <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" opacity=".25" /><path d="M21 12a9 9 0 0 1-9 9" />
          </svg>
          Signing you in…
        </div>
      )}
    </div>
  )
}
