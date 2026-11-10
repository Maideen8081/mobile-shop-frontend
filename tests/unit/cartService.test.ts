import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../src/services/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

// The cart service keeps a module-level cache, so each test loads a fresh copy.
async function load() {
  vi.resetModules()
  const { default: api } = await import('../../src/services/api')
  const { cartService } = await import('../../src/services/cartService')
  return { api, cartService }
}

describe('cartService (signed in)', () => {
  beforeEach(() => {
    localStorage.setItem('is_authenticated', '1')
  })

  it('maps server items, using the discount price only when it is above zero', async () => {
    const { api, cartService } = await load()
    vi.mocked(api.get).mockResolvedValue({
      data: {
        data: {
          products: [
            { product_id: 1, variation_id: 10, product_name: 'A', price: '1000.00', discount_price: '900.00', quantity: 2 },
            { product_id: 2, variation_id: 20, product_name: 'B', price: '500.00', discount_price: '0.00', quantity: 1 },
            { product_id: 3, variation_id: 30, product_name: 'C', price: '300.00', discount_price: null, quantity: 1 },
          ],
          subtotal: '2600.00', tax: '468.00', shipping_charge: '0.00', grand_total: '3068.00', quantity: 4,
        },
      },
    })
    const { items, totals } = await cartService.getCart(true)
    expect(items.map((i) => i.price)).toEqual([900, 500, 300])
    expect(items.map((i) => i.discountPrice)).toEqual([900, null, null])
    expect(totals).toMatchObject({ subtotal: 2600, grandTotal: 3068, quantity: 4 })
    expect(JSON.parse(localStorage.getItem('cart')!)).toHaveLength(3)
  })

  it('falls back to the local cart and reports the error when the API fails', async () => {
    localStorage.setItem('cart', JSON.stringify([{ productId: 5, name: 'Local', price: 1, quantity: 1, image: '' }]))
    const { api, cartService } = await load()
    vi.mocked(api.get).mockImplementation(async () => { throw { response: { status: 503, data: { message: 'Down' } } } })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onError = vi.fn()
    cartService.onCartError(onError)
    const { items, totals } = await cartService.getCart(true)
    expect(items.map((i) => i.productId)).toEqual([5])
    expect(totals).toBeNull()
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'Down', status: 503 }))
  })
})
