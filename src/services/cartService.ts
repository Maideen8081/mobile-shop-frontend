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
  /** Original (pre-discount) unit price, when the server provides one. */
  mrp?: number
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock'
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
    mrp: Number(item.price),
    stockStatus: item.stock_status,
  }
}

function apiErrorMessage(err: any, fallback: string): string {
  const data = err?.response?.data
  return data?.message || data?.detail || data?.error || err?.message || fallback
}

/** Stores a server cart payload as the cached cart. Returns whether it changed. */
function applyServerCart(body: any): { items: CartItem[]; totals: CartTotals; changed: boolean } {
  const items = (body?.products || []).map(mapApiItem)
  const totals: CartTotals = {
    subtotal: Number(body?.subtotal || 0),
    tax: Number(body?.tax || 0),
    shippingCharge: Number(body?.shipping_charge || 0),
    discount: Number(body?.discount || 0),
    grandTotal: Number(body?.grand_total || 0),
    quantity: Number(body?.quantity || 0),
    cartId: body?.cart_id,
  }
  const changed = JSON.stringify(cachedCartItems ?? getLocalCart()) !== JSON.stringify(items)
  cachedCartItems = items
  cachedCartTotals = totals
  cartCacheTimestamp = Date.now()
  setLocalCart(items)
  return { items, totals, changed }
}

export interface BulkAddItem {
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
}

export interface BulkAddResult {
  added: number[]
  failed: { productId: number; message: string }[]
}

// 0, null and undefined all mean "no specific variant".
function sameVariant(a: number | null | undefined, b: number | null | undefined): boolean {
  return (a || null) === (b || null)
}

function findItem(items: CartItem[], productId: number, variantId: number | null | undefined) {
  return items.find((i) => i.productId === productId && sameVariant(i.variantId, variantId))
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
      // The server is the source of truth: if it disagrees with what we had
      // cached (e.g. stale local items), let the badge and other views resync.
      const { items, totals, changed } = applyServerCart(res.data?.data || res.data)
      if (changed) dispatchCartUpdated()
      return { items, totals }
    } catch (err: any) {
      const status = err?.response?.status
      const message = apiErrorMessage(err, 'Cart API error')
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
      return cachedCartItems.reduce((s, i) => s + i.quantity, 0)
    }
    const { items, totals } = await this.getCart()
    if (items && items.length > 0) return items.reduce((s, i) => s + i.quantity, 0)
    return totals?.quantity || 0
  },

  getCachedCartCount(): number {
    if (cachedCartItems) {
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
        (i) => i.productId === params.productId && sameVariant(i.variantId, params.variationId)
      )
      if (existingIdx >= 0) {
        cachedCartItems![existingIdx].quantity += params.quantity
      } else {
        if (!cachedCartItems) cachedCartItems = []
        cachedCartItems.push(optimisticItem)
      }
      dispatchCartUpdated()

      try {
        const res = await api.post('/api/v1/cart/add/', {
          product_id: params.productId,
          // null lets the server pick the product's default variant.
          variation_id: params.variationId || null,
          quantity: params.quantity,
        })
        notifyCartErrorListeners(null)
        // The add response already carries the updated cart — no second round trip.
        const body = res.data?.data
        if (body?.products) applyServerCart(body)
        else await this.getCart(true)
        dispatchCartUpdated()
        return
      } catch (err: any) {
        const status = err?.response?.status
        const message = apiErrorMessage(err, 'Failed to add item to cart')
        console.error(`[cartService] POST /api/v1/cart/add/ failed (${status || 'network'}):`, message, err)
        notifyCartErrorListeners({ message, status, timestamp: Date.now() })
        if (existingIdx >= 0) {
          cachedCartItems![existingIdx].quantity -= params.quantity
          if (cachedCartItems![existingIdx].quantity <= 0) {
            cachedCartItems!.splice(existingIdx, 1)
          }
        } else {
          cachedCartItems = (cachedCartItems || []).filter(
            (i) => !(i.productId === params.productId && sameVariant(i.variantId, params.variationId))
          )
        }
        dispatchCartUpdated()
        // Don't fall back to a local-only cart: the next server refresh would
        // silently drop the item. Let the caller show the real reason instead.
        throw new Error(message)
      }
    }

    const cart = getLocalCart()
    const existingIdx = cart.findIndex(
      (i) => i.productId === params.productId && sameVariant(i.variantId, params.variationId)
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

  /**
   * Adds several products in one request. The cached cart (and the nav badge)
   * only change once the server answers, so callers can show their toast in the
   * same moment the count updates.
   */
  async addItems(items: BulkAddItem[]): Promise<BulkAddResult> {
    if (items.length === 0) return { added: [], failed: [] }

    if (!this.isUsingApi()) {
      for (const it of items) await this.addItem(it)
      return { added: items.map((i) => i.productId), failed: [] }
    }

    try {
      const res = await api.post('/api/v1/cart/add-bulk/', {
        items: items.map((i) => ({
          product_id: i.productId,
          variation_id: i.variationId || null,
          quantity: i.quantity || 1,
        })),
      })
      notifyCartErrorListeners(null)
      if (res.data?.data) applyServerCart(res.data.data)
      dispatchCartUpdated()
      return {
        added: (res.data?.added || []).map(Number),
        failed: (res.data?.failed || []).map((f: any) => ({
          productId: Number(f.product_id),
          message: f.message || 'could not be added',
        })),
      }
    } catch (err: any) {
      const status = err?.response?.status
      if (status === 404) {
        // Backend without the bulk endpoint yet: add one at a time instead.
        const result: BulkAddResult = { added: [], failed: [] }
        for (const it of items) {
          try {
            await this.addItem(it)
            result.added.push(it.productId)
          } catch (e) {
            result.failed.push({ productId: it.productId, message: e instanceof Error ? e.message : 'could not be added' })
          }
        }
        return result
      }
      const message = apiErrorMessage(err, 'Failed to add items to cart')
      console.error(`[cartService] POST /api/v1/cart/add-bulk/ failed (${status || 'network'}):`, message, err)
      notifyCartErrorListeners({ message, status, timestamp: Date.now() })
      throw new Error(message)
    }
  },

  async updateQuantity(productId: number, variantId: number | null | undefined, delta: number): Promise<void> {
    if (this.isUsingApi()) {
      syncCachedItemsFromLocal()
      let item = findItem(cachedCartItems || [], productId, variantId)
      if (!item?.cartItemId) {
        // Cached copy predates the server's ids (e.g. optimistic add) — refresh.
        item = findItem((await this.getCart(true)).items, productId, variantId)
      }
      if (item?.cartItemId) {
        const items = cachedCartItems || []
        const action = delta > 0 ? 'increase' : 'decrease'
        item.quantity += delta
        if (item.quantity <= 0) {
          cachedCartItems = items.filter((i) => i !== item)
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
          const message = apiErrorMessage(err, 'Failed to update cart quantity')
          console.error(`[cartService] PUT /api/v1/cart/update-quantity/ failed (${status || 'network'}):`, message, err)
          notifyCartErrorListeners({ message, status, timestamp: Date.now() })
          await this.getCart(true)
          dispatchCartUpdated()
        }
      }
      return
    }

    const cart = getLocalCart()
    const idx = cart.findIndex((i) => i.productId === productId && sameVariant(i.variantId, variantId))
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
      let item = findItem(cachedCartItems || [], productId, variantId)
      if (!item?.cartItemId) {
        item = findItem((await this.getCart(true)).items, productId, variantId)
      }
      if (item?.cartItemId) {
        cachedCartItems = (cachedCartItems || []).filter((i) => i !== item)
        dispatchCartUpdated()

        try {
          await api.delete(`/api/v1/cart/remove/${item.cartItemId}/`)
          notifyCartErrorListeners(null)
          await this.getCart(true)
          dispatchCartUpdated()
          return
        } catch (err: any) {
          const status = err?.response?.status
          const message = apiErrorMessage(err, 'Failed to remove cart item')
          console.error(`[cartService] DELETE /api/v1/cart/remove/${item.cartItemId}/ failed (${status || 'network'}):`, message, err)
          notifyCartErrorListeners({ message, status, timestamp: Date.now() })
          await this.getCart(true)
          dispatchCartUpdated()
        }
      }
      return
    }

    const cart = getLocalCart()
    const idx = cart.findIndex((i) => i.productId === productId && sameVariant(i.variantId, variantId))
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
        localStorage.removeItem(CART_KEY)
        dispatchCartUpdated()
        return
      } catch (err: any) {
        const status = err?.response?.status
        const message = apiErrorMessage(err, 'Failed to clear cart')
        console.error(`[cartService] DELETE /api/v1/cart/clear/ failed (${status || 'network'}):`, message, err)
        notifyCartErrorListeners({ message, status, timestamp: Date.now() })
        await this.getCart(true)
        dispatchCartUpdated()
        return
      }
    }

    localStorage.removeItem(CART_KEY)
    dispatchCartUpdated()
  },

  isInCart(productId: number, variantId?: number | null): boolean {
    const items = cachedCartItems || getLocalCart()
    return items.some((i) => i.productId === productId && sameVariant(i.variantId, variantId))
  },

  getItemCountInCart(productId: number, variantId?: number | null): number {
    const items = cachedCartItems || getLocalCart()
    return findItem(items, productId, variantId)?.quantity || 0
  },
}
