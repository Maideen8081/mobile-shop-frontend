import ProductCardSkeleton from './ProductCardSkeleton'
import CategoryCardSkeleton from './CategoryCardSkeleton'

interface SectionLoaderProps {
  type?: 'products' | 'categories'
  count?: number
}

export default function SectionLoader({ type = 'products', count = 8 }: SectionLoaderProps) {
  if (type === 'categories') {
    return (
      <div className="flex gap-5 overflow-x-auto scroll-smooth pb-4 snap-x snap-mandatory scrollbar-hide">
        {Array.from({ length: count }).map((_, i) => (
          <CategoryCardSkeleton key={i} index={i} />
        ))}
      </div>
    )
  }

  const cols = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  return (
    <div className={`grid ${cols} gap-5`}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} index={i} />
      ))}
    </div>
  )
}