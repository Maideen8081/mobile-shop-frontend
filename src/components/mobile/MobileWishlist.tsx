import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Trash2, ShoppingCart, Star, RefreshCw } from 'lucide-react'
import { productService } from '../../services/productService'
import { addManyToCartWithAuth, addToCartWithAuth } from '../../utils/cartAuth'
import {
  FALLBACK_IMAGE,
  cartParams,
  getProductImage,
  getProductName,
  getProductPrice,
  isOutOfStock,
  readWishlistIds,
  writeWishlistIds,
} from '../../utils/wishlist'
import DoubleRingLoader from '../ui/DoubleRingLoader'
import MobileTopSection from './MobileTopSection'
import MobileBottomNav from './MobileBottomNav'
import { useMobileToast } from './useMobileToast'

const PURPLE = '#CB202D'
const PURPLE_DEEP = '#A81D2A'
const card = 'bg-white rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.08)]'
const gradient = `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DEEP})`

function formatPrice(n: number): string {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

const productId = (p: any) => Number(p.id || p.product_id)

export default function MobileWishlist() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [addingIds, setAddingIds] = useState<number[]>([])
  const [movingAll, setMovingAll] = useState(false)
  const [unavailableCount, setUnavailableCount] = useState(0)
  const { show: showToast, Toast } = useMobileToast()

  const loadWishlist = useCallback(async () => {
    const ids = readWishlistIds()
    if (ids.length === 0) {
      setProducts([])
      setUnavailableCount(0)
      setLoading(false)
      return
    }
    setLoading(true)
    const results = await Promise.allSettled(ids.map((id) => productService.getById(id)))
    const fetched = results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map((r) => r.value)
    setProducts(fetched)
    setUnavailableCount(ids.length - fetched.length)
    setLoading(false)
  }, [])

  useEffect(() => {
    loadWishlist()
    // Keep only products that are still saved (e.g. removed from another page).
    const handler = () => {
      const ids = readWishlistIds()
      setProducts((prev) => prev.filter((p) => ids.includes(productId(p))))
    }
    window.addEventListener('wishlist-updated', handler)
    return () => window.removeEventListener('wishlist-updated', handler)
  }, [loadWishlist])

  const removeFromWishlist = (id: number) => {
    writeWishlistIds(readWishlistIds().filter((pid) => pid !== id))
    setProducts((prev) => prev.filter((p) => productId(p) !== id))
  }

  const moveToCart = async (product: any) => {
    const id = productId(product)
    if (addingIds.includes(id) || isOutOfStock(product)) return
    setAddingIds((ids) => [...ids, id])
    try {
      const added = await addToCartWithAuth(cartParams(product))
      if (added) {
        removeFromWishlist(id)
        showToast(`${getProductName(product)} moved to cart`, 'success')
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to add to cart', 'error')
    } finally {
      setAddingIds((ids) => ids.filter((x) => x !== id))
    }
  }

  // One request for everything, so the cart badge and the toast update together.
  const moveAllToCart = async () => {
    if (products.length === 0 || movingAll) return
    const inStock = products.filter((p) => !isOutOfStock(p))
    let failed = products.length - inStock.length

    setMovingAll(true)
    try {
      const result = await addManyToCartWithAuth(inStock.map(cartParams))
      if (!result) return // redirected to login
      const movedIds = result.added
      failed += result.failed.length

      if (movedIds.length > 0) {
        writeWishlistIds(readWishlistIds().filter((id) => !movedIds.includes(id)))
        setProducts((prev) => prev.filter((p) => !movedIds.includes(productId(p))))
      }
      if (failed === 0) {
        showToast(`${movedIds.length} item${movedIds.length !== 1 ? 's' : ''} moved to cart`, 'success')
      } else {
        showToast(`${movedIds.length} moved · ${failed} couldn't be added`, 'error')
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Couldn’t move items to cart', 'error')
    } finally {
      setMovingAll(false)
    }
  }

  const totalValue = products.reduce((sum, p) => sum + getProductPrice(p).current, 0)
  const allOutOfStock = products.length > 0 && products.every(isOutOfStock)

  return (
    <div className="min-h-screen bg-[#FFFBFB] max-w-[480px] mx-auto overflow-x-hidden" style={{ fontFamily: 'var(--font-ui)' }}>
      <MobileTopSection title="My Wishlist" subtitle={`${products.length} ${products.length === 1 ? 'item' : 'items'} saved`} icon="wishlist" />

      <div className={`px-4 pt-4 ${products.length > 0 ? 'pb-[calc(180px+env(safe-area-inset-bottom))]' : 'pb-28'}`}>
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <DoubleRingLoader size={48} label="Loading your wishlist…" />
          </div>
        ) : products.length === 0 ? (
          <div className={`${card} rounded-[24px] p-10 text-center mt-10`}>
            <div className="w-20 h-20 rounded-[8px] mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgba(203,32,45,0.1)' }}>
              <Heart size={34} style={{ color: PURPLE }} />
            </div>
            <h2 className="text-[18px] font-bold text-[#1F2937] mb-1">Your wishlist is empty</h2>
            <p className="text-[13px] text-[#6B7280] mb-6">Save your favorite products to find them easily later.</p>
            <button onClick={() => navigate('/collection/all')} className="h-12 px-7 rounded-[8px] text-[14px] font-semibold text-white inline-flex items-center gap-2"
              style={{ background: gradient }}>
              <ShoppingCart size={16} /> Browse Products
            </button>
          </div>
        ) : (
          <>
            {unavailableCount > 0 && (
              <div className="mb-3 px-4 py-3 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] flex items-center justify-between gap-3" role="alert">
                <span className="text-[12px] font-medium text-[#991B1B]">
                  {unavailableCount} saved {unavailableCount === 1 ? 'item' : 'items'} could not be loaded.
                </span>
                <button onClick={loadWishlist} className="flex items-center gap-1 text-[12px] font-semibold flex-shrink-0" style={{ color: PURPLE }}>
                  <RefreshCw size={13} /> Retry
                </button>
              </div>
            )}

            <div className="space-y-3">
              {products.map((product) => {
                const id = productId(product)
                const { current: price, old } = getProductPrice(product)
                const name = getProductName(product)
                const brand = product.brand || ''
                const rating = Number(product.rating) || 0
                const outOfStock = isOutOfStock(product)
                const adding = addingIds.includes(id)
                const off = old && old > price ? Math.round(((old - price) / old) * 100) : 0

                return (
                  <div key={id} className={`${card} p-3 overflow-hidden`}>
                    <div className="flex gap-3">
                      <button className="w-[88px] h-[88px] rounded-[16px] bg-[#FFFBFB] flex items-center justify-center flex-shrink-0 overflow-hidden" onClick={() => navigate(`/product/${id}`)} aria-label={`View ${name}`}>
                        <img
                          src={getProductImage(product)}
                          alt=""
                          loading="lazy"
                          className="w-full h-full object-contain"
                          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE }}
                        />
                      </button>
                      <div className="flex-1 min-w-0 flex flex-col">
                        {brand && <span className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: PURPLE }}>{brand}</span>}
                        <h3 className="text-[14px] font-semibold text-[#1F2937] leading-tight line-clamp-2" onClick={() => navigate(`/product/${id}`)}>{name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          {rating > 0 && (
                            <span className="flex items-center gap-1">
                              <Star size={12} style={{ color: '#F59E0B' }} fill="#F59E0B" />
                              <span className="text-[11px] font-semibold text-[#1F2937]">{rating.toFixed(1)}</span>
                            </span>
                          )}
                          <span className={`text-[11px] font-semibold ${outOfStock ? 'text-[#EF4444]' : 'text-[#16A34A]'}`}>
                            {outOfStock ? 'Out of stock' : 'In stock'}
                          </span>
                        </div>
                        <div className="flex items-baseline flex-wrap gap-x-2 mt-auto pt-1">
                          <span className="text-[16px] font-bold text-[#1F2937]">{formatPrice(price)}</span>
                          {off > 0 && (
                            <>
                              <span className="text-[11px] text-[#9CA3AF] line-through">{formatPrice(old!)}</span>
                              <span className="text-[11px] font-semibold text-[#16A34A]">{off}% off</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button onClick={() => { removeFromWishlist(id); showToast('Removed from wishlist', 'success') }}
                        aria-label={`Remove ${name} from wishlist`}
                        className="w-8 h-8 rounded-[8px] bg-[#FFFBFB] flex items-center justify-center flex-shrink-0"
                        style={{ color: '#EF4444' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <button onClick={() => moveToCart(product)}
                      disabled={outOfStock || adding || movingAll}
                      className="w-full h-10 mt-3 rounded-2xl text-[13px] font-semibold text-white inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition disabled:opacity-50"
                      style={{ background: outOfStock ? '#9CA3AF' : gradient }}>
                      <ShoppingCart size={15} /> {adding ? 'Adding…' : outOfStock ? 'Unavailable' : 'Move to Cart'}
                    </button>
                  </div>
                )
              })}
            </div>

            <button onClick={() => navigate('/collection/all')} className={`${card} py-5 mt-3 w-full flex flex-col items-center justify-center text-center gap-0.5`}>
              <div className="w-12 h-12 rounded-[8px] mb-2 flex items-center justify-center" style={{ background: 'rgba(203,32,45,0.1)' }}>
                <Heart size={22} style={{ color: PURPLE }} />
              </div>
              <h3 className="text-[14px] font-bold text-[#1F2937] w-full text-center">Discover More</h3>
              <p className="text-[12px] text-[#6B7280] w-full text-center">Browse our latest collection</p>
            </button>
          </>
        )}
      </div>

      {products.length > 0 && (
        <div className="fixed bottom-[calc(88px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 max-w-[456px] z-40 bg-white w-[calc(100%-24px)] rounded-2xl border border-[#EEF0F6] shadow-[0_8px_24px_rgba(0,0,0,0.10)] px-4 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wide">Total Value</p>
            <p className="text-[16px] font-bold text-[#1F2937] truncate">{formatPrice(totalValue)}</p>
          </div>
          <button onClick={moveAllToCart} disabled={movingAll || allOutOfStock}
            className="h-11 px-5 rounded-[8px] text-[13px] font-semibold text-white inline-flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
            style={{ background: gradient }}>
            {movingAll ? <RefreshCw size={15} className="animate-spin" /> : <ShoppingCart size={15} />}
            {movingAll ? 'Moving…' : `Move All (${products.length})`}
          </button>
        </div>
      )}
      <MobileBottomNav />
      {Toast}
    </div>
  )
}
