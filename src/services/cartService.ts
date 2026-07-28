import api from './api'
import { authService } from './authService'

export interface CartItem {
  productId: number
  variantId?: number | null
  name: string
  brand?: string
  price: number
  discountPrice?: number | null
  image: string
  quantity: number
  storage?: string
  ram?: string
  color?: string
  emoji?: string
  cartItemId?: number
}

export interface CartTotals {
  subtotal: number
  tax: number
  shippingCharge: number
  discount: number
  grandTotal: number
  quantity: number
  cartId?: number
}

export interface CartApiError {
  message: string
  status?: number
  timestamp: number
}

const CART_KEY = 'cart'

let lastCartApiError: CartApiError | null = null
let cartApiErrorListeners: Set<(error: CartApiError | null) => void> = new Set()

let cachedCartItems: CartItem[] | null = null
let cachedCartTotals: CartTotals | null = null
let cartCacheTimestamp = 0
const CART_CACHE_TTL = 3000

function notifyCartErrorListeners(error: CartApiError | null) {
  lastCartApiError = error
  cartApiErrorListeners.forEach((listener) => {
    try { listener(error) } catch { /* listener error ignored */ }
  })
}

function getLocalCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]')
  } catch {
    return []
  }
}

function setLocalCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

function dispatchCartUpdated() {
  window.dispatchEvent(new Event('cart-updated'))
}

function mapApiItem(item: any): CartItem {
  return {
    productId: item.product_id,
    variantId: item.variation_id,
    name: item.product_name,
    brand: item.brand,
    price: Number(item.discount_price ?? item.price),
    discountPrice: item.discount_price != null ? Number(item.discount_price) : null,
    image: item.image || '',
    quantity: item.quantity,
    storage: item.selected_storage || '',
    ram: item.selected_ram || '',
    color: item.selected_color || '',
    cartItemId: item.cart_item_id,
  }
}

function syncCachedItemsFromLocal() {
  if (!cachedCartItems) {
    cachedCartItems = getLocalCart()
  }
}

export const cartService = {
  isUsingApi(): boolean {
    return authService.isAuthenticated()
  },

  getLastCartError(): CartApiError | null {
    return lastCartApiError
  },

  onCartError(listener: (error: CartApiError | null) => void): () => void {
    cartApiErrorListeners.add(listener)
    return () => { cartApiErrorListeners.delete(listener) }
  },

  async getCart(forceRefresh = false): Promise<{ items: CartItem[]; totals: CartTotals | null }> {
    if (!this.isUsingApi()) {
      syncCachedItemsFromLocal()
      return { items: cachedCartItems || [], totals: null }
    }

    if (!forceRefresh && cachedCartItems && Date.now() - cartCacheTimestamp < CART_CACHE_TTL) {
      return { items: cachedCartItems, totals: cachedCartTotals }
    }

    try {
      const res = await api.get('/api/v1/cart/')
      notifyCartErrorListeners(null)
      const body = res.data?.data || res.data
      const items = (body.products || []).map(mapApiItem)
      const totals: CartTotals = {
        subtotal: Number(body.subtotal || 0),
        tax: Number(body.tax || 0),
        shippingCharge: Number(body.shipping_charge || 0),
        discount: Number(body.discount || 0),
        grandTotal: Number(body.grand_total || 0),
        quantity: Number(body.quantity || 0),
        cartId: body.cart_id,
      }
      cachedCartItems = items
      cachedCartTotals = totals
      cartCacheTimestamp = Date.now()
      return { items, totals }
    } catch (err: any) {
      const status = err?.response?.status
      const message = err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Cart API error'
      console.error(`[cartService] GET /api/v1/cart/ failed (${status || 'network'}):`, message, err)
      notifyCartErrorListeners({ message, status, timestamp: Date.now() })
      syncCachedItemsFromLocal()
      return { items: cachedCartItems || [], totals: null }
    }
  },

  async getItems(): Promise<CartItem[]> {
    const { items } = await this.getCart()
    return items
  },

  async getCartCount(): Promise<number> {
    if (cachedCartItems) {
      if (cachedCartTotals) return cachedCartTotals.quantity
      return cachedCartItems.reduce((s, i) => s + i.quantity, 0)
    }
    const { items, totals } = await this.getCart()
    if (totals) return totals.quantity
    return items.reduce((s, i) => s + i.quantity, 0)
  },

  getCachedCartCount(): number {
    if (cachedCartItems) {
      if (cachedCartTotals) return cachedCartTotals.quantity
      return cachedCartItems.reduce((s, i) => s + i.quantity, 0)
    }
    return getLocalCart().reduce((s, i) => s + i.quantity, 0)
  },

  async addItem(params: {
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
  }): Promise<void> {
    const optimisticItem: CartItem = {
      productId: params.productId,
      variantId: params.variationId,
      name: params.name,
      brand: params.brand,
      price: params.price,
      discountPrice: null,
      image: params.image,
      quantity: params.quantity,
      storage: params.storage || '',
      ram: params.ram || '',
      color: params.color || '',
      emoji: params.emoji,
    }

    if (this.isUsingApi()) {
      syncCachedItemsFromLocal()
      const existingIdx = (cachedCartItems || []).findIndex(
        (i) => i.productId === params.productId && i.variantId === params.variationId
      )
      if (existingIdx >= 0) {
        cachedCartItems![existingIdx].quantity += params.quantity
      } else {
        if (!cachedCartItems) cachedCartItems = []
        cachedCartItems.push(optimisticItem)
      }
      dispatchCartUpdated()

      try {
        await api.post('/api/v1/cart/add/', {
          product_id: params.productId,
          variation_id: params.variationId,
          quantity: params.quantity,
        })
        notifyCartErrorListeners(null)
        await this.getCart(true)
        dispatchCartUpdated()
        return
      } catch (err: any) {
        const status = err?.response?.status
        const message = err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Failed to add item to cart'
        console.error(`[cartService] POST /api/v1/cart/add/ failed (${status || 'network'}):`, message, err)
        notifyCartErrorListeners({ message, status, timestamp: Date.now() })
        if (existingIdx >= 0) {
          cachedCartItems![existingIdx].quantity -= params.quantity
          if (cachedCartItems![existingIdx].quantity <= 0) {
            cachedCartItems!.splice(existingIdx, 1)
          }
        } else {
          cachedCartItems = (cachedCartItems || []).filter(
            (i) => !(i.productId === params.productId && i.variantId === params.variationId)
          )
        }
        dispatchCartUpdated()
      }
    }

    const cart = getLocalCart()
    const existingIdx = cart.findIndex(
      (i) => i.productId === params.productId && i.variantId === params.variationId
    )
    if (existingIdx >= 0) {
      cart[existingIdx].quantity += params.quantity
    } else {
      cart.push(optimisticItem)
    }
    setLocalCart(cart)
    cachedCartItems = cart
    dispatchCartUpdated()
  },

  async updateQuantity(productId: number, variantId: number | null | undefined, delta: number): Promise<void> {
    if (this.isUsingApi()) {
      syncCachedItemsFromLocal()
      const items = cachedCartItems || []
      const item = items.find((i) => i.productId === productId && i.variantId === (variantId ?? null))
      if (item?.cartItemId) {
        const action = delta > 0 ? 'increase' : 'decrease'
        item.quantity += delta
        if (item.quantity <= 0) {
          cachedCartItems = items.filter((i) => !(i.productId === productId && i.variantId === (variantId ?? null)))
        }
        dispatchCartUpdated()

        try {
          await api.put('/api/v1/cart/update-quantity/', {
            cart_item_id: item.cartItemId,
            action,
          })
          notifyCartErrorListeners(null)
          await this.getCart(true)
          dispatchCartUpdated()
          return
        } catch (err: any) {
          const status = err?.response?.status
          const message = err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Failed to update cart quantity'
          console.error(`[cartService] PUT /api/v1/cart/update-quantity/ failed (${status || 'network'}):`, message, err)
          notifyCartErrorListeners({ message, status, timestamp: Date.now() })
          item.quantity -= delta
          if (item.quantity <= 0) {
            cachedCartItems = getLocalCart()
          }
          dispatchCartUpdated()
        }
      }
    }

    const cart = getLocalCart()
    const idx = cart.findIndex(
      (i) => i.productId === productId && i.variantId === (variantId ?? null)
    )
    if (idx < 0) return
    const newQty = cart[idx].quantity + delta
    if (newQty <= 0) {
      cart.splice(idx, 1)
    } else {
      cart[idx].quantity = newQty
    }
    setLocalCart(cart)
    cachedCartItems = cart
    dispatchCartUpdated()
  },

  async removeItem(productId: number, variantId: number | null | undefined): Promise<void> {
    if (this.isUsingApi()) {
      syncCachedItemsFromLocal()
      const items = cachedCartItems || []
      const item = items.find((i) => i.productId === productId && i.variantId === (variantId ?? null))
      if (item?.cartItemId) {
        cachedCartItems = items.filter((i) => !(i.productId === productId && i.variantId === (variantId ?? null)))
        dispatchCartUpdated()

        try {
          await api.delete(`/api/v1/cart/remove/${item.cartItemId}/`)
          notifyCartErrorListeners(null)
          await this.getCart(true)
          dispatchCartUpdated()
          return
        } catch (err: any) {
          const status = err?.response?.status
          const message = err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Failed to remove cart item'
          console.error(`[cartService] DELETE /api/v1/cart/remove/${item.cartItemId}/ failed (${status || 'network'}):`, message, err)
          notifyCartErrorListeners({ message, status, timestamp: Date.now() })
          cachedCartItems = getLocalCart()
          dispatchCartUpdated()
        }
      }
    }

    const cart = getLocalCart()
    const idx = cart.findIndex(
      (i) => i.productId === productId && i.variantId === (variantId ?? null)
    )
    if (idx < 0) return
    cart.splice(idx, 1)
    setLocalCart(cart)
    cachedCartItems = cart
    dispatchCartUpdated()
  },

  async clearCart(): Promise<void> {
    cachedCartItems = []
    cachedCartTotals = null
    dispatchCartUpdated()

    if (this.isUsingApi()) {
      try {
        await api.delete('/api/v1/cart/clear/')
        notifyCartErrorListeners(null)
        dispatchCartUpdated()
        return
      } catch (err: any) {
        const status = err?.response?.status
        const message = err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Failed to clear cart'
        console.error(`[cartService] DELETE /api/v1/cart/clear/ failed (${status || 'network'}):`, message, err)
        notifyCartErrorListeners({ message, status, timestamp: Date.now() })
        await this.getCart(true)
        dispatchCartUpdated()
      }
    }

    localStorage.removeItem(CART_KEY)
    dispatchCartUpdated()
  },

  isInCart(productId: number, variantId?: number | null): boolean {
    const items = cachedCartItems || getLocalCart()
    return items.some((i) => i.productId === productId && i.variantId === (variantId ?? null))
  },

  getItemCountInCart(productId: number, variantId?: number | null): number {
    const items = cachedCartItems || getLocalCart()
    const item = items.find((i) => i.productId === productId && i.variantId === (variantId ?? null))
    return item?.quantity || 0
  },
}
