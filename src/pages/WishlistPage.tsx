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

// Some pages store wishlist entries as ids, others as { id } objects.
function readWishlistIds(): number[] {
  try {
    const stored: any[] = JSON.parse(localStorage.getItem('wishlist') || '[]')
    return [...new Set(stored.map((x) => Number(typeof x === 'object' && x ? x.id : x)).filter(Boolean))]
  } catch {
    return []
  }
}

function writeWishlistIds(ids: number[]) {
  localStorage.setItem('wishlist', JSON.stringify(ids))
  window.dispatchEvent(new Event('wishlist-updated'))
}

const sellingPrice = (v: any) => (Number(v.discountPrice) > 0 ? Number(v.discountPrice) : Number(v.price) || 0)

/** Cheapest in-stock variant, or null when nothing can be bought. */
function pickVariant(product: any): any | null {
  const variants: any[] = product.variants || []
  return variants
    .filter((v) => Number(v.stock) > 0)
    .sort((a, b) => sellingPrice(a) - sellingPrice(b))[0] || null
}

function isOutOfStock(product: any): boolean {
  return (product.variants || []).length > 0 && !pickVariant(product)
}

function cartParams(product: any) {
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
  const outOfStock = isOutOfStock(product)

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
            {outOfStock ? (
              <span className="wish-card-stock is-out">Out of stock</span>
            ) : (
              <span className="wish-card-stock">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M5 12l5 5L20 7"/>
                </svg>
                In stock
              </span>
            )}
          </div>
          <button 
            className="btn btn-primary btn-sm wish-card-cart"
            onClick={(e) => onAddToCart(e, product)}
            disabled={outOfStock}
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
  const [moveProgress, setMoveProgress] = useState<{ done: number; total: number } | null>(null)

  useEffect(() => {
    const load = async () => {
      const ids = readWishlistIds()
      if (ids.length === 0) { setProducts([]); setLoading(false); return }
      const results = await Promise.allSettled(ids.map((id) => productService.getById(id)))
      const fetched = results
        .filter((r) => r.status === 'fulfilled')
        .map((r) => (r as PromiseFulfilledResult<any>).value)
      setProducts(fetched)
      setLoading(false)
    }
    load()
    // Keep only products that are still saved (e.g. removed from another tab/page).
    const handler = () => {
      const ids = readWishlistIds()
      setProducts((prev) => prev.filter((p) => ids.includes(Number(p.id || p.product_id))))
    }
    window.addEventListener('wishlist-updated', handler)
    return () => window.removeEventListener('wishlist-updated', handler)
  }, [])

  const removeFromWishlist = useCallback((id: number) => {
    writeWishlistIds(readWishlistIds().filter((pid) => pid !== Number(id)))
    setProducts((prev) => prev.filter((p) => Number(p.id || p.product_id) !== Number(id)))
    showToast('Removed from wishlist', 'success')
  }, [showToast])

  const addToCart = useCallback(async (e: React.MouseEvent<Element>, product: any) => {
    e.preventDefault()
    e.stopPropagation()
    const name = getProductName(product)
    try {
      const added = await addToCartWithAuth(cartParams(product))
      if (added) showToast(`${name} added to cart`, 'success')
    } catch (err: any) {
      console.error(err)
      showToast(err?.message || 'Failed to add to cart', 'error')
    }
  }, [showToast])

  /** Adds every saved product to the cart and removes the ones that made it. */
  const moveAllToCart = useCallback(async () => {
    if (products.length === 0 || moveProgress) return

    const movedIds: number[] = []
    const failed: { name: string; reason: string }[] = []
    setMoveProgress({ done: 0, total: products.length })

    // Sequential on purpose: each add refreshes the server cart.
    for (const [i, product] of products.entries()) {
      const name = getProductName(product)
      if (isOutOfStock(product)) {
        failed.push({ name, reason: 'out of stock' })
      } else {
        try {
          const added = await addToCartWithAuth(cartParams(product))
          if (!added) break // redirected to login
          movedIds.push(Number(product.id || product.product_id))
        } catch (err: any) {
          failed.push({ name, reason: err?.message || 'could not be added' })
        }
      }
      setMoveProgress({ done: i + 1, total: products.length })
    }

    if (movedIds.length > 0) {
      writeWishlistIds(readWishlistIds().filter((id) => !movedIds.includes(id)))
      setProducts((prev) => prev.filter((p) => !movedIds.includes(Number(p.id || p.product_id))))
    }
    setMoveProgress(null)

    if (failed.length === 0) {
      showToast(`${movedIds.length} item${movedIds.length !== 1 ? 's' : ''} moved to cart`, 'success')
    } else {
      const detail = failed.map((f) => `${f.name} (${f.reason})`).join(', ')
      showToast(
        movedIds.length > 0
          ? `${movedIds.length} moved to cart. Still in wishlist: ${detail}`
          : `Couldn't move items to cart: ${detail}`,
        'error',
      )
    }
  }, [products, moveProgress, showToast])

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
                disabled={products.length === 0 || moveProgress !== null}
                onClick={moveAllToCart}
              >
                <span>{moveProgress ? `Moving ${moveProgress.done}/${moveProgress.total}…` : 'Move all to cart'}</span>
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