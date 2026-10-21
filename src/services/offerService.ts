import api from './api'

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

export const offerService = {
  async getCheckoutExitOffer(productIds: number[], subtotal: number): Promise<ExitOffer> {
    const r = await api.post('/api/v1/checkout/exit-offer/', {
      product_ids: productIds,
      subtotal: subtotal.toFixed(2),
    }, { skipAuthRedirect: true })
    return r.data?.data ?? r.data
  },
}
