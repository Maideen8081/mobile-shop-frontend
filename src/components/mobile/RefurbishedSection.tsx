import RefurbishedShowcase, { type RefurbishedDevice } from '../ecommerce/RefurbishedShowcase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const getImageUrl = (path: string | null | undefined): string => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  if (path.startsWith('/') || /^[\w\-./]+$/.test(path))
    return `${API_BASE_URL.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`
  return ''
}

const getProductImage = (product: any): string =>
  getImageUrl(
    product.common_image ||
      product.image ||
      product.images?.[0] ||
      product.thumbnail ||
      product.variants?.[0]?.images?.[0] ||
      '',
  )

/* Selling price + MRP, same fallbacks as the desktop landing page. */
const priceOf = (product: any): { price: number; mrp: number } => {
  const variant = product?.variants?.[0]
  const price =
    Number(variant?.discountPrice) ||
    Number(variant?.price) ||
    Number(product?.minPrice) ||
    Number(product?.rawDiscountPrice) ||
    Number(product?.discountPrice) ||
    Number(product?.price) ||
    0
  const mrp = Number(variant?.price) || Number(product?.price) || price
  return { price, mrp: Math.max(mrp, price) }
}

/** Mobile home's certified-refurbished band — reuses the desktop showcase UI. */
export default function RefurbishedSection({ products, loading = false }: { products: any[]; loading?: boolean }) {
  const devices: RefurbishedDevice[] = products.slice(0, 8).map((product) => {
    const variant = product?.variants?.[0] ?? product
    const { price, mrp } = priceOf(product)
    const rating = Number(product?.rating || 0)
    return {
      id: Number(product.id),
      name: String(product.name ?? ''),
      image: getProductImage(product),
      price,
      mrp,
      save: Math.max(0, mrp - price),
      meta: [variant?.storage, variant?.color].filter(Boolean).join(' · '),
      rating,
      grade: rating >= 4.7 ? 'Like new' : rating >= 4.4 ? 'Excellent' : 'Good',
    }
  })

  if (!loading && devices.length === 0) return null
  return <RefurbishedShowcase devices={devices} loading={loading} />
}
