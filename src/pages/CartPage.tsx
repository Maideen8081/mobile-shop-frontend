import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import { productService } from '../services/productService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const FALLBACK_IMG = 'https://picsum.photos/seed/product/300/300'

interface WinkCartItem {
  id: number
  variantId?: number | null
  name: string
  meta: string
  sku: string
  price: number
  qty: number
  stock: 'in' | 'low' | 'out'
  stockText: string
  img: string
}

interface RecProduct {
  id: number
  name: string
  price: number
  img: string
  brand?: string
}

const DEFAULT_CART_ITEMS: WinkCartItem[] = [
  { id: 1, name: "Aalto Sofa", meta: "Oat Boucle, Walnut Legs", sku: "LL-SF-AAL-OAT", price: 2480, qty: 1, stock: "in", stockText: "In Stock", img: "https://picsum.photos/seed/sofa/300/300" },
  { id: 2, name: "Hearth Dining Table", meta: "Solid Oak, Seats 6", sku: "LL-TB-HRT-OAK", price: 1860, qty: 1, stock: "in", stockText: "In Stock", img: "https://picsum.photos/seed/table/300/300" },
  { id: 3, name: "Hue Wall Sconce", meta: "Brushed Brass, Set of 2", sku: "LL-LT-HUE-BRS", price: 210, qty: 2, stock: "low", stockText: "Only 3 left", img: "https://picsum.photos/seed/lamp/300/300" },
]

const DEFAULT_RECOMMENDATIONS: RecProduct[] = [
  { id: 101, name: "Pebble Side Table", price: 480, img: "https://picsum.photos/seed/pebble/300/300", brand: "PhoneFix" },
  { id: 102, name: "Wisp Floor Lamp", price: 260, img: "https://picsum.photos/seed/wisp/300/300", brand: "PhoneFix" },
  { id: 103, name: "Folio Coffee Table", price: 540, img: "https://picsum.photos/seed/folio/300/300", brand: "PhoneFix" },
  { id: 104, name: "Bramble Armchair", price: 920, img: "https://picsum.photos/seed/bramble/300/300", brand: "PhoneFix" },
]

function getProductImage(product: any): string {
  const raw = product.common_image || product.image || product.images?.[0] || product.thumbnail || product.variants?.[0]?.images?.[0] || ''
  if (!raw) return FALLBACK_IMG
  if (raw.startsWith('http') || raw.startsWith('data:')) return raw
  return `${API_BASE_URL.replace(/\/+$/, '')}/${raw.replace(/^\/+/, '')}`
}

function getProductPrice(product: any): number {
  const v = product.variants?.[0]
  if (!v) return product.min_price || product.price || 0
  let rawPrice = v.discount_price || v.discountPrice || v.price || product.min_price || 0
  if (!rawPrice || rawPrice === 0) {
    rawPrice = v.mrp || v.original_price || v.originalPrice || product.min_price || 0
  }
  return isNaN(Number(rawPrice)) ? 0 : Number(rawPrice)
}

export default function CartPage() {
  const navigate = useNavigate()
  const [cart, setCart] = useState<WinkCartItem[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('cart') || '[]')
      if (Array.isArray(stored) && stored.length > 0) {
        return stored.map((item: any) => ({
          id: item.productId || item.id,
          variantId: item.variantId,
          name: item.name || 'Item',
          meta: [item.brand, item.storage, item.ram, item.color].filter(Boolean).join(', ') || 'Standard Edition',
          sku: item.sku || `SKU-MOB-${item.productId || item.id}`,
          price: item.price || 0,
          qty: item.quantity || item.qty || 1,
          stock: 'in',
          stockText: 'In Stock',
          img: item.image || item.img || FALLBACK_IMG,
        }))
      }
    } catch {}
    return DEFAULT_CART_ITEMS
  })

  const [recommendations, setRecommendations] = useState<RecProduct[]>(DEFAULT_RECOMMENDATIONS)
  const [removingIds, setRemovingIds] = useState<number[]>([])
  const [promoInput, setPromoInput] = useState('')
  const [discountRate, setDiscountRate] = useState(0)
  const [promoMsg, setPromoMsg] = useState<{ text: string; type: 'ok' | 'err' | '' }>({ text: '', type: '' })
  const [addedRecIds, setAddedRecIds] = useState<Record<number, boolean>>({})
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  // Fetch real API products for recommendations
  useEffect(() => {
    productService
      .list({ page_size: 4 })
      .then((prods) => {
        if (prods && prods.length > 0) {
          const mapped: RecProduct[] = prods.slice(0, 4).map((p: any) => ({
            id: p.id,
            name: p.name || p.product_name || 'Product',
            price: getProductPrice(p) || 199,
            img: getProductImage(p),
            brand: p.brand || 'PhoneFix',
          }))
          setRecommendations(mapped)
        }
      })
      .catch(() => {})
  }, [])

  // Sync back to cartService/localStorage when cart state changes
  useEffect(() => {
    try {
      const mapped = cart.map((i) => ({
        productId: i.id,
        variantId: i.variantId || null,
        name: i.name,
        brand: i.meta.split(', ')[0] || '',
        price: i.price,
        image: i.img,
        quantity: i.qty,
      }))
      localStorage.setItem('cart', JSON.stringify(mapped))
      window.dispatchEvent(new Event('cart-updated'))
    } catch {}
  }, [cart])

  function fmt(n: number) {
    return '₹' + Math.round(n).toLocaleString('en-IN')
  }

  const totalItems = cart.reduce((s, i) => s + i.qty, 0)
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const discount = subtotal * discountRate
  const tax = (subtotal - discount) * 0.065
  const total = subtotal - discount + tax

  const handleQtyChange = (id: number, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const newQty = item.qty + delta
        if (newQty < 1) return item
        return { ...item, qty: newQty }
      })
    )
  }

  const handleRemove = (id: number) => {
    setRemovingIds((prev) => [...prev, id])
    setTimeout(() => {
      setCart((prev) => prev.filter((i) => i.id !== id))
      setRemovingIds((prev) => prev.filter((x) => x !== id))
    }, 280)
  }

  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase()
    if (code === 'WINKRED10') {
      setDiscountRate(0.10)
      setPromoMsg({ text: 'WINKRED10 applied — 10% off', type: 'ok' })
    } else if (code === '') {
      setPromoMsg({ text: 'Enter a promo code', type: 'err' })
    } else {
      setDiscountRate(0)
      setPromoMsg({ text: 'Invalid promo code', type: 'err' })
    }
  }

  const handleCheckout = () => {
    if (cart.length === 0) return
    setCheckoutLoading(true)
    setTimeout(() => {
      setCheckoutLoading(false)
      navigate('/checkout/address')
    }, 1200)
  }

  const handleAddRec = (rec: RecProduct) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === rec.id)
      if (existing) {
        return prev.map((i) => (i.id === rec.id ? { ...i, qty: i.qty + 1 } : i))
      } else {
        return [
          ...prev,
          {
            id: rec.id,
            name: rec.name,
            meta: rec.brand || 'Standard Edition',
            sku: `LL-REC-${rec.id}`,
            price: rec.price,
            qty: 1,
            stock: 'in',
            stockText: 'In Stock',
            img: rec.img,
          },
        ]
      }
    })
    setAddedRecIds((prev) => ({ ...prev, [rec.id]: true }))
    setTimeout(() => {
      setAddedRecIds((prev) => ({ ...prev, [rec.id]: false }))
    }, 1200)
  }

  return (
    <div className="wink-cart-root">
      <SiteTopNav />
      <div>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,500&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />

        <div className="ribbon">
          White-glove delivery included &nbsp;·&nbsp; <span>Members save an extra 10% with code WINKRED10</span>
        </div>

        <div className="topbar">
          <div className="topbar-inner">
            <div className="fade-up">
              <div className="eyebrow">Checkout</div>
              <h1 className="serif">Your <em>Cart</em></h1>
              <div className="item-count">
                {totalItems} item{totalItems !== 1 ? 's' : ''} selected
              </div>
            </div>
            <div className="stepper fade-up" style={{ animationDelay: '.1s' }}>
              <div className="step active">
                <div className="step-num serif">1</div>
                <div className="step-label">Cart</div>
              </div>
              <div className="step-line"></div>
              <div className="step">
                <div className="step-num serif">2</div>
                <div className="step-label">Shipping</div>
              </div>
              <div className="step-line"></div>
              <div className="step">
                <div className="step-num serif">3</div>
                <div className="step-label">Payment</div>
              </div>
            </div>
          </div>
        </div>

        <div className="cart-layout">
          <div className="fade-up" style={{ animationDelay: '.12s' }}>
            <div className="col-heading">
              <span>Your Selection</span>
              <span>
                {totalItems} item{totalItems !== 1 ? 's' : ''}
              </span>
            </div>

            {cart.length > 0 ? (
              <div className="cart-items">
                {cart.map((item) => {
                  const isRemoving = removingIds.includes(item.id)
                  return (
                    <div
                      key={item.id}
                      className={`cart-card ${isRemoving ? 'removing' : ''}`}
                    >
                      <div
                        className="cart-thumb"
                        onClick={() => navigate(`/product/${item.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        <img src={item.img} alt={item.name} />
                      </div>
                      <div className="cart-main">
                        <div className="cart-main-top">
                          <div className="cart-title">
                            <h3
                              className="serif"
                              onClick={() => navigate(`/product/${item.id}`)}
                              style={{ cursor: 'pointer' }}
                            >
                              {item.name}
                            </h3>
                            <div className="meta">{item.meta}</div>
                            <div className="sku">SKU {item.sku}</div>
                            <div className={`stock ${item.stock}`}>
                              <span className="dot"></span>
                              {item.stockText}
                            </div>
                          </div>
                          <div className="cart-price serif">
                            {fmt(item.price * item.qty)}
                            <span className="unit">{fmt(item.price)} each</span>
                          </div>
                        </div>
                        <div className="cart-bottom">
                          <div className="qty-stepper">
                            <button
                              className="qty-dec"
                              aria-label="Decrease quantity"
                              onClick={() => handleQtyChange(item.id, -1)}
                            >
                              –
                            </button>
                            <span className="qty-val serif">{item.qty}</span>
                            <button
                              className="qty-inc"
                              aria-label="Increase quantity"
                              onClick={() => handleQtyChange(item.id, 1)}
                            >
                              +
                            </button>
                          </div>
                          <div className="card-links">
                            <button className="remove" onClick={() => handleRemove(item.id)}>
                              Remove
                            </button>
                            <button className="save" onClick={() => handleRemove(item.id)}>
                              Save for later
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state show">
                <svg viewBox="0 0 24 24">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
                </svg>
                <p className="serif">Your cart is empty.</p>
                <Link to="/collection/all">Continue Shopping</Link>
              </div>
            )}

            <Link to="/collection/all" className="continue-link">
              <svg viewBox="0 0 24 24">
                <path d="M19 12H5" />
                <path d="M12 19l-7-7 7-7" />
              </svg>
              Continue Shopping
            </Link>
          </div>

          <aside className="summary fade-up" style={{ animationDelay: '.2s' }}>
            <h2>Order Summary</h2>
            <div className="sub">Review before you proceed to shipping</div>
            <div className="summary-row">
              <span>Subtotal · {totalItems} item{totalItems !== 1 ? 's' : ''}</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <div className="summary-row free">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="summary-row">
              <span>Estimated Tax</span>
              <span>{fmt(tax)}</span>
            </div>
            {discountRate > 0 && (
              <div className="summary-row">
                <span>Discount</span>
                <span style={{ color: '#9BC49E' }}>-{fmt(discount)}</span>
              </div>
            )}
            <div className="summary-divider"></div>

            <div className="promo-row">
              <input
                type="text"
                placeholder="Promo code"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
              />
              <button onClick={handleApplyPromo}>Apply</button>
            </div>
            {promoMsg.text && (
              <div className={`promo-msg ${promoMsg.type}`}>{promoMsg.text}</div>
            )}

            <div className="summary-total">
              <span className="label">Total</span>
              <span className="amount serif">{fmt(total)}</span>
            </div>

            <button
              className="checkout-btn"
              disabled={cart.length === 0}
              style={{ opacity: cart.length === 0 ? 0.5 : 1 }}
              onClick={handleCheckout}
            >
              {checkoutLoading ? (
                'Redirecting…'
              ) : (
                <>
                  Proceed to Checkout
                  <svg viewBox="0 0 24 24">
                    <path d="M5 12h14" />
                    <path d="M13 6l6 6-6 6" />
                  </svg>
                </>
              )}
            </button>

            <div className="trust-list">
              <div className="trust-item">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
                </svg>
                Secure checkout, encrypted payment
              </div>
              <div className="trust-item">
                <svg viewBox="0 0 24 24">
                  <rect x="1" y="4" width="22" height="16" rx="2" />
                  <path d="M1 10h22" />
                </svg>
                Free white-glove delivery on this order
              </div>
            </div>
          </aside>
        </div>

        <div className="recs">
          <div className="recs-head">
            <h2 className="serif">Add to your order</h2>
            <div className="note">Curated to complement your selection</div>
          </div>
          <div className="recs-grid">
            {recommendations.map((r) => {
              const isAdded = addedRecIds[r.id]
              return (
                <div key={r.id} className="rec-card">
                  <div
                    className="rec-img"
                    onClick={() => navigate(`/product/${r.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <img src={r.img} alt={r.name} />
                  </div>
                  <div className="rec-info">
                    <h4
                      className="serif"
                      onClick={() => navigate(`/product/${r.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      {r.name}
                    </h4>
                    <div className="rec-bottom">
                      <button
                        className={`add-btn ${isAdded ? 'added' : ''}`}
                        onClick={() => handleAddRec(r)}
                      >
                        {isAdded ? 'Added ✓' : '+ Add'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <style>{`
        .wink-cart-root {
          --ink:#181513;
          --ink-2:#2A2624;
          --ink-soft:#54504C;
          --paper:#ffffff;
          --paper-2:#F8F8F8;
          --line:#E7E7EA;
          --line-soft:#EEE8DC;
          --red:#A8172A;
          --red-bright:#C41E2F;
          --red-tint:#F6E4E1;
          --cream:#F9F9F9;
          --white:#ffffff;
          --gold:#B08A4E;
          --radius-sm:10px;
          --radius-md:18px;
          --radius-lg:26px;

          font-family:'Inter', sans-serif;
          background:var(--paper);
          color:var(--ink);
          -webkit-font-smoothing:antialiased;
          letter-spacing:-0.005em;
          min-height: 100vh;
        }
        .wink-cart-root .serif { font-family:'Fraunces', serif; }
        .wink-cart-root img { max-width:100%; display:block; }
        .wink-cart-root button { font-family:inherit; cursor:pointer; background:none; border:none; }
        .wink-cart-root input { font-family:inherit; }
        .wink-cart-root svg { width:16px; height:16px; stroke:currentColor; fill:none; stroke-width:1.6; stroke-linecap:round; stroke-linejoin:round; }
        .wink-cart-root ::selection { background:var(--red); color:var(--white); }

        @keyframes fadeUp { from{opacity:0; transform:translateY(10px);} to{opacity:1; transform:translateY(0);} }
        .wink-cart-root .fade-up { animation:fadeUp .5s cubic-bezier(.2,.7,.3,1) both; }

        /* ===== Top ribbon ===== */
        .wink-cart-root .ribbon {
          background:var(--ink);
          color:#D9D4CC;
          text-align:center; font-size:11.5px; letter-spacing:.08em; text-transform:uppercase;
          padding:9px 16px; font-weight:600;
        }
        .wink-cart-root .ribbon span { color:#fff; }

        /* ===== Header ===== */
        .wink-cart-root .topbar {
          background:var(--paper);
          padding:52px 56px 38px;
          border-bottom:1px solid var(--line);
        }
        .wink-cart-root .topbar-inner {
          max-width:1280px; margin:0 auto;
          display:flex; align-items:flex-end; justify-content:space-between; flex-wrap:wrap; gap:24px;
        }
        .wink-cart-root .eyebrow {
          font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
          color:var(--red); margin-bottom:10px; display:flex; align-items:center; gap:8px;
        }
        .wink-cart-root .eyebrow::before { content:''; width:18px; height:1px; background:var(--red); }
        .wink-cart-root .topbar h1 { font-size:44px; font-weight:500; letter-spacing:-0.01em; line-height:1; }
        .wink-cart-root .topbar h1 em { font-style:italic; color:var(--red); }
        .wink-cart-root .item-count { font-size:13.5px; color:var(--ink-soft); margin-top:10px; font-weight:500; }

        .wink-cart-root .stepper { display:flex; align-items:center; gap:0; }
        .wink-cart-root .step { display:flex; align-items:center; gap:10px; }
        .wink-cart-root .step-num {
          width:30px; height:30px; border-radius:50%;
          display:flex; align-items:center; justify-content:center;
          font-size:12px; font-weight:600; font-family:'Fraunces', serif;
          background:transparent; color:var(--ink-soft); border:1px solid var(--line);
        }
        .wink-cart-root .step.active .step-num { background:var(--red); color:var(--white); border-color:var(--red); }
        .wink-cart-root .step.done .step-num { background:var(--ink); color:var(--white); border-color:var(--ink); }
        .wink-cart-root .step-label { font-size:12.5px; font-weight:600; color:var(--ink-soft); letter-spacing:.01em; }
        .wink-cart-root .step.active .step-label { color:var(--ink); }
        .wink-cart-root .step-line { width:44px; height:1px; background:var(--line); margin:0 12px; }

        /* ===== Layout ===== */
        .wink-cart-root .cart-layout {
          max-width:1280px; margin:0 auto; padding:48px 56px 100px;
          display:grid; grid-template-columns:1fr 380px; gap:56px; align-items:start;
        }

        .wink-cart-root .col-heading {
          display:flex; align-items:center; justify-content:space-between;
          margin-bottom:6px; padding-bottom:16px; border-bottom:1px solid var(--line);
        }
        .wink-cart-root .col-heading span { font-size:11px; font-weight:700; letter-spacing:.1em; text-transform:uppercase; color:var(--ink-soft); }

        /* ===== Cart items ===== */
        .wink-cart-root .cart-items { display:flex; flex-direction:column; }
        .wink-cart-root .cart-card {
          display:flex; gap:26px;
          padding:30px 0;
          border-bottom:1px solid var(--line-soft);
          transition:opacity .3s ease, transform .3s ease;
        }
        .wink-cart-root .cart-card:last-child { border-bottom:none; }
        .wink-cart-root .cart-thumb {
          width:128px; height:128px; border-radius:var(--radius-sm);
          overflow:hidden; flex-shrink:0; background:#ffffff;
          border:1px solid var(--line);
          position:relative;
          display:flex; align-items:center; justify-content:center;
          padding:8px;
        }
        .wink-cart-root .cart-thumb img { width:100%; height:100%; object-fit:contain; transition:transform .6s cubic-bezier(.2,.7,.3,1); }
        .wink-cart-root .cart-card:hover .cart-thumb img { transform:scale(1.08); }
        .wink-cart-root .cart-main { flex:1; display:flex; flex-direction:column; justify-space-between; min-width:0; }
        .wink-cart-root .cart-main-top { display:flex; justify-content:space-between; gap:16px; }
        .wink-cart-root .cart-title h3 { font-family:'Fraunces', serif; font-size:19px; font-weight:500; margin-bottom:6px; }
        .wink-cart-root .cart-title .meta { font-size:12.5px; color:var(--ink-soft); margin-bottom:3px; }
        .wink-cart-root .cart-title .sku { font-size:10.5px; color:#A39C8E; letter-spacing:.03em; }
        .wink-cart-root .cart-price { font-family:'Fraunces', serif; font-size:19px; font-weight:500; white-space:nowrap; text-align:right; }
        .wink-cart-root .cart-price .unit { display:block; font-family:'Inter', sans-serif; font-size:11px; color:#A39C8E; font-weight:500; margin-top:3px; }

        .wink-cart-root .stock {
          display:inline-flex; align-items:center; gap:6px;
          font-size:11.5px; font-weight:600; margin-top:12px; width:fit-content; letter-spacing:.01em;
        }
        .wink-cart-root .stock.in { color:#4C7A54; }
        .wink-cart-root .stock.low { color:var(--red); }
        .wink-cart-root .stock .dot { width:5px; height:5px; border-radius:50%; background:currentColor; }

        .wink-cart-root .cart-bottom { display:flex; align-items:center; justify-content:space-between; margin-top:16px; flex-wrap:wrap; gap:14px; }
        .wink-cart-root .qty-stepper {
          display:flex; align-items:center; gap:0;
          border:1px solid var(--line); border-radius:999px; overflow:hidden;
          background:var(--cream);
        }
        .wink-cart-root .qty-stepper button {
          width:32px; height:32px; font-size:14px; color:var(--ink);
          display:flex; align-items:center; justify-content:center;
        }
        .wink-cart-root .qty-stepper button:hover { background:var(--red); color:var(--white); }
        .wink-cart-root .qty-stepper .qty-val {
          width:30px; text-align:center; font-size:12.5px; font-weight:600; font-family:'Fraunces', serif;
        }
        .wink-cart-root .card-links { display:flex; align-items:center; gap:18px; font-size:12px; font-weight:600; }
        .wink-cart-root .card-links button { color:var(--ink-soft); border-bottom:1px solid transparent; padding-bottom:1px; }
        .wink-cart-root .card-links button:hover { color:var(--red); border-color:var(--red); }

        .wink-cart-root .cart-card.removing { opacity:0; transform:translateX(24px); }

        .wink-cart-root .continue-link {
          display:inline-flex; align-items:center; gap:9px;
          font-size:13px; font-weight:600; color:var(--ink); margin-top:28px;
          padding-bottom:2px; border-bottom:1px solid var(--ink);
          text-decoration:none;
        }
        .wink-cart-root .continue-link:hover { color:var(--red); border-color:var(--red); }
        .wink-cart-root .continue-link svg { width:14px; height:14px; }

        /* ===== Order summary — signature dark panel ===== */
        .wink-cart-root .summary {
          background:var(--ink);
          color:#EDE9E1;
          border-radius:var(--radius-lg);
          padding:36px 32px 30px;
          position:sticky; top:120px;
          box-shadow:0 30px 60px -20px rgba(24,21,19,0.35);
        }
        .wink-cart-root .summary::before {
          content:'';
          display:block;
          height:2px;
          width:36px;
          background:var(--red);
          margin-bottom:20px;
        }
        .wink-cart-root .summary h2 { font-family:'Fraunces', serif; font-size:22px; font-weight:500; margin-bottom:4px; }
        .wink-cart-root .summary .sub { font-size:12px; color:#A39C8E; margin-bottom:22px; }

        .wink-cart-root .summary-row {
          display:flex; justify-content:space-between; align-items:center;
          font-size:13px; color:#B7B0A5; padding:10px 0;
        }
        .wink-cart-root .summary-row span:last-child { color:#EDE9E1; font-weight:600; font-family:'Fraunces', serif; }
        .wink-cart-root .summary-row.free span:last-child { color:#9BC49E; }
        .wink-cart-root .summary-divider { height:1px; background:rgba(255,255,255,0.09); margin:6px 0; }

        .wink-cart-root .promo-row { display:flex; gap:8px; margin:18px 0 4px; }
        .wink-cart-root .promo-row input {
          flex:1; border:1px solid rgba(255,255,255,0.14); background:rgba(255,255,255,0.04); color:#fff;
          border-radius:999px; padding:12px 16px; font-size:12.5px; outline:none;
        }
        .wink-cart-root .promo-row input::placeholder { color:#8D877C; }
        .wink-cart-root .promo-row input:focus { border-color:var(--red); }
        .wink-cart-root .promo-row button {
          background:rgba(255,255,255,0.08); color:#fff; border:1px solid rgba(255,255,255,0.14);
          padding:0 20px; border-radius:999px; font-size:12px; font-weight:600;
        }
        .wink-cart-root .promo-row button:hover { background:var(--red); border-color:var(--red); }
        .wink-cart-root .promo-msg { font-size:11.5px; margin:2px 0 8px; font-weight:600; min-height:14px; }
        .wink-cart-root .promo-msg.ok { color:#9BC49E; }
        .wink-cart-root .promo-msg.err { color:#E39A9F; }

        .wink-cart-root .summary-total {
          display:flex; justify-content:space-between; align-items:baseline;
          padding:16px 0 24px; margin-top:6px; border-top:1px solid rgba(255,255,255,0.09);
        }
        .wink-cart-root .summary-total .label { font-size:14px; font-weight:600; color:#EDE9E1; letter-spacing:.02em; }
        .wink-cart-root .summary-total .amount { font-family:'Fraunces', serif; font-size:28px; font-weight:500; color:#fff; }

        .wink-cart-root .checkout-btn {
          width:100%; background:var(--red); color:var(--white); border:none;
          padding:17px; border-radius:999px; font-size:13.5px; font-weight:700; letter-spacing:.02em;
          box-shadow:0 14px 26px -8px rgba(196,30,47,0.55);
          transition:background .2s ease, transform .15s ease;
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .wink-cart-root .checkout-btn:hover { background:var(--red-bright); transform:translateY(-2px); }
        .wink-cart-root .checkout-btn svg { width:14px; height:14px; }

        .wink-cart-root .trust-list { margin-top:22px; display:flex; flex-direction:column; gap:12px; }
        .wink-cart-root .trust-item { display:flex; align-items:center; gap:10px; font-size:11.5px; color:#A39C8E; font-weight:500; }
        .wink-cart-root .trust-item svg { color:var(--red); flex-shrink:0; width:15px; height:15px; }

        /* ===== Recommendations ===== */
        .wink-cart-root .recs { max-width:1280px; margin:0 auto; padding:0 56px 110px; }
        .wink-cart-root .recs-head {
          display:flex; align-items:baseline; justify-content:space-between;
          margin-bottom:30px; padding-bottom:20px; border-bottom:1px solid var(--line);
        }
        .wink-cart-root .recs-head h2 { font-family:'Fraunces', serif; font-size:26px; font-weight:500; }
        .wink-cart-root .recs-head .note { font-size:12.5px; color:var(--ink-soft); }
        .wink-cart-root .recs-grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:28px; }
        .wink-cart-root .rec-card { background:transparent; }
        .wink-cart-root .rec-img {
          aspect-ratio:1/1; background:#ffffff; overflow:hidden; border-radius:var(--radius-sm);
          border:1px solid var(--line);
          margin-bottom:16px; position:relative;
          display:flex; align-items:center; justify-content:center;
          padding:12px;
        }
        .wink-cart-root .rec-img img { width:100%; height:100%; object-fit:contain; transition:transform .5s cubic-bezier(.2,.7,.3,1); }
        .wink-cart-root .rec-card:hover .rec-img img { transform:scale(1.07); }
        .wink-cart-root .rec-info h4 { font-family:'Fraunces', serif; font-size:15.5px; font-weight:500; margin-bottom:6px; }
        .wink-cart-root .rec-bottom { display:flex; align-items:center; justify-content:flex-end; margin-top:10px; }
        .wink-cart-root .add-btn {
          background:transparent; color:var(--ink); border:1px solid var(--line);
          padding:8px 15px; border-radius:999px; font-size:11px; font-weight:700; letter-spacing:.03em;
          transition:all .2s ease;
        }
        .wink-cart-root .add-btn:hover { background:var(--ink); color:var(--white); border-color:var(--ink); }
        .wink-cart-root .add-btn.added { background:var(--red); color:var(--white); border-color:var(--red); }

        .wink-cart-root .empty-state {
          text-align:center; padding:70px 20px; border:1px dashed var(--line); border-radius:var(--radius-md); display:none;
        }
        .wink-cart-root .empty-state.show { display:block; }
        .wink-cart-root .empty-state svg { width:40px; height:40px; color:#A39C8E; margin:0 auto 16px; }
        .wink-cart-root .empty-state p { color:var(--ink-soft); font-size:14px; margin-bottom:18px; font-family:'Fraunces', serif; font-size:17px; }
        .wink-cart-root .empty-state a {
          display:inline-block; background:var(--red); color:var(--white); padding:12px 26px;
          border-radius:999px; font-size:12.5px; font-weight:700; text-decoration:none;
        }

        /* ===== Responsive ===== */
        @media (max-width: 1020px) {
          .wink-cart-root .cart-layout { grid-template-columns:1fr; padding:36px 32px 70px; gap:40px; }
          .wink-cart-root .summary { position:static; }
          .wink-cart-root .topbar { padding:38px 32px 28px; }
          .wink-cart-root .recs { padding:0 32px 80px; }
          .wink-cart-root .recs-grid { grid-template-columns:repeat(2, 1fr); gap:22px; }
          .wink-cart-root .step-label { display:none; }
          .wink-cart-root .step-line { width:24px; margin:0 8px; }
        }
        @media (max-width: 620px) {
          .wink-cart-root .topbar-inner { flex-direction:column; align-items:flex-start; }
          .wink-cart-root .topbar h1 { font-size:32px; }
          .wink-cart-root .stepper { align-self:flex-start; }
          .wink-cart-root .cart-card { gap:16px; }
          .wink-cart-root .cart-thumb { width:88px; height:88px; }
          .wink-cart-root .cart-title h3 { font-size:16px; }
          .wink-cart-root .cart-price { font-size:16px; }
          .wink-cart-root .cart-main-top { flex-direction:row; }
          .wink-cart-root .cart-bottom { flex-direction:column; align-items:flex-start; }
          .wink-cart-root .recs-grid { grid-template-columns:repeat(2, 1fr); gap:14px; }
          .wink-cart-root .summary { padding:28px 22px 24px; border-radius:20px; }
          .wink-cart-root .cart-layout { padding:28px 20px 56px; }
          .wink-cart-root .recs { padding:0 20px 64px; }
          .wink-cart-root .ribbon { font-size:10px; }
        }
      `}</style>
    </div>
  )
}
