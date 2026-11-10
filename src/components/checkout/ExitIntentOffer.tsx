import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BadgeCheck, ChevronRight, Clock, Gift, Loader2, RotateCcw, ShieldCheck, ShoppingCart, Sparkles, Tag, Truck, Wallet, X } from 'lucide-react'
import { offerService, type ExitOffer } from '../../services/offerService'
import { formatINR, validateCoupon, type CheckoutCoupon } from '../../utils/checkout'
import { useCutout } from '../../utils/removeBackground'
import './ExitIntentOffer.css'

// Shown when the shopper does anything on the payment page other than placing
// the order: ad 1 on the first such click, ad 2 on the next one after closing it.
// Never more than this per visit.
const MAX_SHOWS = 2
const ARM_DELAY_MS = 3000

// Clicks on these are part of the popup or finish the order, so they never open it.
const IGNORE_SELECTOR = '[data-exit-offer], [data-place-order]'
// Clicks on these do something, so we hold the action back while the ad is up.
const ACTION_SELECTOR = 'a[href], button, input, select, textarea, label, summary, [role="button"], [role="radio"], [role="checkbox"], [role="tab"], [role="link"], [role="menuitem"]'

export interface ExitOfferCartItem {
  productId: number
  name: string
  price: number
  mrp?: number
  image?: string
  quantity: number
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const resolveImage = (raw: string) =>
  raw.startsWith('http') || raw.startsWith('data:') || raw.startsWith('blob:')
    ? raw
    : `${API_BASE_URL.replace(/\/+$/, '')}/${raw.replace(/^\/+/, '')}`

/** Cart phone on the podium, with its white photo background cut out like the home page cards. */
function PodiumPhone({ image }: { image: string }) {
  const cutout = useCutout(resolveImage(image))
  return (
    <span className={`eo-phone${cutout.cut ? ' is-cut' : ''}`}>
      <img src={cutout.src} alt="" />
    </span>
  )
}

const EMPTY_OFFER: ExitOffer = { coupon: null, unlock_coupon: null, cart_savings: [], deals: [] }

interface Props {
  productIds: number[]
  subtotal: number
  /** The shopper's cart; shown as a reminder even when the server has no offer. */
  cartItems: ExitOfferCartItem[]
  /** False while the cart is loading or an order is being placed. */
  enabled: boolean
  appliedCoupon: CheckoutCoupon | null
  onApplyCoupon: (coupon: CheckoutCoupon) => void
}

function usableCoupon(offer: ExitOffer | null, applied: CheckoutCoupon | null) {
  const c = offer?.coupon
  if (!c) return null
  if (applied && (applied.code.toLowerCase() === c.code.toLowerCase() || applied.discount >= Number(c.discount_amount))) return null
  return c
}

function hasContent(offer: ExitOffer | null, applied: CheckoutCoupon | null, cartCount: number) {
  if (!offer) return false
  return Boolean(usableCoupon(offer, applied) || offer.unlock_coupon || offer.cart_savings.length || offer.deals.length || cartCount > 0)
}

const PERKS = [
  { icon: ShieldCheck, title: 'Secure', text: 'Checkout' },
  { icon: Truck, title: 'Free', text: 'Delivery' },
  { icon: RotateCcw, title: '7-Day', text: 'Returns' },
  { icon: Wallet, title: 'Cash on', text: 'Delivery' },
]

export default function ExitIntentOffer({ productIds, subtotal, cartItems, enabled, appliedCoupon, onApplyCoupon }: Props) {
  const navigate = useNavigate()
  const [offer, setOffer] = useState<ExitOffer | null>(null)
  const [open, setOpen] = useState(false)
  // Which ad is showing: 1 = first offer, 2 = "last chance" follow-up.
  const [variant, setVariant] = useState<1 | 2>(1)
  const shownCount = useRef(0)
  const [applying, setApplying] = useState(false)
  const [applyError, setApplyError] = useState('')
  const pendingLeave = useRef<(() => void) | null>(null)
  const [canLeave, setCanLeave] = useState(false)
  const guardActive = useRef(false)
  const armed = useRef(false)

  const cartCount = cartItems.length
  const latest = useRef({ enabled, offer, appliedCoupon, cartCount, open })
  useLayoutEffect(() => { latest.current = { enabled, offer, appliedCoupon, cartCount, open } })

  const idsKey = productIds.join(',')
  useEffect(() => {
    if (!enabled || !idsKey) return
    let cancelled = false
    offerService
      .getCheckoutExitOffer(idsKey.split(',').map(Number), subtotal)
      .then((o) => { if (!cancelled) setOffer(o) })
      // No server offer (or an older backend): still remind them of their cart.
      .catch(() => { if (!cancelled) setOffer(EMPTY_OFFER) })
    return () => { cancelled = true }
  }, [enabled, idsKey, subtotal])

  const ready = enabled && hasContent(offer, appliedCoupon, cartCount)
  // Once the back-button guard entry exists it must stay handled until we leave the page.
  const [guardOn, setGuardOn] = useState(false)
  if (ready && !guardOn) setGuardOn(true)

  useEffect(() => {
    if (!ready) return
    const t = window.setTimeout(() => { armed.current = true }, ARM_DELAY_MS)
    return () => window.clearTimeout(t)
  }, [ready])

  /** Opens the offer if it's still unseen; returns false when the caller should just carry on leaving. */
  const trigger = useCallback((leave: (() => void) | null) => {
    const { enabled, offer, appliedCoupon, cartCount, open } = latest.current
    if (!enabled || open || shownCount.current >= MAX_SHOWS || !hasContent(offer, appliedCoupon, cartCount)) return false
    shownCount.current += 1
    setVariant(shownCount.current === 1 ? 1 : 2)
    pendingLeave.current = leave
    setCanLeave(Boolean(leave))
    setApplyError('')
    setOpen(true)
    return true
  }, [])

  // Any click on the page except "Place order": links, buttons, payment options, empty space.
  // Runs in the capture phase so it sees the click before the page's own handlers.
  useEffect(() => {
    if (!ready) return
    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const el = e.target as Element | null
      if (!el?.closest || el.closest(IGNORE_SELECTOR)) return

      let leave: (() => void) | null = null
      const a = el.closest('a[href]') as HTMLAnchorElement | null
      if (a) {
        if (a.target === '_blank' || a.hasAttribute('download')) return
        const url = new URL(a.href, window.location.href)
        if (url.origin !== window.location.origin) return
        const to = url.pathname + url.search + url.hash
        if (url.pathname !== window.location.pathname) {
          leave = () => {
            const replace = guardActive.current
            guardActive.current = false
            navigate(to, { replace })
          }
        }
      }

      if (!trigger(leave)) return
      // Hold back whatever the click would have done; the shopper can click again after closing.
      if (el.closest(ACTION_SELECTOR)) {
        e.preventDefault()
        e.stopPropagation()
      }
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [ready, navigate, trigger])

  // Desktop: pointer heads for the tab bar / close button.
  useEffect(() => {
    if (!ready || !window.matchMedia('(pointer: fine)').matches) return
    const onOut = (e: MouseEvent) => {
      if (!armed.current || e.relatedTarget || e.clientY > 0) return
      trigger(null)
    }
    document.addEventListener('mouseout', onOut)
    return () => document.removeEventListener('mouseout', onOut)
  }, [ready, trigger])

  // Browser / phone back button: an extra history entry lets us catch the first "back".
  useEffect(() => {
    if (!guardOn) return
    if (!window.history.state?.exitOfferGuard) {
      window.history.pushState({ ...window.history.state, exitOfferGuard: true }, '')
    }
    guardActive.current = true
    const onPop = () => {
      if (!guardActive.current) return
      guardActive.current = false
      if (!trigger(() => window.history.back())) window.history.back()
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [guardOn, trigger])

  const stay = useCallback(() => {
    pendingLeave.current = null
    setOpen(false)
    // The back-button guard is used up once it fires; set it again while an ad is still left.
    if (guardOn && !guardActive.current && shownCount.current < MAX_SHOWS) {
      window.history.pushState({ ...window.history.state, exitOfferGuard: true }, '')
      guardActive.current = true
    }
  }, [guardOn])

  const leave = () => {
    const go = pendingLeave.current
    pendingLeave.current = null
    setOpen(false)
    go?.()
  }

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') stay() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, stay])

  // Freeze the page behind the popup; pad for the hidden scrollbar so the layout doesn't jump.
  useEffect(() => {
    if (!open) return
    const { body, documentElement: html } = document
    const scrollbar = window.innerWidth - html.clientWidth
    const prev = { bodyOverflow: body.style.overflow, htmlOverflow: html.style.overflow, padding: body.style.paddingRight }
    body.style.overflow = 'hidden'
    html.style.overflow = 'hidden'
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`
    return () => {
      body.style.overflow = prev.bodyOverflow
      html.style.overflow = prev.htmlOverflow
      body.style.paddingRight = prev.padding
    }
  }, [open])

  const coupon = usableCoupon(offer, appliedCoupon)

  const applyCoupon = async () => {
    if (!coupon) return
    setApplying(true)
    setApplyError('')
    try {
      const validated = await validateCoupon(coupon.code, subtotal)
      onApplyCoupon(validated)
      stay()
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : 'Couldn’t apply that code')
    } finally {
      setApplying(false)
    }
  }

  const openDeal = (productId: number, variantId: number) => {
    pendingLeave.current = null
    setOpen(false)
    const replace = guardActive.current
    guardActive.current = false
    navigate(`/product/${productId}/${variantId}`, { replace })
  }

  if (!open || !offer) return null

  const localSaving = cartItems
    .filter((i) => i.mrp && i.mrp > i.price)
    .map((i) => ({ name: i.name, percent_off: Math.round(((i.mrp! - i.price) / i.mrp!) * 100) }))
    .sort((a, b) => b.percent_off - a.percent_off)[0]
  const saving = offer.cart_savings[0] ?? localSaving
    const unlock = offer.unlock_coupon
  const second = variant === 2
  // The follow-up ad leads with the biggest discounts so it doesn't repeat the first one.
  const deals = second
    ? [...offer.deals].sort((a, b) => b.percent_off - a.percent_off).slice(0, 4)
    : offer.deals
  const HeroIcon = second ? Clock : Gift
  const thumbs = cartItems.filter((i) => i.image).slice(0, 3)
  // Order the phones so the first item sits in the middle, like a podium line-up.
  const podium = thumbs.length === 3 ? [thumbs[1], thumbs[0], thumbs[2]] : thumbs

  return (
    <div className="eo-overlay" data-exit-offer onClick={stay}>
      <div className={`eo-banner${second ? ' eo-banner--second' : ''}`} role="dialog" aria-modal="true" aria-labelledby="eo-title" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="eo-close" onClick={stay} aria-label="Close offer"><X size={18} /></button>

        {/* Decorative glow blobs and floating sparkles */}
        <span className="eo-blob eo-blob--a" aria-hidden="true" />
        <span className="eo-blob eo-blob--b" aria-hidden="true" />
        <span className="eo-sparks" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => <i key={i} />)}
        </span>

        <div className="eo-main">
          {/* Left: message */}
          <div className="eo-copy">
            <span className="eo-pill"><HeroIcon size={18} /> {second ? 'Your cart is saved' : 'Exclusive Checkout Offer'}</span>
            <h2 id="eo-title">
              {second ? (
                <><span>Still thinking</span><em>it over?</em></>
              ) : (
                <><span>Wait! Your order</span><em>is almost done</em></>
              )}
            </h2>
            <p className="eo-sub">
              {second
                ? 'Your cart is saved and ready. Here’s why shoppers order today.'
                : coupon
                  ? 'Here’s an extra discount to finish checking out — smart, safe and quick!'
                  : 'Your cart is saved — finish your order in one tap before these prices change.'}
            </p>
            <ul className="eo-features">
              {PERKS.slice(0, 3).map(({ icon: Icon, title, text }) => (
                <li key={title}>
                  <Icon size={22} />
                  <span><strong>{title}</strong>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Middle: cart items on a podium */}
          <div className="eo-stage" aria-hidden="true">
            <span className="eo-arc" />
            <span className="eo-rays" />
            <div className={`eo-phones eo-phones--${podium.length || 0}`}>
              {podium.length > 0
                ? podium.map((it) => <PodiumPhone key={it.productId} image={it.image!} />)
                : <span className="eo-phone eo-phone--empty"><Gift size={48} /></span>}
            </div>
            <span className="eo-podium" />
            <span className="eo-seal">
              <BadgeCheck size={22} />
              {cartItems.length > 0 ? <>{cartItems.length} in<br />your cart</> : <>Ready to<br />ship</>}
            </span>
          </div>

          {/* Right: offer + action */}
          <div className="eo-offer">
            <div className="eo-offer-card">
              <h3>{coupon ? 'Save more on this order' : saving ? 'You’re already saving' : unlock ? 'Unlock a bigger discount' : 'Complete your order'}</h3>
              <div className="eo-sticker">
                {coupon ? (
                  <>
                    <small>Extra</small>
                    <strong>{formatINR(Number(coupon.discount_amount))} <b>OFF</b></strong>
                    <code>Code: {coupon.code}</code>
                  </>
                ) : saving ? (
                  <>
                    <small>Up to</small>
                    <strong>{saving.percent_off}% <b>OFF</b></strong>
                    <code>on {saving.name}</code>
                  </>
                ) : unlock ? (
                  <>
                    <small>Add {formatINR(Number(unlock.amount_needed))} more for</small>
                    <strong>
                      {unlock.discount_type === 'percentage' ? `${Number(unlock.discount_value)}%` : formatINR(Number(unlock.discount_value))} <b>OFF</b>
                    </strong>
                    <code>Code: {unlock.code}</code>
                  </>
                ) : (
                  <>
                    <small>Cart total</small>
                    <strong>{formatINR(subtotal)}</strong>
                    <code>Free delivery · 7-day returns</code>
                  </>
                )}
              </div>
            </div>

            {coupon ? (
              <button type="button" className="eo-primary" onClick={applyCoupon} disabled={applying} autoFocus>
                {applying ? <><Loader2 size={18} className="eo-spin" /> Applying…</> : <><Tag size={18} /> Apply &amp; complete order <ChevronRight size={18} /></>}
              </button>
            ) : (
              <button type="button" className="eo-primary" onClick={stay} autoFocus>
                <ShoppingCart size={18} /> {second ? 'Yes, place my order' : 'Complete my order'} <ChevronRight size={18} />
              </button>
            )}
            {canLeave ? (
              <button type="button" className="eo-secondary" onClick={leave}>No thanks, leave checkout</button>
            ) : (
              <button type="button" className="eo-secondary" onClick={stay}>Maybe later</button>
            )}
            {applyError && <p className="eo-error" role="alert">{applyError}</p>}
          </div>
        </div>

        {deals.length > 0 && (
          <div className="eo-deals">
            <h3><Sparkles size={15} /> {second ? 'Biggest discounts right now' : 'Deals you might like'}</h3>
            <div className="eo-deal-row">
              {deals.map((d) => (
                <button key={d.variant_id} type="button" className="eo-deal" onClick={() => openDeal(d.product_id, d.variant_id)}>
                  <span className="eo-deal-img">
                    {d.image ? <img src={d.image} alt="" loading="lazy" /> : <span aria-hidden="true">📦</span>}
                  </span>
                  <span className="eo-deal-info">
                    <span className="eo-deal-name">{d.name}</span>
                    <span className="eo-deal-price">
                      <strong>{formatINR(Number(d.discount_price))}</strong>
                      <s>{formatINR(Number(d.price))}</s>
                    </span>
                  </span>
                  <span className="eo-deal-badge">-{d.percent_off}%</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
