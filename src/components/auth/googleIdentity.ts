/**
 * Thin loader for Google Identity Services (https://accounts.google.com/gsi/client).
 * The script is injected once and shared by every Google button on the page.
 */

export const GOOGLE_CLIENT_ID: string = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

export interface GoogleCredentialResponse {
  credential: string
  select_by?: string
}

interface GoogleButtonOptions {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'large' | 'medium' | 'small'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: number
  locale?: string
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    ux_mode?: 'popup' | 'redirect'
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
    context?: 'signin' | 'signup' | 'use'
    itp_support?: boolean
    use_fedcm_for_button?: boolean
  }) => void
  renderButton: (parent: HTMLElement, options: GoogleButtonOptions) => void
  disableAutoSelect: () => void
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } }
  }
}

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
let loader: Promise<GoogleAccountsId> | null = null

export function loadGoogleIdentity(): Promise<GoogleAccountsId> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id)
  if (loader) return loader

  loader = new Promise<GoogleAccountsId>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google?.accounts?.id) resolve(window.google.accounts.id)
      else reject(new Error('Google Identity Services did not initialise'))
    }
    script.onerror = () => reject(new Error('Could not load Google sign-in'))
    document.head.appendChild(script)
  }).catch((err) => {
    loader = null // allow a retry on the next mount
    throw err
  })
  return loader
}

/**
 * GIS keeps a single global callback, so every button routes through this
 * dispatcher and the most recently mounted button receives the credential.
 */
let activeHandler: ((r: GoogleCredentialResponse) => void) | null = null
let initialised = false

export function initGoogleIdentity(gis: GoogleAccountsId, handler: (r: GoogleCredentialResponse) => void) {
  activeHandler = handler
  if (initialised) return
  gis.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (r) => activeHandler?.(r),
    ux_mode: 'popup',
    auto_select: false,
    cancel_on_tap_outside: true,
    itp_support: true,
    use_fedcm_for_button: true,
  })
  initialised = true
}

export function releaseGoogleHandler(handler: (r: GoogleCredentialResponse) => void) {
  if (activeHandler === handler) activeHandler = null
}

/** Stop GIS from silently re-selecting the last account after an explicit logout. */
export function googleSignOut() {
  window.google?.accounts?.id?.disableAutoSelect()
}
