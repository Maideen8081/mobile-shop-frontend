import api from './api'
import { cachedRequest } from '../utils/requestCache'

export interface ExitOfferCoupon {
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: string
  discount_amount: string
  expires_at: string
}

export interface ExitOfferUnlock {
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: string
  minimum_amount: string
  amount_needed: string
}

export interface ExitOfferSaving {
  product_id: number
  name: string
  price: string
  discount_price: string
  percent_off: number
}

export interface ExitOfferDeal extends ExitOfferSaving {
  variant_id: number
  brand: string
  image: string
}

export interface ExitOffer {
  coupon: ExitOfferCoupon | null
  unlock_coupon: ExitOfferUnlock | null
  cart_savings: ExitOfferSaving[]
  deals: ExitOfferDeal[]
}

export interface StoreCoupon {
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: string
  minimum_amount: string
  expires_at: string
}

/** Short shopper-facing label, e.g. "10% off" or "₹500 off on ₹2,000+". */
export function couponLabel(c: StoreCoupon): string {
  const value = Number(c.discount_value) || 0
  const min = Number(c.minimum_amount) || 0
  const off = c.discount_type === 'percentage' ? `${value}% off` : `₹${value.toLocaleString('en-IN')} off`
  return min > 0 ? `${off} on ₹${min.toLocaleString('en-IN')}+` : off
}

export const offerService = {
  /** Coupons valid right now, the same ones checkout will accept. */
  getActiveCoupons(): Promise<StoreCoupon[]> {
    return cachedRequest('coupons:active', () =>
      api
        .get('/api/v1/coupon/active/', { skipAuthRedirect: true })
        .then((r) => (Array.isArray(r.data?.data) ? r.data.data : [])),
      5 * 60_000,
    )
  },

  async getCheckoutExitOffer(productIds: number[], subtotal: number): Promise<ExitOffer> {
    const r = await api.post('/api/v1/checkout/exit-offer/', {
      product_ids: productIds,
      subtotal: subtotal.toFixed(2),
    }, { skipAuthRedirect: true })
    return r.data?.data ?? r.data
  },
}
