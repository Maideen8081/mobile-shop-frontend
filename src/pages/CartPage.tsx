import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, ArrowRight, BadgePercent, Check, Headphones, Heart, Minus, Plus,
  Repeat, ShieldCheck, ShoppingBag, ShoppingCart, Star, Tag, Trash2, Truck, X,
} from 'lucide-react'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import DesktopPageLoader from '../components/ui/DesktopPageLoader'
import './CartPage.css'
import { productService } from '../services/productService'
import { cartService, type CartItem } from '../services/cartService'
import { FREE_SHIPPING_THRESHOLD } from '../components/mobile/cartLogic'
import { computeTotals, gstLabel, readCheckoutCoupon, saveCheckoutCoupon, validateCoupon, type CheckoutCoupon } from '../utils/checkout'

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
  mrp: number
  rating: number
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

/** Highest variant list price, used as the struck-through MRP. */
function getProductMrp(product: any, price: number): number {
  const v = product.variants?.[0]
  const mrp = Number(v?.price || v?.mrp || product.price || 0)
  return mrp > price ? mrp : price
}

function getProductPrice(product: any): number {
  const v = product.variants?.[0]
  if (!v) return product.min_price || product.minPrice || product.price || 0
  let rawPrice = v.discountPrice || v.discount_price || v.price || product.min_price || 0
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

const pctOff = (mrp: number, price: number) => (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0)

export default function CartPage() {
  const navigate = useNavigate()
  const [cart, setCart] = useState<CartRow[]>([])
  const [loading, setLoading] = useState(true)
  const [busyKeys, setBusyKeys] = useState<string[]>([])
  const [removingKeys, setRemovingKeys] = useState<string[]>([])
  const [notice, setNotice] = useState<{ text: string; type: 'ok' | 'err'; undo?: () => void } | null>(null)
  // Per-item queue so quick +/− taps all apply, in order, without blocking the buttons.
  const qtyQueues = useRef<Record<string, Promise<void>>>({})
  const pendingQty = useRef<Record<string, number>>({})
  const [confirmClear, setConfirmClear] = useState(false)
  // Rows the shopper unticked. Everything else (including new items) is selected.
  const [unselected, setUnselected] = useState<string[]>([])

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
    const onCartUpdated = () => {
      setCart(toRows(cartService.getCachedItems()))
      fetchCart()
    }
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
        setRecommendations((prods || []).map((p: any) => {
          const price = getProductPrice(p)
          return {
            id: p.id,
            name: p.name || p.product_name || 'Product',
            price,
            mrp: getProductMrp(p, price),
            rating: Number(p.rating) || 0,
            img: getProductImage(p),
            brand: p.brand || '',
          }
        }))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(null), notice.undo ? 6000 : 2600)
    return () => clearTimeout(t)
  }, [notice])

  const inCart = new Set(cart.map((i) => i.id))
  const recs = recommendations.filter((r) => !inCart.has(r.id)).slice(0, 4)
  const selectedRows = cart.filter((i) => !unselected.includes(i.key))
  const partialSelection = selectedRows.length > 0 && selectedRows.length < cart.length
  const toggleSelected = (key: string) =>
    setUnselected((u) => (u.includes(key) ? u.filter((k) => k !== key) : [...u, key]))

  const mrpTotal = cart.reduce((s, i) => s + i.mrp * i.qty, 0)
  // Same pricing as the payment step and the server's order total.
  const { subtotal, quantity: totalItems, shipping, tax, discount: promoDiscount, total } =
    computeTotals(cart.map((i) => ({ price: i.price, quantity: i.qty })), coupon?.discount || 0)
  const productSavings = mrpTotal - subtotal
  const appliedPromo = coupon?.code || null
  const toFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const hasOutOfStock = cart.some((i) => i.stock === 'out')

  const withBusy = async (key: string, fn: () => Promise<void>) => {
    if (busyKeys.includes(key)) return
    setBusyKeys((b) => [...b, key])
    try { await fn() } finally { setBusyKeys((b) => b.filter((k) => k !== key)) }
  }

  const handleQtyChange = (item: CartRow, delta: number) => {
    // Use the latest number on screen (earlier taps may still be saving).
    const shown = cart.find((i) => i.key === item.key)?.qty ?? item.qty
    if (shown + delta < 1) return
    setCart((prev) => prev.map((i) => (i.key === item.key ? { ...i, qty: i.qty + delta } : i)))
    pendingQty.current[item.key] = (pendingQty.current[item.key] || 0) + 1
    const run = async () => {
      await cartService.updateQuantity(item.id, item.variantId, delta)
      const err = cartService.getLastCartError()
      if (err && Date.now() - err.timestamp < 1500) setNotice({ text: err.message, type: 'err' })
    }
    qtyQueues.current[item.key] = (qtyQueues.current[item.key] || Promise.resolve())
      .then(run, run)
      .finally(async () => {
        pendingQty.current[item.key] -= 1
        // Re-sync with the server once this item's taps have all been saved.
        if (pendingQty.current[item.key] === 0) await fetchCart()
      })
  }

  const removeRow = (item: CartRow, message: string, undoable = true) => {
    withBusy(item.key, async () => {
      setRemovingKeys((r) => [...r, item.key])
      setCart((prev) => prev.filter((r) => r.key !== item.key))
      setUnselected((prev) => prev.filter((k) => k !== item.key))
      await cartService.removeItem(item.id, item.variantId)
      await new Promise((r) => setTimeout(r, 220))
      setRemovingKeys((r) => r.filter((k) => k !== item.key))
      const undo = undoable
        ? async () => {
            setNotice(null)
            await cartService.addItem({
              productId: item.id, variationId: item.variantId || 0, quantity: item.qty,
              name: item.name, brand: item.brand, price: item.price, image: item.img,
            })
            await fetchCart()
          }
        : undefined
      setNotice({ text: message, type: 'ok', undo })
      await fetchCart()
    })
  }

  const handleSaveForLater = (item: CartRow) => {
    addToWishlist(item.id)
    removeRow(item, `${item.name} moved to your wishlist`, false)
  }

  const handleConfirmClear = async () => {
    setConfirmClear(false)
    if (partialSelection) {
      const keys = new Set(selectedRows.map((item) => item.key))
      setCart((prev) => prev.filter((item) => !keys.has(item.key)))
      for (const item of selectedRows) await cartService.removeItem(item.id, item.variantId)
      setUnselected([])
      setNotice({ text: `${selectedRows.length} item${selectedRows.length !== 1 ? 's' : ''} removed`, type: 'ok' })
      await fetchCart()
      return
    }
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
              <header className="cx-head">
                <span className="cx-head-icon"><ShoppingCart size={24} /></span>
                <h1>Shopping Cart</h1>
                <span className="cx-count">{totalItems} Item{totalItems !== 1 ? 's' : ''}</span>
                <button className="cx-clear" onClick={() => setConfirmClear(true)} disabled={selectedRows.length === 0}>
                  <Trash2 size={18} />
                  {partialSelection ? `Remove Selected (${selectedRows.length})` : 'Clear Cart'}
                </button>
              </header>

              <ul className="cx-items">
                {cart.map((item) => {
                  const busy = busyKeys.includes(item.key)
                  const off = pctOff(item.mrp, item.price)
                  const checked = !unselected.includes(item.key)
                  return (
                    <li key={item.key} className={`cx-item${removingKeys.includes(item.key) ? ' is-removing' : ''}${busy ? ' is-busy' : ''}`}>
                      <label className="cx-check">
                        <input type="checkbox" checked={checked} onChange={() => toggleSelected(item.key)} aria-label={`Select ${item.name}`} />
                        <span><Check size={16} strokeWidth={3} /></span>
                      </label>

                      <button className="cx-thumb" onClick={() => navigate(`/product/${item.id}`)} aria-label={`View ${item.name}`}>
                        <img src={item.img} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG }} />
                      </button>

                      <div className="cx-info">
                        <Link to={`/product/${item.id}`} className="cx-name">{item.name}</Link>
                        {item.specs.length > 0 && (
                          <div className="cx-specs">
                            {item.specs.map((s) => <span key={s}>{s}</span>)}
                          </div>
                        )}
                        <span className={`cx-stock is-${item.stock}`}>
                          <span className="cx-dot" />
                          {item.stock === 'out' ? 'Out of Stock' : item.stock === 'low' ? 'Only a few left' : 'In Stock'}
                        </span>
                      </div>

                      <div className="cx-qty" aria-label="Quantity">
                        <button onClick={() => handleQtyChange(item, -1)} disabled={busy || item.qty <= 1} aria-label="Decrease quantity"><Minus size={18} /></button>
                        <span>{item.qty}</span>
                        <button onClick={() => handleQtyChange(item, 1)} disabled={busy || item.stock === 'out'} aria-label="Increase quantity"><Plus size={18} /></button>
                      </div>

                      <div className="cx-price">
                        <div className="cx-price-now">{fmt(item.price * item.qty)}</div>
                        {off > 0 && (
                          <div className="cx-price-was">
                            <s>{fmt(item.mrp * item.qty)}</s>
                            <span className="cx-off">{off}% OFF</span>
                          </div>
                        )}
                      </div>

                      <div className="cx-row-actions">
                        <button className="cx-icon-btn" onClick={() => removeRow(item, `${item.name} removed`)} disabled={busy} aria-label={`Remove ${item.name}`} title="Remove">
                          <Trash2 size={22} />
                        </button>
                        <button className="cx-icon-btn is-soft" onClick={() => handleSaveForLater(item)} disabled={busy} aria-label={`Move ${item.name} to wishlist`} title="Move to wishlist">
                          <Heart size={17} />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
              {hasOutOfStock && <p className="cx-warn">Remove out-of-stock items to continue to checkout.</p>}
            </section>

            <aside className="cx-side">
              <div className="cx-summary">
                <div className="cx-summary-head">
                  <Tag size={26} />
                  <h2>Order Summary</h2>
                </div>
                <div className="cx-summary-body">
                  <dl>
                    <div><dt>Subtotal ({totalItems} Item{totalItems !== 1 ? 's' : ''})</dt><dd>{fmt(mrpTotal)}</dd></div>
                    {productSavings > 0 && <div className="is-save"><dt>Discount</dt><dd>– {fmt(productSavings)}</dd></div>}
                    {appliedPromo && <div className="is-save"><dt>Coupon ({appliedPromo})</dt><dd>– {fmt(promoDiscount)}</dd></div>}
                    <div>
                      <dt>Delivery</dt>
                      <dd className={shipping === 0 ? 'is-free' : ''}>{shipping === 0 ? 'Free' : fmt(shipping)}</dd>
                    </div>
                    <div><dt>{gstLabel()}</dt><dd>{fmt(tax)}</dd></div>
                  </dl>
                  {shipping > 0 && toFreeShipping > 0 && (
                    <p className="cx-ship-hint"><Truck size={15} /> Add {fmt(toFreeShipping)} more for free delivery</p>
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
                        <input
                          type="text"
                          placeholder="Have a promo code?"
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          aria-label="Promo code"
                        />
                        <button type="submit" disabled={promoBusy}>{promoBusy ? '…' : 'Apply'}</button>
                      </form>
                    )}
                    {promoMsg && <div className={`cx-promo-msg is-${promoMsg.type}`}>{promoMsg.text}</div>}
                  </div>

                  <div className="cx-total">
                    <span>Total Amount</span>
                    <strong>{fmt(total)}</strong>
                  </div>
                  {productSavings + promoDiscount > 0 && (
                    <div className="cx-savings">
                      <BadgePercent size={20} /> You save <strong>{fmt(productSavings + promoDiscount)}</strong> on this order!
                    </div>
                  )}

                  <button
                    className="cx-btn cx-btn-primary cx-checkout"
                    disabled={cart.length === 0 || hasOutOfStock}
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout <ArrowRight size={20} />
                  </button>
                  <Link to="/collection/all" className="cx-btn cx-btn-outline cx-continue">
                    <ArrowLeft size={20} /> Continue Shopping
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        )}

        {!loading && (
          <ul className="cx-benefits">
            <li><span><Truck size={26} /></span><div><strong>Free Delivery</strong><small>On orders over {fmt(FREE_SHIPPING_THRESHOLD)}</small></div></li>
            <li><span><ShieldCheck size={26} /></span><div><strong>1-Year Warranty</strong><small>On selected products</small></div></li>
            <li><span><Repeat size={26} /></span><div><strong>Easy 7-Day Returns</strong><small>Hassle-free returns</small></div></li>
            <li><span><Headphones size={26} /></span><div><strong>Expert Support</strong><small>Mon – Sat, 10 AM – 8 PM</small></div></li>
          </ul>
        )}

        {recs.length > 0 && (
          <section className="cx-recs">
            <div className="cx-recs-head">
              <h2>You May Also Like</h2>
              <Link to="/collection/all">View All <ArrowRight size={18} /></Link>
            </div>
            <div className="cx-recs-grid">
              {recs.map((r) => {
                const off = pctOff(r.mrp, r.price)
                const added = addedRecIds[r.id]
                return (
                  <article key={r.id} className="cx-rec">
                    <button className="cx-rec-img" onClick={() => navigate(`/product/${r.id}`)} aria-label={`View ${r.name}`}>
                      <img src={r.img} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG }} />
                    </button>
                    <div className="cx-rec-body">
                      <Link to={`/product/${r.id}`} className="cx-rec-name">{r.name}</Link>
                      {r.rating > 0 && (
                        <div className="cx-rec-rating"><Star size={15} fill="currentColor" /> <b>{r.rating.toFixed(1)}</b></div>
                      )}
                      <div className="cx-rec-price">
                        {r.price > 0 && <strong>{fmt(r.price)}</strong>}
                        {off > 0 && <s>{fmt(r.mrp)}</s>}
                      </div>
                      {off > 0 && <span className="cx-off">{off}% OFF</span>}
                    </div>
                    <button
                      className={`cx-rec-add${added ? ' is-added' : ''}`}
                      onClick={() => handleAddRec(r)}
                      disabled={added}
                      aria-label={added ? `${r.name} added` : `Add ${r.name} to cart`}
                    >
                      {added ? <Check size={20} /> : <ShoppingCart size={20} />}
                    </button>
                  </article>
                )
              })}
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
            <h2 id="cx-clear-title">{partialSelection ? 'Remove selected items?' : 'Clear your cart?'}</h2>
            <p id="cx-clear-desc">
              {partialSelection
                ? `${selectedRows.length} selected ${selectedRows.length === 1 ? 'item' : 'items'} will be removed from your cart.`
                : `All ${totalItems} ${totalItems === 1 ? 'item' : 'items'} will be removed from your cart. You can add them again anytime.`}
            </p>
            <div className="cx-modal-actions">
              <button className="cx-btn cx-btn-ghost" onClick={() => setConfirmClear(false)} autoFocus>Keep items</button>
              <button className="cx-btn cx-btn-danger" onClick={handleConfirmClear}>{partialSelection ? 'Remove' : 'Clear cart'}</button>
            </div>
          </div>
        </div>
      )}

      {notice && (
        <div className={`cx-toast is-${notice.type}`} role="status">
          {notice.type === 'ok' ? <Check size={16} /> : <X size={16} />}
          {notice.text}
          {notice.undo && (
            <button type="button" className="cx-toast-undo" onClick={notice.undo}>Undo</button>
          )}
        </div>
      )}
    </div>
  )
}
