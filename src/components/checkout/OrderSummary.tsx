import { useState, type ReactNode } from 'react'
import { gstLabel } from '../../utils/checkout'
import { ChevronDown, ShoppingBag } from 'lucide-react'
import type { CartItem } from '../../services/cartService'
import { computeTotals, formatINR, type CheckoutCoupon } from '../../utils/checkout'
import './OrderSummary.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
const FALLBACK_IMG = 'https://picsum.photos/seed/product/300/300'
const VISIBLE_ITEMS = 3

function resolveImage(raw?: string): string {
  if (!raw) return FALLBACK_IMG
  if (raw.startsWith('http') || raw.startsWith('data:')) return raw
  return `${API_BASE_URL.replace(/\/+$/, '')}/${raw.replace(/^\/+/, '')}`
}

const isRealSpec = (v?: string) => Boolean(v && v.trim() && v.trim().toUpperCase() !== 'N/A')

/** Order summary card shared by the address and payment steps. */
export default function OrderSummary({ items, coupon, children }: {
  items: CartItem[]
  coupon: CheckoutCoupon | null
  children?: ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const t = computeTotals(items, coupon?.discount || 0)
  const shown = expanded ? items : items.slice(0, VISIBLE_ITEMS)
  const hidden = items.length - VISIBLE_ITEMS

  // Show the pre-discount price as the subtotal, and product savings + coupon as one discount line.
  const mrpTotal = items.reduce((s, i) => s + Math.max(i.mrp || 0, i.price) * i.quantity, 0)
  const discount = mrpTotal - t.subtotal + t.discount
  const itemLabel = `${t.quantity} Item${t.quantity !== 1 ? 's' : ''}`

  return (
    <div className="cx-card cx-summary osum-card">
      <div className="osum-head">
        <ShoppingBag size={30} strokeWidth={1.75} />
        <h2>Order Summary</h2>
        <span>{itemLabel}</span>
      </div>

      <div className="osum-body">
        {items.length > 0 && (
          <>
            <ul className="osum-items">
              {shown.map((i) => {
                const meta = [i.color, i.storage].filter(isRealSpec)
                return (
                  <li key={i.cartItemId ?? `${i.productId}-${i.variantId}`}>
                    <span className="osum-img">
                      <img src={resolveImage(i.image)} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG }} />
                    </span>
                    <span className="osum-info">
                      <span className="osum-name">{i.name}</span>
                      <span className="osum-meta">
                        {[...meta, `Qty: ${i.quantity}`].map((m, n) => (
                          <span key={m}>{n > 0 && <i aria-hidden="true">•</i>}{m}</span>
                        ))}
                      </span>
                    </span>
                    <span className="osum-price">{formatINR(i.price * i.quantity)}</span>
                  </li>
                )
              })}
            </ul>
            {hidden > 0 && (
              <button className="osum-toggle" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded}>
                {expanded ? 'Show less' : `Show ${hidden} more`}
                <ChevronDown size={15} className={expanded ? 'is-open' : ''} />
              </button>
            )}
          </>
        )}

        <dl>
          <div><dt>Subtotal ({itemLabel})</dt><dd>{formatINR(mrpTotal)}</dd></div>
          {discount > 0 && (
            <div className="is-save">
              <dt>Discount{coupon?.code && t.discount > 0 ? ` (${coupon.code})` : ''}</dt>
              <dd>– {formatINR(discount)}</dd>
            </div>
          )}
          <div><dt>Delivery</dt><dd className={t.shipping === 0 ? 'is-free' : ''}>{t.shipping === 0 ? 'Free' : formatINR(t.shipping)}</dd></div>
          <div><dt>{gstLabel()}</dt><dd>{formatINR(t.tax)}</dd></div>
        </dl>

        <div className="cx-total osum-total">
          <span>Total Amount</span>
          <strong>{formatINR(t.total)}</strong>
        </div>

        {children}
      </div>
    </div>
  )
}
