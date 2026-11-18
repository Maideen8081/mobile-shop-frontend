import api from '../services/api'
import { DELIVERY_CHARGE, FREE_SHIPPING_THRESHOLD, TAX_RATE } from '../components/mobile/cartLogic'

export const formatINR = (n: number) => '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 })

export interface CheckoutCoupon {
  code: string
  discount: number
}

/** Checkout totals in paise, matching the order API's pricing rules. */
export function computeTotals(items: { price: number; quantity: number }[], couponDiscount = 0) {
  const subtotalPaise = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0)
  const subtotal = subtotalPaise / 100
  const quantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DELIVERY_CHARGE
  const discountPaise = Math.min(Math.max(Math.round(couponDiscount * 100), 0), subtotalPaise)
  const taxPaise = Math.round(subtotalPaise * TAX_RATE)
  const total = (subtotalPaise + taxPaise + Math.round(shipping * 100) - discountPaise) / 100
  return { subtotal, quantity, shipping, tax: taxPaise / 100, discount: discountPaise / 100, total }
}

export function gstLabel(ratePercent: number = Math.round(TAX_RATE * 100)): string {
  return `GST (${Number(ratePercent.toFixed(2))}%)`
}

/**
 * The GST % an order was actually charged. New orders store it; for older
 * orders (tax added on top of the subtotal) it is derived from the amounts.
 */
export function orderTaxRate(order: { tax_rate?: unknown; taxRate?: unknown; tax?: unknown; subtotal?: unknown }): number {
  const stored = Number(order.tax_rate ?? order.taxRate)
  if (stored > 0) return stored
  const tax = Number(order.tax) || 0
  const subtotal = Number(order.subtotal) || 0
  if (tax > 0 && subtotal > 0) return Math.round((tax / subtotal) * 100)
  return Math.round(TAX_RATE * 100)
}

/** Old orders had GST added on top; new ones include it. */
export function orderTaxLabel(order: Parameters<typeof orderTaxRate>[0]): string {
  const rate = orderTaxRate(order)
  const included = Number(order.tax_rate ?? order.taxRate) > 0
  return included ? `Incl. ${gstLabel(rate)}` : gstLabel(rate)
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

/** Keep confirmation available locally without turning a placed order into a failed checkout. */
export function saveOrderConfirmation(order: unknown) {
  try {
    localStorage.setItem('last_order', JSON.stringify(order))
    localStorage.removeItem('checkout_coupon')
    localStorage.removeItem('checkout_address_id')
    localStorage.removeItem('checkout_delivery_tip')
  } catch { /* Confirmation can still be opened by its order ID. */ }
  try {
    const history = JSON.parse(localStorage.getItem('order_history') || '[]')
    localStorage.setItem('order_history', JSON.stringify([order, ...(Array.isArray(history) ? history : [])].slice(0, 50)))
  } catch { /* History is a convenience only. */ }
}
