import PageLoading from '../ui/PageLoading'
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
        <PageLoading label="Loading refurbished products…" className="py-10" />
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
