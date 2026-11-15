import { authService } from '../services/authService'
import { cartService, type BulkAddItem, type BulkAddResult } from '../services/cartService'

export interface CartAddParams {
  productId: number
  variationId: number
  quantity: number
  name: string
  brand?: string
  price: number
  image: string
  storage?: string
  ram?: string
  color?: string
  emoji?: string
}

const PENDING_KEY = 'pending_cart_items'
export const LOGIN_REASON_KEY = 'login_reason'

function readPending(): CartAddParams[] {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    const list = raw ? JSON.parse(raw) : []
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

/**
 * Send a guest to sign in. Any items they tried to add are remembered and
 * added to their cart right after login (see resumePendingCart), and the
 * login page explains why they were sent there.
 */
export function sendGuestToLogin(items: CartAddParams[] = [], navigate?: (to: string) => void) {
  try {
    sessionStorage.setItem('redirect_after_login', window.location.pathname + window.location.search)
    if (items.length) {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify([...readPending(), ...items]))
      sessionStorage.setItem(LOGIN_REASON_KEY, 'cart')
    }
  } catch { /* storage blocked: still go to login */ }
  if (navigate) navigate('/login')
  else window.location.href = '/login'
}

/** After sign-in, add the items a guest tried to add. Resolves to how many were added. */
export async function resumePendingCart(): Promise<number> {
  if (!authService.isAuthenticated()) return 0
  const items = readPending()
  try { sessionStorage.removeItem(PENDING_KEY); sessionStorage.removeItem(LOGIN_REASON_KEY) } catch { /* ignore */ }
  let added = 0
  for (const item of items) {
    try { await cartService.addItem(item); added++ } catch { /* out of stock etc. */ }
  }
  return added
}

export async function addToCartWithAuth(params: CartAddParams): Promise<boolean> {
  if (!authService.isAuthenticated()) {
    sendGuestToLogin([params])
    return false
  }
  await cartService.addItem(params)
  return true
}

/** Adds several products in one request. Resolves to null when the user is sent to login. */
export async function addManyToCartWithAuth(items: BulkAddItem[]): Promise<BulkAddResult | null> {
  if (!authService.isAuthenticated()) {
    sendGuestToLogin(items)
    return null
  }
  return cartService.addItems(items)
}

/** True when the shopper was sent to log in because they tried to add to cart. */
export function loginIsForCart(): boolean {
  try { return sessionStorage.getItem(LOGIN_REASON_KEY) === 'cart' } catch { return false }
}
