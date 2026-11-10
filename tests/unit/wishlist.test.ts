import { describe, it, expect, vi } from 'vitest'
import {
  readWishlistIds, writeWishlistIds, getWishlistCount, clearGuestWishlist, requireSignInForWishlist,
  pickVariant, isOutOfStock, cartParams, getProductPrice, getProductImage, FALLBACK_IMAGE,
} from '../../src/utils/wishlist'

const signIn = () => localStorage.setItem('is_authenticated', '1')

describe('wishlist storage', () => {
  it('guests never have a wishlist', () => {
    localStorage.setItem('wishlist', '[1,2]')
    expect(readWishlistIds()).toEqual([])
    expect(getWishlistCount()).toBe(0)
  })

  it('reads ids and {id} objects, dedupes and drops junk', () => {
    signIn()
    localStorage.setItem('wishlist', JSON.stringify([1, { id: 2 }, '2', null, 0, 'x']))
    expect(readWishlistIds()).toEqual([1, 2])
  })

  it('survives corrupted storage', () => {
    signIn()
    localStorage.setItem('wishlist', 'not json')
    expect(readWishlistIds()).toEqual([])
  })

  it('write notifies listeners', () => {
    signIn()
    const spy = vi.fn()
    window.addEventListener('wishlist-updated', spy)
    writeWishlistIds([5])
    expect(readWishlistIds()).toEqual([5])
    expect(spy).toHaveBeenCalledTimes(1)
    window.removeEventListener('wishlist-updated', spy)
  })

  it('clears guest leftovers but keeps a signed-in list', () => {
    localStorage.setItem('wishlist', '[1]')
    clearGuestWishlist()
    expect(localStorage.getItem('wishlist')).toBeNull()
    signIn()
    localStorage.setItem('wishlist', '[1]')
    clearGuestWishlist()
    expect(localStorage.getItem('wishlist')).toBe('[1]')
  })

  it('sends guests to login and remembers where they were', () => {
    const navigate = vi.fn()
    window.history.pushState({}, '', '/product/7?x=1')
    expect(requireSignInForWishlist(navigate)).toBe(false)
    expect(navigate).toHaveBeenCalledWith('/login')
    expect(sessionStorage.getItem('redirect_after_login')).toBe('/product/7?x=1')
    signIn()
    expect(requireSignInForWishlist(navigate)).toBe(true)
  })
})

describe('product helpers', () => {
  const product = {
    id: 9, product_name: 'Nova X', brand: 'Nova', image: '/media/x.png',
    variants: [
      { id: 1, price: 20000, discountPrice: 18000, stock: 0, storage: '256' },
      { id: 2, price: 15000, discountPrice: 0, stock: 4, storage: '128' },
      { id: 3, price: 17000, discountPrice: 16000, stock: 2, storage: '128' },
    ],
  }

  it('picks the cheapest variant that is in stock', () => {
    expect(pickVariant(product)?.id).toBe(2)
    expect(isOutOfStock(product)).toBe(false)
    expect(isOutOfStock({ variants: [{ stock: 0 }] })).toBe(true)
    expect(isOutOfStock({ variants: [] })).toBe(false)
  })

  it('builds cart params from the chosen variant', () => {
    expect(cartParams(product)).toMatchObject({ productId: 9, variationId: 2, price: 15000, storage: '128', name: 'Nova X' })
  })

  it('resolves images and prices', () => {
    expect(getProductImage({})).toBe(FALLBACK_IMAGE)
    expect(getProductImage({ image: 'https://cdn/x.png' })).toBe('https://cdn/x.png')
    expect(getProductImage({ image: '/media/x.png' })).toMatch(/^https?:\/\/.+\/media\/x\.png$/)
    expect(getProductPrice({ min_price: 500 })).toEqual({ current: 500, old: null })
    expect(getProductPrice({ variants: [{ price: 1000, discount_price: 800 }] })).toEqual({ current: 800, old: 1000 })
  })
})
