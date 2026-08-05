import { authService } from '../services/authService'
import { cartService } from '../services/cartService'

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
