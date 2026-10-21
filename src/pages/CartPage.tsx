import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, BadgePercent, Check, Heart, Lock, Minus, Plus,
  RotateCcw, ShieldCheck, ShoppingBag, Tag, Trash2, Truck, X,
} from 'lucide-react'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import DesktopPageLoader from '../components/ui/DesktopPageLoader'
import './CartPage.css'
import { productService } from '../services/productService'
import { cartService, type CartItem } from '../services/cartService'
import { FREE_SHIPPING_THRESHOLD, TAX_RATE } from '../components/mobile/cartLogic'
import { computeTotals, readCheckoutCoupon, saveCheckoutCoupon, validateCoupon, type CheckoutCoupon } from '../utils/checkout'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const FALLBACK_IMG = 'https://picsum.photos/seed/product/300/300'

interface CartRow {
  key: string
  id: number
  variantId?: number | null
  name: string
  brand: string
  specs: string[]
  price: number
  mrp: number
  qty: number
  stock: 'in' | 'low' | 'out'
  img: string
}

interface RecProduct {
  id: number
  name: string
  price: number
  img: string
  brand?: string
}

function resolveImage(raw: string): string {
  if (!raw) return FALLBACK_IMG
  if (raw.startsWith('http') || raw.startsWith('data:')) return raw
  return `${API_BASE_URL.replace(/\/+$/, '')}/${raw.replace(/^\/+/, '')}`
}

function getProductImage(product: any): string {
  return resolveImage(product.common_image || product.image || product.images?.[0] || product.thumbnail || product.variants?.[0]?.images?.[0] || '')
}

function getProductPrice(product: any): number {
  const v = product.variants?.[0]
  if (!v) return product.min_price || product.minPrice || product.price || 0
  let rawPrice = v.discount_price || v.discountPrice || v.price || product.min_price || 0
  if (!rawPrice || rawPrice === 0) {
    rawPrice = v.mrp || v.original_price || v.originalPrice || product.min_price || 0
  }
  return isNaN(Number(rawPrice)) ? 0 : Number(rawPrice)
}

const isRealSpec = (v?: string) => Boolean(v && v.trim() && v.trim().toUpperCase() !== 'N/A')

function toRows(items: CartItem[]): CartRow[] {
  return items.map((item) => {
    const price = Number(item.price) || 0
    const mrp = Number(item.mrp) || price
    return {
      key: String(item.cartItemId ?? `${item.productId}-${item.variantId ?? 'default'}`),
      id: item.productId,
      variantId: item.variantId ?? null,
      name: item.name || 'Item',
      brand: item.brand || '',
      specs: [item.color, item.storage, item.ram].filter(isRealSpec) as string[],
      price,
      mrp: mrp > price ? mrp : price,
      qty: item.quantity || 1,
      stock: item.stockStatus === 'out_of_stock' ? 'out' : item.stockStatus === 'low_stock' ? 'low' : 'in',
      img: resolveImage(item.image || ''),
    }
  })
}

const fmt = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')

function addToWishlist(productId: number) {
  try {
    const stored: any[] = JSON.parse(localStorage.getItem('wishlist') || '[]')
    const ids = stored.map((x) => (typeof x === 'number' ? x : x?.id)).filter(Boolean)
    if (!ids.includes(productId)) {
      localStorage.setItem('wishlist', JSON.stringify([...ids, productId]))
      window.dispatchEvent(new Event('wishlist-updated'))
    }
  } catch { /* storage unavailable: nothing to save */ }
}

const STEPS = ['Cart', 'Address', 'Payment']

export default function CartPage() {
  const navigate = useNavigate()
  const [cart, setCart] = useState<CartRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyKeys, setBusyKeys] = useState<string[]>([])
  const [removingKeys, setRemovingKeys] = useState<string[]>([])
  const [notice, setNotice] = useState<{ text: string; type: 'ok' | 'err' } | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const [promoInput, setPromoInput] = useState('')
  // Coupons are validated by the server, which is what applies them to the order.
  const [coupon, setCoupon] = useState<CheckoutCoupon | null>(readCheckoutCoupon)
  const [promoBusy, setPromoBusy] = useState(false)
  const [promoMsg, setPromoMsg] = useState<{ text: string; type: 'err' } | null>(null)

  const [recommendations, setRecommendations] = useState<RecProduct[]>([])
  const [addedRecIds, setAddedRecIds] = useState<Record<number, boolean>>({})

  const fetchCart = useCallback(async () => {
    try {
      const { items } = await cartService.getCart(true)
      setCart(toRows(items))
    } catch {
      setCart([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    cartService.getCart(true)
      .then(({ items }) => { if (!cancelled) setCart(toRows(items)) })
      .catch(() => { if (!cancelled) setCart([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    const onCartUpdated = () => fetchCart()
    window.addEventListener('cart-updated', onCartUpdated)
    return () => {
      cancelled = true
      window.removeEventListener('cart-updated', onCartUpdated)
    }
  }, [fetchCart])

  useEffect(() => {
    productService
      .list({ page_size: 8 })
      .then((prods) => {
        setRecommendations((prods || []).slice(0, 4).map((p: any) => ({
          id: p.id,
          name: p.name || p.product_name || 'Product',
          price: getProductPrice(p),
          img: getProductImage(p),
          brand: p.brand || '',
        })))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), 2600)
    return () => clearTimeout(t)
  }, [notice])

  const inCart = new Set(cart.map((i) => i.id))
  const recs = recommendations.filter((r) => !inCart.has(r.id))

  const mrpTotal = cart.reduce((s, i) => s + i.mrp * i.qty, 0)
  // Same pricing as the payment step and the server's order total.
  const { subtotal, quantity: totalItems, shipping, tax, discount: promoDiscount, total } =
    computeTotals(cart.map((i) => ({ price: i.price, quantity: i.qty })), coupon?.discount || 0)
  const productSavings = mrpTotal - subtotal
  const appliedPromo = coupon?.code || null
  const toFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const shippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)
  const hasOutOfStock = cart.some((i) => i.stock === 'out')

  const withBusy = async (key: string, fn: () => Promise<void>) => {
    if (busyKeys.includes(key)) return
    setBusyKeys((b) => [...b, key])
    try { await fn() } finally { setBusyKeys((b) => b.filter((k) => k !== key)) }
  }

  const handleQtyChange = (item: CartRow, delta: number) => {
    if (item.qty + delta < 1) return
    withBusy(item.key, async () => {
      setCart((prev) => prev.map((i) => (i.key === item.key ? { ...i, qty: i.qty + delta } : i)))
      await cartService.updateQuantity(item.id, item.variantId, delta)
      const err = cartService.getLastCartError()
      if (err && Date.now() - err.timestamp < 1500) setNotice({ text: err.message, type: 'err' })
      await fetchCart()
    })
  }

  const removeRow = (item: CartRow, message: string) => {
    withBusy(item.key, async () => {
      setRemovingKeys((r) => [...r, item.key])
      await cartService.removeItem(item.id, item.variantId)
      await new Promise((r) => setTimeout(r, 220))
      setRemovingKeys((r) => r.filter((k) => k !== item.key))
      setNotice({ text: message, type: 'ok' })
      await fetchCart()
    })
  }

  const handleSaveForLater = (item: CartRow) => {
    addToWishlist(item.id)
    removeRow(item, `${item.name} moved to your wishlist`)
  }

  const handleConfirmClear = async () => {
    setConfirmClear(false)
    await cartService.clearCart()
    const err = cartService.getLastCartError()
    if (err && Date.now() - err.timestamp < 1500) {
      setNotice({ text: err.message, type: 'err' })
    } else {
      setNotice({ text: 'Cart cleared', type: 'ok' })
    }
    await fetchCart()
  }

  // Keyboard dismissal for the clear-cart dialog.
  useEffect(() => {
    if (!confirmClear) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setConfirmClear(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirmClear])

  // Re-check an applied coupon when the cart changes (percentage discounts and
  // minimum-spend rules depend on the subtotal).
  const couponCode = coupon?.code
  useEffect(() => {
    if (!couponCode || loading) return
    let cancelled = false
    validateCoupon(couponCode, subtotal)
      .then((c) => { if (!cancelled) { setCoupon(c); saveCheckoutCoupon(c) } })
      .catch((err) => {
        if (cancelled) return
        setCoupon(null)
        saveCheckoutCoupon(null)
        setPromoMsg({ text: `${couponCode} removed: ${err?.message || 'no longer valid'}`, type: 'err' })
      })
    return () => { cancelled = true }
  }, [couponCode, subtotal, loading])

  const handleApplyPromo = async () => {
    const code = promoInput.trim()
    if (!code) { setPromoMsg({ text: 'Enter a promo code', type: 'err' }); return }
    setPromoBusy(true)
    try {
      const applied = await validateCoupon(code, subtotal)
      setCoupon(applied)
      saveCheckoutCoupon(applied)
      setPromoInput('')
      setPromoMsg(null)
      setNotice({ text: `${applied.code} applied — you save ${fmt(applied.discount)}`, type: 'ok' })
    } catch (err: any) {
      setPromoMsg({ text: err?.message || 'That code isn’t valid', type: 'err' })
    } finally {
      setPromoBusy(false)
    }
  }

  const removePromo = () => {
    setCoupon(null)
    saveCheckoutCoupon(null)
    setPromoMsg(null)
  }

  const handleCheckout = () => {
    if (cart.length === 0 || hasOutOfStock) return
    saveCheckoutCoupon(coupon ? { code: coupon.code, discount: promoDiscount } : null)
    navigate('/checkout/address')
  }

  const handleAddRec = async (rec: RecProduct) => {
    try {
      await cartService.addItem({
        productId: rec.id,
        variationId: 0,
        quantity: 1,
        name: rec.name,
        brand: rec.brand || '',
        price: rec.price,
        image: rec.img,
      })
    } catch (err: any) {
      setNotice({ text: err?.message || 'Failed to add to cart', type: 'err' })
      return
    }
    setAddedRecIds((prev) => ({ ...prev, [rec.id]: true }))
    setNotice({ text: `${rec.name} added to cart`, type: 'ok' })
    await fetchCart()
  }

  return (
    <div className="cx-root">
      <SiteTopNav />

      <main className="cx-wrap">
        <header className="cx-head">
          <div>
            <nav className="cx-crumbs" aria-label="Breadcrumb">
              <Link to="/home">Home</Link><span>/</span><span aria-current="page">Cart</span>
            </nav>
            <h1>Shopping Cart</h1>
            <p className="cx-head-sub">
              {loading ? 'Loading your items…' : `${totalItems} item${totalItems !== 1 ? 's' : ''} in your cart`}
            </p>
          </div>
          <ol className="cx-steps" aria-label="Checkout progress">
            {STEPS.map((label, i) => (
              <li key={label} className={i === 0 ? 'is-active' : ''}>
                <span className="cx-step-num">{i + 1}</span>
                {label}
              </li>
            ))}
          </ol>
        </header>

        {loading ? (
          <DesktopPageLoader text="Loading your cart..." />
        ) : cart.length === 0 ? (
          <section className="cx-empty">
            <div className="cx-empty-icon"><ShoppingBag size={34} /></div>
            <h2>Your cart is empty</h2>
            <p>Looks like you haven’t added anything yet. Explore the latest phones and accessories.</p>
            <div className="cx-empty-actions">
              <Link to="/collection/all" className="cx-btn cx-btn-primary">Start shopping <ArrowRight size={16} /></Link>
              <Link to="/wishlist" className="cx-btn cx-btn-ghost"><Heart size={16} /> View wishlist</Link>
            </div>
          </section>
        ) : (
          <div className="cx-grid">
            <section className="cx-main">
              {!loading && (
                <div className="cx-ship-card">
                  <div className="cx-ship-top">
                    <Truck size={18} />
                    {toFreeShipping > 0 ? (
                      <span>Add <strong>{fmt(toFreeShipping)}</strong> more for <strong>free delivery</strong></span>
                    ) : (
                      <span><strong>You’ve unlocked free delivery</strong> on this order</span>
                    )}
                  </div>
                  <div className="cx-ship-bar"><span style={{ width: `${shippingProgress}%` }} /></div>
                </div>
              )}

              <div className="cx-card">
                <div className="cx-card-head">
                  <h2>Items <span>({totalItems})</span></h2>
                  {!loading && cart.length > 0 && (
                    <button className="cx-link-btn" onClick={() => setConfirmClear(true)}>
                      <Trash2 size={15} /> Clear cart
                    </button>
                  )}
                </div>

                {(
                  <ul className="cx-items">
                    {cart.map((item) => {
                      const busy = busyKeys.includes(item.key)
                      const off = item.mrp > item.price ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0
                      return (
                        <li key={item.key} className={`cx-item${removingKeys.includes(item.key) ? ' is-removing' : ''}${busy ? ' is-busy' : ''}`}>
                          <button className="cx-thumb" onClick={() => navigate(`/product/${item.id}`)} aria-label={`View ${item.name}`}>
                            <img src={item.img} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG }} />
                          </button>

                          <div className="cx-info">
                            {item.brand && <div className="cx-brand">{item.brand}</div>}
                            <Link to={`/product/${item.id}`} className="cx-name">{item.name}</Link>
                            {item.specs.length > 0 && (
                              <div className="cx-specs">
                                {item.specs.map((s) => <span key={s}>{s}</span>)}
                              </div>
                            )}
                            <div className={`cx-stock is-${item.stock}`}>
                              <span className="cx-dot" />
                              {item.stock === 'out' ? 'Out of stock — remove to continue' : item.stock === 'low' ? 'Only a few left' : 'In stock'}
                            </div>

                            <div className="cx-actions">
                              <div className="cx-qty" aria-label="Quantity">
                                <button onClick={() => handleQtyChange(item, -1)} disabled={busy || item.qty <= 1} aria-label="Decrease quantity"><Minus size={14} /></button>
                                <span>{item.qty}</span>
                                <button onClick={() => handleQtyChange(item, 1)} disabled={busy || item.stock === 'out'} aria-label="Increase quantity"><Plus size={14} /></button>
                              </div>
                              <button className="cx-link-btn" onClick={() => handleSaveForLater(item)} disabled={busy}>
                                <Heart size={15} /> Save for later
                              </button>
                              <button className="cx-link-btn is-danger" onClick={() => removeRow(item, `${item.name} removed`)} disabled={busy}>
                                <Trash2 size={15} /> Remove
                              </button>
                            </div>
                          </div>

                          <div className="cx-price">
                            <div className="cx-price-now">{fmt(item.price * item.qty)}</div>
                            {off > 0 && (
                              <div className="cx-price-was">
                                <s>{fmt(item.mrp * item.qty)}</s>
                                <span className="cx-off">{off}% off</span>
                              </div>
                            )}
                            {item.qty > 1 && <div className="cx-price-unit">{fmt(item.price)} each</div>}
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </div>

              <Link to="/collection/all" className="cx-back">
                <ArrowLeft size={16} /> Continue shopping
              </Link>
            </section>

            <aside className="cx-side">
              <div className="cx-card cx-summary">
                <h2>Price details</h2>
                <dl>
                  <div><dt>Price ({totalItems} item{totalItems !== 1 ? 's' : ''})</dt><dd>{fmt(mrpTotal)}</dd></div>
                  {productSavings > 0 && <div className="is-save"><dt>Discount</dt><dd>−{fmt(productSavings)}</dd></div>}
                  {appliedPromo && <div className="is-save"><dt>Coupon ({appliedPromo})</dt><dd>−{fmt(promoDiscount)}</dd></div>}
                  <div><dt>Delivery</dt><dd className={shipping === 0 ? 'is-free' : ''}>{shipping === 0 ? 'Free' : fmt(shipping)}</dd></div>
                  <div><dt>GST ({Math.round(TAX_RATE * 100)}%)</dt><dd>{fmt(tax)}</dd></div>
                </dl>
                <div className="cx-total">
                  <span>Total amount</span>
                  <strong>{fmt(total)}</strong>
                </div>
                {productSavings + promoDiscount > 0 && (
                  <div className="cx-savings">
                    <BadgePercent size={16} /> You save {fmt(productSavings + promoDiscount)} on this order
                  </div>
                )}

                <div className="cx-promo">
                  {appliedPromo ? (
                    <div className="cx-promo-applied">
                      <Tag size={15} />
                      <span><strong>{appliedPromo}</strong> applied</span>
                      <button onClick={removePromo} aria-label="Remove promo code"><X size={15} /></button>
                    </div>
                  ) : (
                    <form className="cx-promo-form" onSubmit={(e) => { e.preventDefault(); handleApplyPromo() }}>
                      <Tag size={15} />
                      <input
                        type="text"
                        placeholder="Promo code"
                        value={promoInput}
                        onChange={(e) => setPromoInput(e.target.value)}
                        aria-label="Promo code"
                      />
                      <button type="submit" disabled={promoBusy}>{promoBusy ? '…' : 'Apply'}</button>
                    </form>
                  )}
                  {promoMsg && <div className={`cx-promo-msg is-${promoMsg.type}`}>{promoMsg.text}</div>}
                </div>

                <button
                  className="cx-btn cx-btn-primary cx-checkout"
                  disabled={loading || cart.length === 0 || hasOutOfStock}
                  onClick={handleCheckout}
                >
                  <Lock size={16} /> Proceed to checkout <ArrowRight size={16} />
                </button>
                {hasOutOfStock && <p className="cx-warn">Remove out-of-stock items to continue.</p>}
              </div>

              <ul className="cx-trust">
                <li><ShieldCheck size={18} /><div><strong>Secure payments</strong><span>UPI, cards & COD</span></div></li>
                <li><RotateCcw size={18} /><div><strong>7-day returns</strong><span>No-questions-asked</span></div></li>
                <li><Truck size={18} /><div><strong>Fast delivery</strong><span>Free over {fmt(FREE_SHIPPING_THRESHOLD)}</span></div></li>
              </ul>
            </aside>
          </div>
        )}

        {recs.length > 0 && (
          <section className="cx-recs">
            <div className="cx-recs-head">
              <h2>You may also like</h2>
              <Link to="/collection/all">View all <ArrowRight size={15} /></Link>
            </div>
            <div className="cx-recs-grid">
              {recs.map((r) => (
                <article key={r.id} className="cx-rec">
                  <button className="cx-rec-img" onClick={() => navigate(`/product/${r.id}`)} aria-label={`View ${r.name}`}>
                    <img src={r.img} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG }} />
                  </button>
                  {r.brand && <div className="cx-brand">{r.brand}</div>}
                  <Link to={`/product/${r.id}`} className="cx-rec-name">{r.name}</Link>
                  <div className="cx-rec-bottom">
                    <span className="cx-rec-price">{r.price > 0 ? fmt(r.price) : ''}</span>
                    <button
                      className={`cx-rec-add${addedRecIds[r.id] ? ' is-added' : ''}`}
                      onClick={() => handleAddRec(r)}
                      disabled={addedRecIds[r.id]}
                    >
                      {addedRecIds[r.id] ? <><Check size={14} /> Added</> : <><Plus size={14} /> Add</>}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>

      {confirmClear && (
        <div
          className="cx-modal-backdrop"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmClear(false) }}
        >
          <div className="cx-modal" role="dialog" aria-modal="true" aria-labelledby="cx-clear-title" aria-describedby="cx-clear-desc">
            <div className="cx-modal-icon"><Trash2 size={20} /></div>
            <h2 id="cx-clear-title">Clear your cart?</h2>
            <p id="cx-clear-desc">
              All {totalItems} {totalItems === 1 ? 'item' : 'items'} will be removed from your cart. You can add them again anytime.
            </p>
            <div className="cx-modal-actions">
              <button className="cx-btn cx-btn-ghost" onClick={() => setConfirmClear(false)} autoFocus>Keep items</button>
              <button className="cx-btn cx-btn-danger" onClick={handleConfirmClear}>Clear cart</button>
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className={`cx-toast is-${notice.type}`} role="status">
          {notice.type === 'ok' ? <Check size={16} /> : <X size={16} />}
          {notice.text}
        </div>
      )}
    </div>
  )
}
