import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import ProductCard from './ProductCard'
import { C } from './theme'

export function ProductSection({ title, viewAllTo, products }: { title: string; viewAllTo: string; products: any[] }) {
  if (!products.length) return null
  return (
    <section className="mt-7">
      <div className="flex items-center justify-between px-3.5 mb-3">
        <h2 className={C.sectionTitle}>{title}</h2>
        <Link to={viewAllTo} className={C.viewAll}>
          View All <ChevronRight size={14} />
        </Link>
      </div>
      <div className="grid grid-cols-3 gap-2.5 px-3.5 pb-1 sm:grid-cols-4">
        {products.slice(0, 8).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}

export function ProductSectionSkeleton() {
  return (
    <section className="mt-7">
      <div className="px-3.5 mb-3">
        <div className="h-4 w-32 bg-[#E2E8F0] rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-2 gap-3 px-3.5 pb-1 min-[600px]:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="aspect-square rounded-xl bg-[#F1F5F9] animate-pulse" />
              <div className="px-0.5 pt-1.5 space-y-1.5">
                <div className="h-2.5 w-3/4 bg-[#E2E8F0] rounded animate-pulse" />
                <div className="h-2.5 w-1/2 bg-[#E2E8F0] rounded animate-pulse" />
              </div>
            </div>
          ))}
      </div>
    </section>
  )
}
