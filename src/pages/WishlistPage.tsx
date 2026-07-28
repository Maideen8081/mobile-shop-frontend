import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, Trash2, ShoppingCart, Loader2, ArrowLeft, Star } from 'lucide-react'
import { productService } from '../services/productService'
import { cartService } from '../services/cartService'
import StorefrontNavbar from '../components/ecommerce/StorefrontNavbar'
import EcommerceFooter from '../components/ecommerce/Footer'
import MobileWishlist from '../components/mobile/MobileWishlist'
import { useIsMobile } from '../components/mobile/helpers'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 480%22 fill=%22%23f1eeeb%22%3E%3Crect width=%22400%22 height=%22480%22/%3E%3Ctext x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2218%22 fill=%22%2322C55E%22%3EProduct%3C/text%3E%3C/svg%3E'

function resolveImage(raw: string): string {
  if (!raw) return ''
  if (raw.startsWith('http') || raw.startsWith('data:')) return raw
  return `${API_BASE_URL.replace(/\/+$/, '')}/${raw.replace(/^\/+/, '')}`
}

function formatPrice(n: number): string {
  return '₹' + n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

export default function WishlistPage() {
  const isMobile = useIsMobile()
  if (isMobile) return <MobileWishlist />
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
      const results = await Promise.allSettled(
        ids.map((id) => productService.getById(id))
      )
      const fetched = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r as PromiseFulfilledResult<any>).value)
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

  const addToCart = async (product: any) => {
    const id = product.id || product.product_id
    const name = product.product_name || product.name || ''
    const rawPrice = product.variants?.[0]?.discount_price || product.variants?.[0]?.price || product.min_price || product.price || 0
    const price = isNaN(Number(rawPrice)) ? 0 : Number(rawPrice)
    const rawImages = product.common_image || product.image || product.images?.[0] || product.thumbnail || ''
    const image = resolveImage(rawImages)
    await cartService.addItem({
      productId: id,
      variationId: 0,
      quantity: 1,
      name,
      brand: product.brand || '',
      price,
      image,
    })
    window.dispatchEvent(new Event('cart-updated'))
  }

  const totalValue = useMemo(() => {
    return products.reduce((sum, p) => {
      const rawPrice = p.variants?.[0]?.discount_price || p.variants?.[0]?.price || p.min_price || p.price || 0
      return sum + (isNaN(Number(rawPrice)) ? 0 : Number(rawPrice))
    }, 0)
  }, [products])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F2F4F6] to-[#EDF1F4] overflow-x-hidden" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Navbar */}
      <StorefrontNavbar activeLabel="Home" />

      <main className="max-w-[1600px] mx-auto px-6 pt-32 pb-40 min-h-screen">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center gap-4 mb-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="w-10 h-10 rounded-full bg-white/35 backdrop-blur-[30px] border border-white/70 flex items-center justify-center hover:bg-[#00D084]/10 hover:border-[#00D084]/30 transition-all"
            >
              <ArrowLeft size={16} className="text-[#141414]" />
            </motion.button>
            <span className="text-[11px] font-semibold text-[#00D084] uppercase tracking-[0.08em]">WISHLIST</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#141414] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            My Wishlist
          </h1>
          <p className="text-base text-[#6B7280]">
            {products.length} {products.length === 1 ? 'item' : 'items'} saved for later
          </p>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-32">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
              <Loader2 size={36} className="text-[#00D084]" />
            </motion.div>
          </div>
        ) : products.length === 0 ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white/35 backdrop-blur-[30px] rounded-[32px] p-16 border border-white/70 text-center max-w-lg mx-auto shadow-[0_15px_50px_rgba(0,0,0,0.08)]"
          >
            <div className="w-20 h-20 rounded-full bg-[#00D084]/10 flex items-center justify-center mx-auto mb-6">
              <Heart size={36} className="text-[#00D084]" />
            </div>
            <h2 className="text-2xl font-bold text-[#141414] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Your wishlist is empty</h2>
            <p className="text-sm text-[#6B7280] mb-8">Save your favorite products to find them easily later.</p>
            <Link to="/collection/all"
              className="inline-flex items-center gap-2 h-[50px] px-8 rounded-full text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #CB202D, #A81D2A)' }}
            >
              <ShoppingCart size={16} /> Browse Products
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Products Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, idx) => {
                const id = product.id || product.product_id
                const rawPrice = product.variants?.[0]?.discount_price || product.variants?.[0]?.price || product.min_price || product.price || 0
                const price = isNaN(Number(rawPrice)) ? 0 : Number(rawPrice)
                const rawImages = product.common_image || product.image || product.images?.[0] || product.thumbnail || ''
                const image = resolveImage(rawImages)
                const name = product.product_name || product.name || ''
                const brand = product.brand || ''
                const rating = Number(product.rating) || 0
                const features: string[] = Array.isArray(product.features)
                  ? product.features.map((f: any) => typeof f === 'string' ? f : f.feature_text || '').filter(Boolean)
                  : []
                const v = product.variants?.[0] || {}
                const storage = v.storage || ''
                const ram = v.ram || v.ram_size || ''
                const color = v.color || ''

                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative bg-white/35 backdrop-blur-[30px] rounded-[24px] border border-white/70 overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.08)] hover:shadow-lg transition-all duration-500"
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {/* Diagnostic beam */}
                    <div className="diagnostic-beam" />

                    {/* Top bar - badge + delete */}
                    <div className="flex items-start justify-between p-4 pb-0 relative z-10">
                      <span className="text-[10px] font-semibold text-[#00D084] bg-[#00D084]/10 px-2 py-1 rounded-full uppercase tracking-wider">
                        {rating >= 4 ? 'TOP RATED' : brand ? brand.toUpperCase() : 'WISHLISTED'}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeFromWishlist(id) }}
                        className="w-8 h-8 rounded-full bg-white/70 backdrop-blur-[10px] flex items-center justify-center text-[#6B7280] hover:bg-red-50 hover:text-red-500 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Image */}
                    <div className="relative h-52 flex items-center justify-center p-4" onClick={() => navigate(`/product/${id}`)}>
                      <motion.img
                        src={image} alt={name}
                        className="h-full object-contain drop-shadow-xl transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
                      />
                    </div>

                    {/* Content */}
                    <div className="p-4 pt-0">
                      <h3 className="text-sm font-bold text-[#141414] leading-tight mb-2 line-clamp-2" style={{ fontFamily: "'Inter', sans-serif" }}>
                        {name}
                      </h3>

                      {/* Spec chips */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {storage && (
                          <span className="text-[10px] font-semibold bg-[#141414]/10 text-[#141414] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <ShoppingCart size={10} /> {storage}
                          </span>
                        )}
                        {ram && (
                          <span className="text-[10px] font-semibold bg-[#8B5CF6]/10 text-[#8B5CF6] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Star size={10} /> {ram}
                          </span>
                        )}
                        {color && (
                          <span className="text-[10px] font-semibold text-[#6B7280] bg-white/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                            {color}
                          </span>
                        )}
                        {features.length > 0 && (
                          <span className="text-[10px] font-semibold text-[#00D084] bg-[#00D084]/10 px-2 py-0.5 rounded-full">
                            +{features.length}
                          </span>
                        )}
                      </div>

                      {/* Rating */}
                      {rating > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'conic-gradient(#00D084 ' + (rating * 20) + '%, #E5E7EB 0%)' }}>
                            <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                              <Star size={10} className="text-[#00D084]" fill="#00D084" />
                            </div>
                          </div>
                          <span className="text-xs font-semibold text-[#141414]">{rating.toFixed(1)}</span>
                        </div>
                      )}

                      {/* Price */}
                      <div className="flex items-baseline gap-1.5 mb-3">
                        <span className="text-xl font-bold text-[#141414]">{formatPrice(price)}</span>
                        {product.variants?.[0]?.price > price && (
                          <span className="text-xs text-[#6B7280] line-through">{formatPrice(Number(product.variants[0].price))}</span>
                        )}
                      </div>

                      {/* Move to Cart */}
                      <button
                        onClick={async () => { await addToCart(product); removeFromWishlist(id) }}
                        className="w-full h-11 rounded-full text-xs font-semibold text-white transition-all flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #CB202D, #A81D2A)' }}
                      >
                        <ShoppingCart size={14} /> Move to Cart
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Add new placeholder */}
            <Link to="/collection/all"
              className="mt-6 block group relative bg-white/35 backdrop-blur-[30px] rounded-[24px] border-2 border-dashed border-white/70 hover:border-[#00D084]/50 overflow-hidden shadow-[0_15px_50px_rgba(0,0,0,0.08)] transition-all duration-300"
            >
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-white/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Heart size={28} className="text-[#00D084]" />
                </div>
                <h3 className="text-lg font-bold text-[#141414] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>Discover More</h3>
                <p className="text-sm text-[#6B7280]">Browse our latest collection and save your favorites.</p>
              </div>
            </Link>
          </>
        )}
      </main>

      {/* Summary Bar */}
      {products.length > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 z-[100] bg-white/35 backdrop-blur-[30px] border-t border-white/70 shadow-[0_15px_50px_rgba(0,0,0,0.08)]"
        >
          <div className="max-w-[1600px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[#00D084]/10 flex items-center justify-center">
                  <Heart size={16} className="text-[#00D084]" fill="#00D084" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">SAVED ITEMS</p>
                  <p className="text-sm font-bold text-[#141414]">{products.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-[#141414]/5 flex items-center justify-center">
                  <span className="text-sm font-bold text-[#141414]">₹</span>
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-[#6B7280] uppercase tracking-wider">TOTAL VALUE</p>
                  <p className="text-sm font-bold text-[#141414]">{formatPrice(totalValue)}</p>
                </div>
              </div>
            </div>
            <Link to="/collection/all"
              className="h-10 px-6 rounded-full text-xs font-semibold text-white transition-all flex items-center gap-2"
              style={{ background: 'linear-gradient(135deg, #CB202D, #A81D2A)' }}
            >
              <ShoppingCart size={14} /> Browse All
            </Link>
          </div>
        </motion.div>
      )}

      <EcommerceFooter />
      <div className="h-28" />
    </div>
  )
}
