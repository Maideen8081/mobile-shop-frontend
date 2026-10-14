// Wishlist helpers shared by the desktop WishlistPage and MobileWishlist.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80'

export function getProductImage(product: any): string {
  const raw = product.common_image || product.image || product.images?.[0] || product.thumbnail || ''
  if (!raw) return FALLBACK_IMAGE
  if (raw.startsWith('http') || raw.startsWith('data:')) return raw
  return `${API_BASE_URL.replace(/\/+$/, '')}/${raw.replace(/^\/+/, '')}`
}

export function getProductPrice(product: any): { current: number; old: number | null } {
  const v = product.variants?.[0]
  if (!v) return { current: product.min_price || 0, old: null }
  const rawPrice = v.discount_price || v.discountPrice || v.price || product.min_price || 0
  const price = isNaN(Number(rawPrice)) ? 0 : Number(rawPrice)
  const rawOld = v.price || 0
  const old = rawOld > price ? Number(rawOld) : null
  return { current: price, old }
}

export function getProductName(product: any): string {
  return product.product_name ?? product.name ?? ''
}

// Some pages store wishlist entries as ids, others as { id } objects.
export function readWishlistIds(): number[] {
  try {
    const stored: any[] = JSON.parse(localStorage.getItem('wishlist') || '[]')
    return [...new Set(stored.map((x) => Number(typeof x === 'object' && x ? x.id : x)).filter(Boolean))]
  } catch {
    return []
  }
}

export function writeWishlistIds(ids: number[]) {
  localStorage.setItem('wishlist', JSON.stringify(ids))
  window.dispatchEvent(new Event('wishlist-updated'))
}

const sellingPrice = (v: any) => (Number(v.discountPrice) > 0 ? Number(v.discountPrice) : Number(v.price) || 0)

/** Cheapest in-stock variant, or null when nothing can be bought. */
export function pickVariant(product: any): any | null {
  const variants: any[] = product.variants || []
  return variants
    .filter((v) => Number(v.stock) > 0)
    .sort((a, b) => sellingPrice(a) - sellingPrice(b))[0] || null
}

export function isOutOfStock(product: any): boolean {
  return (product.variants || []).length > 0 && !pickVariant(product)
}

export function cartParams(product: any) {
  const v = pickVariant(product)
  return {
    productId: Number(product.id || product.product_id),
    variationId: v ? Number(v.id) : 0,
    quantity: 1,
    name: getProductName(product),
    brand: product.brand || '',
    price: v ? sellingPrice(v) : getProductPrice(product).current,
    image: getProductImage(product),
    storage: v?.storage || '',
    ram: v?.ram || '',
    color: v?.color || '',
  }
}
