import api from '../services/api'
import { DELIVERY_CHARGE, FREE_SHIPPING_THRESHOLD, TAX_RATE } from '../components/mobile/cartLogic'

export const formatINR = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

export interface CheckoutCoupon {
  code: string
  discount: number
}

/**
 * Checkout totals, mirroring the server's order_totals(): listed prices
 * INCLUDE GST, so GST is shown as the included share and never added on top.
 * Delivery is decided on the item subtotal; a coupon comes off the price.
 */
export function computeTotals(items: { price: number; quantity: number }[], couponDiscount = 0) {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const quantity = items.reduce((s, i) => s + i.quantity, 0)
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : DELIVERY_CHARGE
  const discount = Math.min(Math.max(couponDiscount, 0), subtotal)
  const payable = subtotal - discount
  const tax = includedGst(payable)
  const total = Math.max(0, payable + shipping)
  return { subtotal, quantity, shipping, tax, discount, total }
}

/** GST contained in a tax-inclusive amount. */
export function includedGst(amount: number, rate = TAX_RATE): number {
  if (!(amount > 0)) return 0
  return Math.round(((amount * rate) / (1 + rate)) * 100) / 100
}

/** Label for the GST line, e.g. "Incl. GST (18%)". */
export function gstLabel(ratePercent: number = Math.round(TAX_RATE * 100)): string {
  return `Incl. GST (${Number(ratePercent.toFixed(2))}%)`
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
  return included ? gstLabel(rate) : `GST (${rate}%)`
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
