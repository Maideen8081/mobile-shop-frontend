import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { productService } from '../../services/productService'
import { getProductImage } from '../mobile/helpers'
import { FALLBACK_IMG } from '../mobile/fallback'

/** A short row of real products, for dead ends such as a missing product or a 404. */
export default function ProductSuggestions({ title = 'You might like', excludeId }: { title?: string; excludeId?: number }) {
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    let alive = true
    productService
      .list({ page_size: 8 })
      .then((list) => {
        if (alive) setItems(list.filter((p) => Number(p.id) !== Number(excludeId)).slice(0, 4))
      })
      .catch(() => {})
    return () => { alive = false }
  }, [excludeId])

  if (!items.length) return null

  return (
    <section className="w-full max-w-3xl mx-auto mt-8 text-left" aria-label={title}>
      <h2 className="text-base font-bold text-[#0f3b2c] mb-3">{title}</h2>
      <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((p) => {
          const price = Number(p.minPrice) || 0
          return (
            <li key={p.id}>
              <Link
                to={`/product/${p.id}`}
                className="flex h-full flex-col rounded-[12px] border border-[#ececea] bg-white p-3 transition hover:shadow-[0_10px_24px_rgba(15,59,44,0.1)]"
              >
                <img
                  src={getProductImage(p) || FALLBACK_IMG}
                  alt=""
                  loading="lazy"
                  className="h-28 w-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
                />
                <span className="mt-2 line-clamp-2 text-sm font-semibold text-[#0f3b2c]">{p.name}</span>
                {price > 0 && <span className="mt-auto pt-1 text-sm font-bold text-[#18503c]">₹{price.toLocaleString('en-IN')}</span>}
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/** Shopper-friendly text for a failed product request (never the raw HTTP error). */
export function productErrorMessage(err: any): string {
  const status = err?.response?.status
  if (status === 404) return 'This product is no longer available.'
  if (!err?.response) return 'We couldn’t reach the store. Check your connection and try again.'
  return 'We couldn’t load this product right now. Please try again in a moment.'
}
