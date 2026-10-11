import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { productService } from '../services/productService'
import { addToCartWithAuth } from '../utils/cartAuth'
import { useToast } from '../context/ToastContext'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import EcommerceFooter from '../components/ecommerce/Footer'
import './WishlistPage.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function getProductImage(product: any): string {
  const raw = product.common_image || product.image || product.images?.[0] || product.thumbnail || ''
  if (!raw) return 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80'
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

interface WishCardProps {
  product: any
  onRemove: (id: number) => void
  onAddToCart: (e: React.MouseEvent<Element>, product: any) => void
}

function WishCard({ product, onRemove, onAddToCart }: WishCardProps) {
  const tag = getProductTags(product)[0] || ''
  const { current: price } = getProductPrice(product)
  const name = getProductName(product)
  const image = getProductImage(product)
  const productId = product.id || product.product_id

  return (
    <li className="wishlist-item">
      <article className="wish-card" data-id={productId}>
        <Link to={`/product/${productId}`} className="wish-card-media" aria-label={`View ${name}`}>
          {tag && <span className="wish-card-tag">{tag}</span>}
          <div className="wish-card-art" aria-hidden="true">
            <img 
              src={image} 
              alt={name} 
              loading="lazy" 
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&q=80' }}
            />
          </div>
          <button 
            className="wish-card-heart" 
            aria-label={`Remove ${name} from wishlist`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(productId) }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3c1.74 0 3.41.81 4.5 2.09C19.58 5.08 22 8.18 22 11.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </Link>
        <div className="wish-card-info">
          <div className="wish-card-cat">{tag || 'Accessories'}</div>
          <h3 className="wish-card-name"><Link to={`/product/${productId}`}>{name}</Link></h3>
          <div className="wish-card-row">
            <span className="wish-card-price">₹{price.toLocaleString('en-IN')}</span>
            <span className="wish-card-stock">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M5 12l5 5L20 7"/>
              </svg>
              In stock
            </span>
          </div>
          <button 
            className="btn btn-primary btn-sm wish-card-cart"
            onClick={(e) => onAddToCart(e, product)}
            disabled={false}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <circle cx="9" cy="21" r="1.4"/><circle cx="18" cy="21" r="1.4"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/>
            </svg>
            <span>Add to cart</span>
          </button>
        </div>
      </article>
    </li>
  )
}

export default function WishlistPage() {
  const navigate = useNavigate()
  const { show: showToast } = useToast()
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [addingAll, setAddingAll] = useState(false)
  const [_cart, setCart] = useState<Set<number>>(new Set())
  const [_lastRemoved, setLastRemoved] = useState<{ item: any; idx: number } | null>(null)

  useEffect(() => {
    const load = async () => {
      const ids: number[] = JSON.parse(localStorage.getItem('wishlist') || '[]')
      if (ids.length === 0) { setProducts([]); setLoading(false); return }
      const results = await Promise.allSettled(ids.map((id) => productService.getById(id)))
      const fetched = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r as PromiseFulfilledResult<any>).value)
      setProducts(fetched)
      setLoading(false)
    }
    load()
    const handler = () => { 
      const ids: number[] = JSON.parse(localStorage.getItem('wishlist') || '[]'); 
      setProducts((prev) => prev.filter((p) => !ids.includes(p.id || p.product_id))) 
    }
    window.addEventListener('wishlist-updated', handler)
    return () => window.removeEventListener('wishlist-updated', handler)
  }, [])

  const removeFromWishlist = useCallback((id: number) => {
    const stored: number[] = JSON.parse(localStorage.getItem('wishlist') || '[]')
    const idx = stored.indexOf(id)
    if (idx > -1) {
      const updated = stored.filter((pid) => pid !== id)
      localStorage.setItem('wishlist', JSON.stringify(updated))
      window.dispatchEvent(new Event('wishlist-updated'))
      setLastRemoved({ item: products[idx], idx })
      setProducts((prev) => prev.filter((p) => (p.id || p.product_id) !== id))
      showToast('Removed from wishlist', 'success')
    }
  }, [products, showToast])

  const addToCart = useCallback(async (e: React.MouseEvent<Element>, product: any) => {
    e.preventDefault()
    e.stopPropagation()
    const id = product.id || product.product_id
    const name = product.product_name ?? product.name ?? ''
    const price = product.variants?.[0]?.discount_price || product.variants?.[0]?.discountPrice || product.variants?.[0]?.price || product.min_price || 0
    const image = product.common_image || product.image || product.images?.[0] || product.thumbnail || ''
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
      if (added) {
        setCart(prev => new Set([...prev, product.id || product.product_id]))
        showToast(`${name} added to cart`, 'success')
      }
    } catch (err: any) {
      console.error(err)
      showToast('Failed to add to cart', 'error')
    }
  }, [showToast])

  const addAllToCart = useCallback(async () => {
    if (products.length === 0 || addingAll) return
    
    setAddingAll(true)
    let successCount = 0
    
    for (const product of products) {
      const id = product.id || product.product_id
      const name = product.product_name ?? product.name ?? ''
      const price = product.variants?.[0]?.discount_price || product.variants?.[0]?.discountPrice || product.variants?.[0]?.price || product.min_price || 0
      const image = product.common_image || product.image || product.images?.[0] || product.thumbnail || ''
      
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
        if (added) {
          setCart(prev => new Set([...prev, product.id || product.product_id]))
          successCount++
        }
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (err) {
        console.error(`Failed to add ${name} to cart:`, err)
      }
    }
    
    setAddingAll(false)
    
    if (successCount > 0) {
      showToast(`${successCount} item${successCount > 1 ? 's' : ''} added to cart`, 'success')
    } else if (products.length > 0) {
      showToast('Failed to add items to cart. Please try again.', 'error')
    }
  }, [products, showToast])

  const totalValue = products.reduce((sum, p) => sum + getProductPrice(p).current, 0)

  return (
    <div className="wishlist-page">
      <SiteTopNav />
      <main className="wishlist-main">
        <header className="wishlist-header">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span aria-hidden="true">/</span>
            <strong>Wishlist</strong>
          </nav>

          <div className="wishlist-head">
            <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 12H5M11 6l-6 6 6 6"/>
              </svg>
            </button>
            <div className="wishlist-head-content">
              <h1>My Wishlist</h1>
              <p className="wishlist-count" aria-live="polite">{products.length} {products.length === 1 ? 'item' : 'items'} saved</p>
            </div>
          </div>
        </header>

        {loading ? (
          <div className="wishlist-loading" aria-label="Loading wishlist">
            <div className="loading-spinner"></div>
            <p>Loading your wishlist...</p>
          </div>
        ) : (
          <div className="wishlist-layout">
            <section className="wishlist-grid-section" aria-labelledby="wishlist-heading">
              <h2 id="wishlist-heading" className="visually-hidden">Wishlist items</h2>
              {products.length === 0 ? (
                <div className="wishlist-empty">
                  <div className="empty-ring">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 20.5s-7.2-4.4-9.2-8.8C1.4 8.6 3.2 5.5 6.3 5.5c1.9 0 3.2 1 4.2 2.3h3C14.4 6.1 15.8 5 17.8 5c3.1 0 4.9 3.1 3.5 6.2-2 4.4-9.2 8.8-9.2 8.8z"/>
                    </svg>
                  </div>
                  <h2>Your wishlist is empty</h2>
                  <p>Save devices you like and they'll be waiting here.</p>
                  <Link to="/collection/all" className="btn btn-primary">Browse Products</Link>
                </div>
              ) : (
                <>
                  <ul className="wishlist-grid" role="list" aria-label="Wishlist items">
                    {products.map((product) => (
                      <WishCard
                        key={product.id || product.product_id}
                        product={product}
                        onRemove={removeFromWishlist}
                        onAddToCart={addToCart}
                      />
                    ))}
                  </ul>
                  <div className="wishlist-cta-section">
                    <Link to="/collection/all" className="btn btn-outline btn-discover">
                      Discover more products
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6"/>
                      </svg>
                    </Link>
                  </div>
                </>
              )}
            </section>

            <aside className="wishlist-summary" aria-label="Wishlist summary">
              <h2>Total value</h2>
              <div className="summary-total">
                <span>₹{totalValue.toLocaleString('en-IN')}</span>
                <small>{products.length} {products.length === 1 ? 'item' : 'items'} · incl. taxes</small>
              </div>
              <ul className="summary-benefits">
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>Genuine sealed units</li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>Free express delivery</li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>Free 7-day returns</li>
              </ul>
              <button 
                className="btn btn-primary btn-add-all" 
                disabled={products.length === 0 || addingAll}
                onClick={addAllToCart}
              >
                <span>{addingAll ? 'Adding...' : 'Add all to cart'}</span>
                <span className="btn-chip" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12h14M13 6l6 6-6 6"/>
                  </svg>
                </span>
              </button>
              <button className="btn btn-outline btn-share" onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href)
                  showToast('Wishlist link copied', 'success')
                } catch {}
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <path d="M8.6 10.5l6.8-4M8.6 13.5l6.8 4"/>
                </svg>
                Share wishlist
              </button>
            </aside>
          </div>
        )}
      </main>

      <EcommerceFooter compact />
    </div>
  )
}