import { memo } from 'react'

interface ProductGridSkeletonProps {
  count?: number
  columns?: number
}

function ProductGridSkeleton({ count = 8, columns = 4 }: ProductGridSkeletonProps) {
  const colClass = columns === 3 ? 'grid-cols-3' : columns === 2 ? 'grid-cols-2' : 'grid-cols-4'
  return (
    <div className={`grid ${colClass} gap-5`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl overflow-hidden border border-gray-100 bg-white"
          style={{ animationDelay: `${i * 60}ms` }}>
          <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-50 animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-3.5 w-3/4 bg-gray-100 rounded-md animate-pulse" />
            <div className="h-3 w-1/2 bg-gray-50 rounded-md animate-pulse" />
            <div className="flex items-center gap-2 mt-2">
              <div className="h-5 w-20 bg-gray-100 rounded-md animate-pulse" />
              <div className="h-4 w-14 bg-gray-50 rounded-md animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default memo(ProductGridSkeleton)
