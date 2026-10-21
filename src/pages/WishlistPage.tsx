import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { productService } from '../services/productService'
import { addManyToCartWithAuth, addToCartWithAuth } from '../utils/cartAuth'
import DesktopPageLoader from '../components/ui/DesktopPageLoader'
import { useToast } from '../context/ToastContext'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import EcommerceFooter from '../components/ecommerce/Footer'
import {
  FALLBACK_IMAGE,
  cartParams,
  getProductImage,
  getProductName,
  getProductPrice,
  isOutOfStock,
  readWishlistIds,
  writeWishlistIds,
} from '../utils/wishlist'
import './WishlistPage.css'

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
  adding: boolean
  added: boolean
  onRemove: (id: number) => void
  onAddToCart: (e: React.MouseEvent<Element>, product: any) => void
}

function WishCard({ product, adding, added, onRemove, onAddToCart }: WishCardProps) {
  const tag = getProductTags(product)[0] || ''
  const { current: price, old } = getProductPrice(product)
  const name = getProductName(product)
  const image = getProductImage(product)
  const productId = product.id || product.product_id
  const outOfStock = isOutOfStock(product)
  const off = old && old > price ? Math.round(((old - price) / old) * 100) : 0

  return (
    <li className="wishlist-item">
      <article className="wish-card" data-id={productId}>
        <div className="wish-card-media">
          {tag && <span className="wish-card-tag">{tag}</span>}
          <Link to={`/product/${productId}`} className="wish-card-art-link" aria-label={`View ${name}`}>
            <div className="wish-card-art" aria-hidden="true">
              <img
                src={image}
                alt=""
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE }}
              />
            </div>
          </Link>
          <button
            type="button"
            className="wish-card-heart"
            aria-label={`Remove ${name} from wishlist`}
            title="Remove from wishlist"
            onClick={() => onRemove(productId)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3c1.74 0 3.41.81 4.5 2.09C19.58 5.08 22 8.18 22 11.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
            </svg>
          </button>
        </div>
        <div className="wish-card-info">
          <div className="wish-card-cat">{tag || 'Accessories'}</div>
          <h3 className="wish-card-name"><Link to={`/product/${productId}`}>{name}</Link></h3>
          <div className="wish-card-row">
            <span className="wish-card-price">₹{price.toLocaleString('en-IN')}</span>
            {off > 0 && (
              <span className="wish-card-was">
                <s>₹{old!.toLocaleString('en-IN')}</s>
                <span className="wish-card-off">{off}% off</span>
              </span>
            )}
            {outOfStock ? (
              <span className="wish-card-stock is-out">Out of stock</span>
            ) : (
              <span className="wish-card-stock">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12l5 5L20 7"/>
                </svg>
                In stock
              </span>
            )}
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm wish-card-cart"
            onClick={(e) => onAddToCart(e, product)}
            disabled={outOfStock || adding}
            aria-busy={adding}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="9" cy="21" r="1.4"/><circle cx="18" cy="21" r="1.4"/><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6"/>
            </svg>
            <span>{adding ? 'Adding…' : added ? 'Added to cart' : outOfStock ? 'Unavailable' : 'Add to cart'}</span>
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
  const [movingAll, setMovingAll] = useState(false)
  const [addingIds, setAddingIds] = useState<number[]>([])
  const [addedIds, setAddedIds] = useState<number[]>([])
  // Saved items whose product could not be fetched. They stay in localStorage
  // (and the nav count) so they are not silently lost.
  const [unavailableCount, setUnavailableCount] = useState(0)

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
    // Keep only products that are still saved (e.g. removed from another tab/page).
    const handler = () => {
      const ids = readWishlistIds()
      setProducts((prev) => prev.filter((p) => ids.includes(Number(p.id || p.product_id))))
    }
    window.addEventListener('wishlist-updated', handler)
    return () => window.removeEventListener('wishlist-updated', handler)
  }, [loadWishlist])

  const removeFromWishlist = useCallback((id: number) => {
    writeWishlistIds(readWishlistIds().filter((pid) => pid !== Number(id)))
    setProducts((prev) => prev.filter((p) => Number(p.id || p.product_id) !== Number(id)))
    showToast('Removed from wishlist', 'success')
  }, [showToast])

  const addToCart = useCallback(async (e: React.MouseEvent<Element>, product: any) => {
    e.preventDefault()
    e.stopPropagation()
    const productId = Number(product.id || product.product_id)
    if (addingIds.includes(productId)) return
    const name = getProductName(product)
    setAddingIds((ids) => [...ids, productId])
    try {
      const added = await addToCartWithAuth(cartParams(product))
      if (added) {
        setAddedIds((ids) => [...ids, productId])
        setTimeout(() => setAddedIds((ids) => ids.filter((id) => id !== productId)), 2000)
        showToast(`${name} added to cart`, 'success')
      }
    } catch (err: any) {
      console.error(err)
      showToast(err?.message || 'Failed to add to cart', 'error')
    } finally {
      setAddingIds((ids) => ids.filter((id) => id !== productId))
    }
  }, [addingIds, showToast])

  /**
   * Adds every saved product to the cart in one request and removes the ones
   * that made it. The nav badge and the toast update together once the server answers.
   */
  const moveAllToCart = useCallback(async () => {
    if (products.length === 0 || movingAll) return

    const nameOf = new Map(products.map((p) => [Number(p.id || p.product_id), getProductName(p)]))
    const failed: { name: string; reason: string }[] = products
      .filter(isOutOfStock)
      .map((p) => ({ name: getProductName(p), reason: 'out of stock' }))
    const inStock = products.filter((p) => !isOutOfStock(p))

    setMovingAll(true)
    try {
      const result = await addManyToCartWithAuth(inStock.map(cartParams))
      if (!result) return // redirected to login
      const movedIds = result.added
      result.failed.forEach((f) => failed.push({ name: nameOf.get(f.productId) || 'Item', reason: f.message }))

      if (movedIds.length > 0) {
        writeWishlistIds(readWishlistIds().filter((id) => !movedIds.includes(id)))
        setProducts((prev) => prev.filter((p) => !movedIds.includes(Number(p.id || p.product_id))))
      }

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
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Couldn’t move items to cart', 'error')
    } finally {
      setMovingAll(false)
    }
  }, [products, movingAll, showToast])

  const totalValue = products.reduce((sum, p) => sum + getProductPrice(p).current, 0)

  return (
    <div className="wishlist-page">
      <SiteTopNav />
      <main className="wishlist-main">
        <header className="wishlist-header">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link to="/home">Home</Link>
            <span aria-hidden="true">/</span>
            <strong>Wishlist</strong>
          </nav>

          <div className="wishlist-head">
            <button className="back-btn" onClick={() => navigate(-1)} aria-label="Go back">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
          <DesktopPageLoader text="Loading your wishlist..." />
        ) : (
          <div className="wishlist-layout">
            <section className="wishlist-grid-section" aria-labelledby="wishlist-heading">
              <h2 id="wishlist-heading" className="visually-hidden">Wishlist items</h2>
              {products.length === 0 ? (
                <div className="wishlist-empty">
                  <div className="empty-ring">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20.5s-7.2-4.4-9.2-8.8C1.4 8.6 3.2 5.5 6.3 5.5c1.9 0 3.2 1 4.2 2.3h3C14.4 6.1 15.8 5 17.8 5c3.1 0 4.9 3.1 3.5 6.2-2 4.4-9.2 8.8-9.2 8.8z"/>
                    </svg>
                  </div>
                  <h2>Your wishlist is empty</h2>
                  <p>Save devices you like and they'll be waiting here.</p>
                  <Link to="/collection/all" className="wishlist-browse-btn">Browse Products</Link>
                </div>
              ) : (
                <>
                  {unavailableCount > 0 && (
                    <div className="wishlist-notice" role="alert">
                      <span>{unavailableCount} saved {unavailableCount === 1 ? 'item' : 'items'} could not be loaded.</span>
                      <button type="button" onClick={loadWishlist}>Try again</button>
                    </div>
                  )}
                  <ul className="wishlist-grid" role="list" aria-label="Wishlist items">
                    {products.map((product) => {
                      const id = Number(product.id || product.product_id)
                      return (
                        <WishCard
                          key={id}
                          product={product}
                          adding={addingIds.includes(id)}
                          added={addedIds.includes(id)}
                          onRemove={removeFromWishlist}
                          onAddToCart={addToCart}
                        />
                      )
                    })}
                  </ul>
                  <div className="wishlist-cta-section">
                    <Link to="/collection/all" className="btn btn-outline btn-discover">
                      Discover more products
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>Genuine sealed units</li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>Free express delivery</li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7"/></svg>Free 7-day returns</li>
              </ul>
              <button 
                className="btn btn-primary btn-add-all" 
                disabled={products.length === 0 || movingAll || products.every(isOutOfStock)}
                onClick={moveAllToCart}
                aria-busy={movingAll}
              >
                <span>{movingAll ? 'Moving to cart…' : 'Move all to cart'}</span>
                <span className="btn-chip" aria-hidden="true">
                  {movingAll ? (
                    <svg className="animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                      <path d="M21 12a9 9 0 1 1-9-9" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6"/>
                    </svg>
                  )}
                </span>
              </button>
              <button className="btn btn-outline btn-share" onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href)
                  showToast('Wishlist link copied', 'success')
                } catch {
                  showToast('Could not copy the link', 'error')
                }
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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