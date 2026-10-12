import { useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import type { CartItem } from '../../services/cartService'
import { TAX_RATE } from '../mobile/cartLogic'
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
export default function OrderSummary({ items, coupon, loading, children }: {
  items: CartItem[]
  coupon: CheckoutCoupon | null
  loading?: boolean
  children?: ReactNode
}) {
  const [expanded, setExpanded] = useState(false)
  const t = computeTotals(items, coupon?.discount || 0)
  const shown = expanded ? items : items.slice(0, VISIBLE_ITEMS)
  const hidden = items.length - VISIBLE_ITEMS

  return (
    <div className="cx-card cx-summary osum-card">
      <div className="osum-head">
        <h2>Order summary</h2>
        {!loading && <span>{t.quantity} item{t.quantity !== 1 ? 's' : ''}</span>}
      </div>

      {loading ? (
        <div className="osum-skel"><span /><span /><span /></div>
      ) : items.length > 0 && (
        <>
          <ul className="osum-items">
            {shown.map((i) => {
              const spec = [i.color, i.storage].filter(isRealSpec).join(' · ')
              return (
                <li key={i.cartItemId ?? `${i.productId}-${i.variantId}`}>
                  <span className="osum-img">
                    <img src={resolveImage(i.image)} alt="" onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG }} />
                  </span>
                  <span className="osum-info">
                    <span className="osum-name">{i.name}</span>
                    <span className="osum-meta">Qty {i.quantity}{spec && ` · ${spec}`}</span>
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
        <div><dt>Subtotal</dt><dd>{formatINR(t.subtotal)}</dd></div>
        <div><dt>Delivery</dt><dd className={t.shipping === 0 ? 'is-free' : ''}>{t.shipping === 0 ? 'Free' : formatINR(t.shipping)}</dd></div>
        <div><dt>GST ({Math.round(TAX_RATE * 100)}%)</dt><dd>{formatINR(t.tax)}</dd></div>
        {t.discount > 0 && <div className="is-save"><dt>Coupon ({coupon?.code})</dt><dd>−{formatINR(t.discount)}</dd></div>}
      </dl>
      <div className="cx-total">
        <span>Total amount</span>
        <strong>{formatINR(t.total)}</strong>
      </div>

      {children}
    </div>
  )
}
