import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/services/api', () => ({ default: { post: vi.fn(), get: vi.fn() } }))

import api from '../../src/services/api'
import {
  computeTotals, apiErrorMessage, formatINR,
  readCheckoutCoupon, saveCheckoutCoupon, validateCoupon,
} from '../../src/utils/checkout'
import { DELIVERY_CHARGE, FREE_SHIPPING_THRESHOLD, TAX_RATE } from '../../src/components/mobile/cartLogic'

describe('computeTotals', () => {
  it('returns zeros for an empty cart (no delivery charge)', () => {
    expect(computeTotals([])).toEqual({ subtotal: 0, quantity: 0, shipping: 0, tax: 0, discount: 0, total: 0 })
  })

  it('charges delivery below the free-shipping threshold', () => {
    const t = computeTotals([{ price: 200, quantity: 2 }])
    expect(t.subtotal).toBe(400)
    expect(t.quantity).toBe(2)
    expect(t.shipping).toBe(DELIVERY_CHARGE)
    expect(t.tax).toBe(72)
    expect(t.total).toBe(400 + DELIVERY_CHARGE + 72)
  })

  it('ships free at exactly the threshold', () => {
    expect(computeTotals([{ price: FREE_SHIPPING_THRESHOLD, quantity: 1 }]).shipping).toBe(0)
  })

  it('rounds GST to paise like the server', () => {
    expect(computeTotals([{ price: 99.99, quantity: 1 }]).tax).toBe(18)
    expect(computeTotals([{ price: 10.05, quantity: 1 }]).tax).toBeCloseTo(1.81, 2)
  })

  it('caps the coupon at the subtotal and never goes negative', () => {
    const t = computeTotals([{ price: 1000, quantity: 1 }], 5000)
    expect(t.discount).toBe(1000)
    expect(t.total).toBe(1000 * TAX_RATE)
  })
})

describe('formatINR', () => {
  it('uses Indian digit grouping and preserves paise', () => {
    expect(formatINR(1234567)).toBe('₹12,34,567')
    expect(formatINR(99.6)).toBe('₹99.6')
    expect(formatINR(99.61)).toBe('₹99.61')
  })
})

describe('apiErrorMessage', () => {
  it('prefers the server message, then detail, then the first field error', () => {
    expect(apiErrorMessage({ response: { data: { message: 'Nope' } } }, 'x')).toBe('Nope')
    expect(apiErrorMessage({ response: { data: { detail: 'Denied' } } }, 'x')).toBe('Denied')
    expect(apiErrorMessage({ response: { data: { code: ['Invalid coupon code.'] } } }, 'x')).toBe('Invalid coupon code.')
  })

  it('falls back to the error message or the fallback', () => {
    expect(apiErrorMessage({ message: 'Network Error' }, 'x')).toBe('Network Error')
    expect(apiErrorMessage(undefined, 'fallback')).toBe('fallback')
    expect(apiErrorMessage({ response: { data: { n: [1] } } }, 'fallback')).toBe('fallback')
  })
})

describe('checkout coupon storage', () => {
  it('round-trips and clears', () => {
    saveCheckoutCoupon({ code: 'SAVE10', discount: 100 })
    expect(readCheckoutCoupon()).toEqual({ code: 'SAVE10', discount: 100 })
    saveCheckoutCoupon(null)
    expect(readCheckoutCoupon()).toBeNull()
  })

  it('survives corrupted storage', () => {
    localStorage.setItem('checkout_coupon', '{bad json')
    expect(readCheckoutCoupon()).toBeNull()
  })
})

describe('validateCoupon', () => {
  beforeEach(() => vi.mocked(api.post).mockClear())

  it('sends the trimmed code and subtotal to the server', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { data: { coupon_code: 'SAVE10', discount_amount: '150.50' } } })
    await expect(validateCoupon('  save10 ', 1505)).resolves.toEqual({ code: 'SAVE10', discount: 150.5 })
    expect(api.post).toHaveBeenCalledWith('/api/v1/coupon/apply/', { code: 'save10', subtotal: '1505.00' })
  })

  it('surfaces the server error message', async () => {
    vi.mocked(api.post).mockImplementationOnce(() => Promise.reject({ response: { data: { code: ['Invalid coupon code.'] } } }))
    const err = await validateCoupon('PHONE10', 100).catch((e: Error) => e)
    expect(err).toBeInstanceOf(Error)
    expect((err as Error).message).toBe('Invalid coupon code.')
  })
})
