import api from '../services/api'
import { DELIVERY_CHARGE, FREE_SHIPPING_THRESHOLD, TAX_RATE } from '../components/mobile/cartLogic'

export const formatINR = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

export interface CheckoutCoupon {
  code: string
  discount: number
}

/**
 * Checkout totals, mirroring the server's order pricing: tax and delivery are
 * charged on the item subtotal, and a coupon comes off the final amount.
 */
export function computeTotals(items: { price: number; quantity: number }[], couponDiscount = 0) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const quantity = items.reduce((s, i) => s + i.quantity, 0)
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DELIVERY_CHARGE
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100
  const discount = Math.min(couponDiscount, subtotal)
  const total = Math.max(0, subtotal + shipping + tax - discount)
  return { subtotal, quantity, shipping, tax, discount, total }
}

export function readCheckoutCoupon(): CheckoutCoupon | null {
  try { return JSON.parse(localStorage.getItem('checkout_coupon') || 'null') } catch { return null }
}

export function saveCheckoutCoupon(coupon: CheckoutCoupon | null) {
  if (coupon) localStorage.setItem('checkout_coupon', JSON.stringify(coupon))
  else localStorage.removeItem('checkout_coupon')
}

/** Validates a coupon with the server, which is what applies it to the order. */
export async function validateCoupon(code: string, subtotal: number): Promise<CheckoutCoupon> {
  try {
    const r = await api.post('/api/v1/coupon/apply/', { code: code.trim(), subtotal: subtotal.toFixed(2) })
    const data = r.data?.data || r.data
    return { code: data.coupon_code, discount: Number(data.discount_amount) || 0 }
  } catch (err: any) {
    throw new Error(apiErrorMessage(err, 'That code isn’t valid'), { cause: err })
  }
}

/** First readable message from a DRF / app error response. */
export function apiErrorMessage(err: any, fallback: string): string {
  const data = err?.response?.data
  if (!data || typeof data !== 'object') return err?.message || fallback
  if (typeof data.message === 'string' && data.message) return data.message
  if (typeof data.detail === 'string') return data.detail
  const first = Object.values(data).flat()[0]
  return typeof first === 'string' ? first : fallback
}
