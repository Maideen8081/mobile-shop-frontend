import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Trash2, ShoppingCart, Loader2, Star } from 'lucide-react'
import { getImageUrl } from './helpers'
import MobileTopSection from './MobileTopSection'

const PURPLE = '#6C3BFF'
const PURPLE_DEEP = '#4B2ECC'
const SUCCESS = '#16A34A'
const card = 'bg-white rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.08)]'

function resolveImage(raw: string): string {
  if (!raw) return ''
  if (raw.startsWith('http') || raw.startsWith('data:')) return raw
  return getImageUrl(raw)
}

function formatPrice(n: number): string {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export default function MobileWishlist() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWishlist()
    const handler = () => loadWishlist()
    window.addEventListener('wishlist-updated', handler)
    return () => window.removeEventListener('wishlist-updated', handler)
  }, [])

  const loadWishlist = async () => {
    setLoading(true)
    try {
      const ids: number[] = JSON.parse(localStorage.getItem('wishlist') || '[]')
      if (ids.length === 0) {
        setProducts([])
        setLoading(false)
        return
      }
      const { productService } = await import('../../services/productService')
      const results = await Promise.allSettled(ids.map((id) => productService.getById(id)))
      const fetched = results.filter((r) => r.status === 'fulfilled').map((r) => (r as PromiseFulfilledResult<any>).value)
      setProducts(fetched)
    } catch {
      setProducts([])
    }
    setLoading(false)
  }

  const removeFromWishlist = (id: number) => {
    const stored: number[] = JSON.parse(localStorage.getItem('wishlist') || '[]')
    const updated = stored.filter((pid) => pid !== id)
    localStorage.setItem('wishlist', JSON.stringify(updated))
    window.dispatchEvent(new Event('wishlist-updated'))
    setProducts((prev) => prev.filter((p) => (p.id || p.product_id) !== id))
  }

  const addToCart = (product: any) => {
    const id = product.id || product.product_id
    const name = product.product_name || product.name || ''
    const rawPrice = product.variants?.[0]?.discount_price || product.variants?.[0]?.price || product.min_price || product.price || 0
    const price = isNaN(Number(rawPrice)) ? 0 : Number(rawPrice)
    const rawImages = product.common_image || product.image || product.images?.[0] || product.thumbnail || ''
    const image = resolveImage(rawImages)
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existingIdx = cart.findIndex((item: any) => item.productId === id)
    if (existingIdx >= 0) cart[existingIdx].quantity += 1
    else cart.push({ productId: id, variantId: null, name, brand: product.brand || '', price, image, quantity: 1 })
    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('cart-updated'))
  }

  const totalValue = useMemo(() => {
    return products.reduce((sum, p) => {
      const rawPrice = p.variants?.[0]?.discount_price || p.variants?.[0]?.price || p.min_price || p.price || 0
      return sum + (isNaN(Number(rawPrice)) ? 0 : Number(rawPrice))
    }, 0)
  }, [products])

  return (
    <div className="min-h-screen bg-[#F8F9FF] max-w-[480px] mx-auto" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
      {/* Header */}
      <MobileTopSection title="My Wishlist" subtitle={`${products.length} ${products.length === 1 ? 'item' : 'items'} saved`} icon="wishlist" />

      <div className="px-4 pb-28 pt-4">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 size={32} className="animate-spin" style={{ color: PURPLE }} />
          </div>
        ) : products.length === 0 ? (
          <div className={`${card} rounded-[24px] p-10 text-center mt-10`}>
            <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgba(108,59,255,0.1)' }}>
              <Heart size={34} style={{ color: PURPLE }} />
            </div>
            <h2 className="text-[18px] font-bold text-[#1F2937] mb-1">Your wishlist is empty</h2>
            <p className="text-[13px] text-[#6B7280] mb-6">Save your favorite products to find them easily later.</p>
            <button onClick={() => navigate('/collection/all')} className="h-12 px-7 rounded-full text-[14px] font-semibold text-white inline-flex items-center gap-2"
              style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DEEP})` }}>
              <ShoppingCart size={16} /> Browse Products
            </button>
          </div>
        ) : (
          <>
            <button onClick={() => products.forEach(p => { addToCart(p); removeFromWishlist(p.id || p.product_id) })}
              className={`${card} rounded-[16px] py-3 w-full flex items-center justify-center gap-2 text-[13px] font-semibold mb-3`}
              style={{ color: PURPLE }}>
              <ShoppingCart size={15} /> Move All to Cart ({products.length})
            </button>
            <div className="space-y-3">
              {products.map((product, idx) => {
                const id = product.id || product.product_id
                const rawPrice = product.variants?.[0]?.discount_price || product.variants?.[0]?.price || product.min_price || product.price || 0
                const price = isNaN(Number(rawPrice)) ? 0 : Number(rawPrice)
                const rawImages = product.common_image || product.image || product.images?.[0] || product.thumbnail || ''
                const image = resolveImage(rawImages)
                const name = product.product_name || product.name || ''
                const brand = product.brand || ''
                const rating = Number(product.rating) || 0
                const mrp = product.variants?.[0]?.price || 0

                return (
                  <div key={id} className={`${card} rounded-[20px] p-3 overflow-hidden`}>
                    <div className="flex gap-3">
                      <div className="w-[88px] h-[88px] rounded-[16px] bg-[#F8F9FF] flex items-center justify-center flex-shrink-0 overflow-hidden" onClick={() => navigate(`/product/${id}`)}>
                        {image ? (
                          <img src={image} alt={name} className="w-full h-full object-contain" />
                        ) : (
                          <ShoppingCart size={28} className="text-[#D1D5DB]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        {brand && <span className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: PURPLE }}>{brand}</span>}
                        <h3 className="text-[14px] font-semibold text-[#1F2937] leading-tight line-clamp-2" onClick={() => navigate(`/product/${id}`)}>{name}</h3>
                        {rating > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Star size={12} style={{ color: '#F59E0B' }} fill="#F59E0B" />
                            <span className="text-[11px] font-semibold text-[#1F2937]">{rating.toFixed(1)}</span>
                          </div>
                        )}
                        <div className="flex items-baseline gap-2 mt-auto">
                          <span className="text-[16px] font-bold text-[#1F2937]">{formatPrice(price)}</span>
                          {mrp > price && <span className="text-[11px] text-[#9CA3AF] line-through">{formatPrice(Number(mrp))}</span>}
                        </div>
                      </div>
                      <button onClick={() => removeFromWishlist(id)}
                        className="w-8 h-8 rounded-full bg-[#F8F9FF] flex items-center justify-center flex-shrink-0"
                        style={{ color: '#EF4444' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <button onClick={() => { addToCart(product); removeFromWishlist(id) }}
                      className="w-full h-10 mt-3 rounded-2xl text-[13px] font-semibold text-white inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
                      style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DEEP})` }}>
                      <ShoppingCart size={15} /> Move to Cart
                    </button>
                  </div>
                )
              })}
            </div>

            <button onClick={() => navigate('/collection/all')} className={`${card} rounded-[20px] py-5 mt-3 w-full flex flex-col items-center justify-center text-center gap-0.5`}>
              <div className="w-12 h-12 rounded-full mb-2 flex items-center justify-center" style={{ background: 'rgba(108,59,255,0.1)' }}>
                <Heart size={22} style={{ color: PURPLE }} />
              </div>
              <h3 className="text-[14px] font-bold text-[#1F2937] w-full text-center">Discover More</h3>
              <p className="text-[12px] text-[#6B7280] w-full text-center">Browse our latest collection</p>
            </button>
          </>
        )}
      </div>

      {products.length > 0 && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 bg-white border-t border-[#EEF0F6] px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">Total Value</p>
            <p className="text-[16px] font-bold text-[#1F2937]">{formatPrice(totalValue)}</p>
          </div>
          <button onClick={() => navigate('/collection/all')} className="h-11 px-6 rounded-full text-[13px] font-semibold text-white inline-flex items-center gap-2"
            style={{ background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DEEP})` }}>
            <ShoppingCart size={15} /> Browse All
          </button>
        </div>
      )}
    </div>
  )
}
