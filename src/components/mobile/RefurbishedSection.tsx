import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import ProductCard from './ProductCard'
import { C } from './theme'

export default function RefurbishedSection({ products, loading = false }: { products: any[]; loading?: boolean }) {
  if (!loading && !products.length) return null
  const items = products.slice(0, 8)

  return (
    <section className="mt-7">
      <div className="flex items-center justify-between px-3.5 mb-3">
        <h2 className={C.sectionTitle}>Refurbished</h2>
        <Link to="/collection/all" className={C.viewAll}>
          View All <ChevronRight size={14} />
        </Link>
      </div>
      {loading && !items.length ? (
        <div className="grid grid-cols-3 gap-2.5 px-3.5 pb-1 sm:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-square rounded-xl bg-[#dfe6cf] animate-pulse" />
              <div className="px-0.5 pt-1.5 space-y-1.5">
                <div className="h-2.5 w-3/4 bg-[#f7f6f2] rounded animate-pulse" />
                <div className="h-2.5 w-1/2 bg-[#f7f6f2] rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 px-3.5 pb-1 sm:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  )
}
