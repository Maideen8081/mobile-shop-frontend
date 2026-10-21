import { authService } from '../services/authService'
import { cartService, type BulkAddItem, type BulkAddResult } from '../services/cartService'

export async function addToCartWithAuth(params: {
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
}): Promise<boolean> {
  if (!authService.isAuthenticated()) {
    sessionStorage.setItem('redirect_after_login', window.location.pathname)
    window.location.href = '/login'
    return false
  }
  await cartService.addItem(params)
  return true
}

/** Adds several products in one request. Resolves to null when the user is sent to login. */
export async function addManyToCartWithAuth(items: BulkAddItem[]): Promise<BulkAddResult | null> {
  if (!authService.isAuthenticated()) {
    sessionStorage.setItem('redirect_after_login', window.location.pathname)
    window.location.href = '/login'
    return null
  }
  return cartService.addItems(items)
}
