import { useEffect, useState } from 'react'
import { productService } from '../../services/productService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export const FREE_SHIPPING_THRESHOLD = 1200
export const TAX_RATE = 0.12
export const DELIVERY_CHARGE = 49

export interface CartItem {
  productId: number
  variantId?: number | null
  name: string
  brand?: string
  price: number
  quantity: number
  emoji?: string
  image?: string
  storage?: string
  ram?: string
  color?: string
  category?: string
}

export interface StockInfo {
  stock: number
  name: string
  loading: boolean
  error?: string
}

export const VALID_COUPONS: Record<string, { discount: number; label: string; fixed?: boolean }> = {
  PHONE10: { discount: 0.1, label: '10% Off' },
  FIX20: { discount: 0.2, label: '20% Off' },
  MINT50: { discount: 50, label: '₹50 Off', fixed: true },
}

export function resolveImage(item: CartItem): string {
  if (item.image) {
    if (item.image.startsWith('http') || item.image.startsWith('data:')) return item.image
    return `${API_BASE_URL.replace(/\/$/, '')}/${item.image.replace(/^\//, '')}`
  }
  return ''
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('cart') || '[]') } catch { return [] }
  })
  useEffect(() => {
    const handler = () => {
      try { const c = JSON.parse(localStorage.getItem('cart') || '[]'); setItems(c) } catch { setItems([]) }
    }
    window.addEventListener('cart-updated', handler)
    return () => window.removeEventListener('cart-updated', handler)
  }, [])

  const persist = (next: CartItem[]) => {
    setItems(next)
    localStorage.setItem('cart', JSON.stringify(next))
    window.dispatchEvent(new Event('cart-updated'))
  }

  const updateQuantity = (productId: number, delta: number) => {
    const next = items.map((item) => {
      if (item.productId !== productId) return item
      const qty = Math.max(0, item.quantity + delta)
      return qty === 0 ? null : { ...item, quantity: qty }
    }).filter(Boolean) as CartItem[]
    persist(next)
  }

  const removeItem = (productId: number) => {
    persist(items.filter((item) => item.productId !== productId))
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
  const totalItems = items.reduce((s, i) => s + i.quantity, 0)

  return { items, updateQuantity, removeItem, subtotal, totalItems }
}

export function useStockInfo(items: CartItem[]): Record<string, StockInfo> {
  const [stockMap, setStockMap] = useState<Record<string, StockInfo>>({})

  useEffect(() => {
    const unique = new Map<string, { productId: number }>()
    items.forEach((item) => {
      const key = `${item.productId}-${item.variantId || 'default'}`
      if (!unique.has(key)) unique.set(key, { productId: item.productId })
    })

    unique.forEach((val, key) => {
      if (stockMap[key]?.loading) return
      setStockMap((prev) => ({ ...prev, [key]: { stock: 0, name: '', loading: true } }))

      productService.getById(val.productId)
        .then((product: any) => {
          const variantId = key.includes('default') ? null : Number(key.split('-')[1])
          let stock = 0
          if (variantId && product.variants) {
            const v = product.variants.find((v: any) => Number(v.id) === variantId)
            stock = v?.stock ?? 0
          } else if (product.variants?.length > 0) {
            stock = product.variants[0].stock ?? 0
          } else {
            stock = product.stock ?? 0
          }
          setStockMap((prev) => ({ ...prev, [key]: { stock, name: product.name || '', loading: false } }))
        })
        .catch(() => {
          setStockMap((prev) => ({ ...prev, [key]: { stock: 0, name: '', loading: false, error: 'Failed to load' } }))
        })
    })
  }, [items])

  return stockMap
}
