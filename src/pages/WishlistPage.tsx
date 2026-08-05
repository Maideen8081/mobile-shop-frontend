import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { productService } from '../services/productService'
import { addToCartWithAuth } from '../utils/cartAuth'
import EcommerceFooter from '../components/ecommerce/Footer'
import { useToast } from '../context/ToastContext'
import MobileWishlist from '../components/mobile/MobileWishlist'
import { useIsMobile } from '../components/mobile/helpers'
import DesktopPageLoader from '../components/ui/DesktopPageLoader'
import './CollectionPage.css'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 480%22 fill=%22%23f1eeeb%22%3E%3Crect width=%22400%22 height=%22480%22/%3E%3Ctext x=%2250%%22 y=%2250%%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2218%22 fill=%22%2322C55E%22%3EProduct%3C/text%3E%3C/svg%3E'

function getProductImage(product: any): string {
  const raw = product.common_image || product.image || product.images?.[0] || product.thumbnail || ''
  if (!raw) return FALLBACK_IMG
  if (raw.startsWith('http') || raw.startsWith('data:')) return raw
  return `${API_BASE_URL.replace(/\/+$/, '')}/${raw.replace(/^\/+/, '')}`
}

function getProductPrice(product: any): { current: number; old: number | null } {
  const v = product.variants?.[0]
  if (!v) return { current: product.min_price || 0, old: null }
  const rawPrice = v.discount_price || v.discountPrice || v.price || product.min_price || 0
  const price = isNaN(Number(rawPrice)) ? 0 : Number(rawPrice)
  const rawOld = v.price || 0
  const old = rawOld > price ? Number(rawOld) : null
  return { current: price, old }
}

function getProductName(product: any): string {
  return product.product_name ?? product.name ?? ''
}

function getProductTags(product: any): string[] {
  const tags: string[] = []
  if (product.is_trending || product.trending) tags.push('Trending')
  if (product.is_new_arrival || product.new_arrival) tags.push('New')
  if (product.is_best_selling || product.best_selling) tags.push('Best Seller')
  if (product.is_featured || product.featured) tags.push('Featured')
  return tags
}

const fmtINR = (n: number) => '₹' + Math.round(n || 0).toLocaleString('en-IN')

function WishCard(props: {
  product: any
  onWishlist: (e: React.MouseEvent) => void
  onAddToCart: (e: React.MouseEvent) => void
}) {
  const navigate = useNavigate()
  const { product, onWishlist, onAddToCart } = props
  const { current: price, old: oldPrice } = getProductPrice(product)
  const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0
  const tag = getProductTags(product)[0] || ''

  return (
    <div className="wx-product-card">
      <Link to={`/product/${product.id}`} className="wx-product-media">
        <img src={getProductImage(product)} alt={getProductName(product)} loading="lazy" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }} />
        {tag && <span className="wx-product-tag">{tag}</span>}
        <div className="wx-product-actions">
          <button className="wx-act-btn wx-liked" aria-label="Remove from wishlist" onClick={(e) => { e.preventDefault(); onWishlist(e) }}>
            <svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>
          </button>
          <button className="wx-act-btn" aria-label="Quick view" onClick={(e) => { e.preventDefault(); navigate(`/product/${product.id}`) }}>
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /></svg>
          </button>
        </div>
        <span className="wx-price-chip">{fmtINR(price)}</span>
      </Link>
      <div className="wx-product-info">
        <h4>{getProductName(product)}</h4>
        <div className="wx-product-bottom">
          <span className="wx-price">
            {fmtINR(price)}
            {discount > 0 && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', marginLeft: 6, textDecoration: 'line-through' }}>{fmtINR(oldPrice!)}</span>}
          </span>
          <div className="wx-mini-actions">
            <button className="wx-act-btn wx-liked" aria-label="Remove from wishlist" onClick={(e) => { e.stopPropagation(); onWishlist(e) }}>
              <svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>
            </button>
            <button className="wx-act-btn" aria-label="Add to cart" onClick={(e) => { e.stopPropagation(); onAddToCart(e) }}>
              <svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function WishlistPage() {
  const isMobile = useIsMobile()
  if (isMobile) return <MobileWishlist />

  const navigate = useNavigate()
  const { show: showToast } = useToast()
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
      const results = await Promise.allSettled(ids.map((id) => productService.getById(id)))
      const fetched = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r as PromiseFulfilledResult<any>).value)
      setProducts(fetched)
    } catch {
      setProducts([])
    }
    setLoading(false)
  }

  const removeFromWishlist = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    const stored: number[] = JSON.parse(localStorage.getItem('wishlist') || '[]')
    const updated = stored.filter((pid) => pid !== id)
    localStorage.setItem('wishlist', JSON.stringify(updated))
    window.dispatchEvent(new Event('wishlist-updated'))
    setProducts((prev) => prev.filter((p) => (p.id || p.product_id) !== id))
  }

  const addToCart = async (e: React.MouseEvent, product: any) => {
    e.stopPropagation()
    const id = product.id || product.product_id
    const name = getProductName(product)
    const price = getProductPrice(product).current
    const image = getProductImage(product)
    try {
      const added = await addToCartWithAuth({
        productId: id,
        variationId: 0,
        quantity: 1,
        name,
        brand: product.brand || '',
        price,
        image,
        storage: '',
        ram: '',
        color: '',
      })
      if (added) showToast(`${name} added to cart`, 'success')
    } catch (err: any) {
      showToast(err?.message || 'Failed to add to cart', 'error')
    }
  }

  const totalValue = products.reduce((sum, p) => sum + getProductPrice(p).current, 0)

  if (loading) {
    return (
      <>
        <SiteTopNav />
        <DesktopPageLoader text="Loading your wishlist..." />
        <EcommerceFooter compact />
      </>
    )
  }

  return (
    <>
      <SiteTopNav />
      <div className="wx-page min-h-screen">

          <div className="wx-wishlist-head">
          <button className="wx-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <svg viewBox="0 0 24 24"><path d="M19 12H5" /><path d="M12 19l-7-7 7-7" /></svg>
          </button>
          <div className="wx-page-head">
            <div className="wx-breadcrumb">
              <Link to="/">Home</Link>
              <span className="wx-sep">/</span>
              <span className="wx-current">Wishlist</span>
            </div>
            <h2>My Wishlist</h2>
          </div>
        </div>

        <main className="wx-wishlist-main">
          {products.length === 0 ? (
            <div className="wx-wishlist-empty">
              <div className="wx-wishlist-empty-icon">
                <svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" /></svg>
              </div>
              <h3>Your wishlist is empty</h3>
              <p>Save your favorite products to find them easily later.</p>
              <Link to="/collection/all" className="wx-wishlist-cta-btn">Browse Products</Link>
            </div>
          ) : (
            <>
              <div className="wx-grid-toolbar">
                <div className="wx-result-count">
                  {products.length} {products.length === 1 ? 'item' : 'items'} saved
                </div>
                <div className="wx-wishlist-total">
                  Total value: <b>{fmtINR(totalValue)}</b>
                </div>
              </div>

              <div className="wx-product-grid">
                {products.map((product) => (
                  <WishCard
                    key={product.id || product.product_id}
                    product={product}
                    onWishlist={(e) => removeFromWishlist(e, product.id || product.product_id)}
                    onAddToCart={(e) => addToCart(e, product)}
                  />
                ))}
              </div>

              <div className="wx-wishlist-cta">
                <Link to="/collection/all" className="wx-wishlist-cta-btn">Discover More Products</Link>
              </div>
            </>
          )}
        </main>
      </div>

      <EcommerceFooter compact />
    </>
  )
}
