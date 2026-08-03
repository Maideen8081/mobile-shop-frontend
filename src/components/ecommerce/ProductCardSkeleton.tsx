import { memo } from 'react'

interface ProductCardSkeletonProps {
  index?: number
}

function ProductCardSkeleton({ index = 0 }: ProductCardSkeletonProps) {
  return (
    <div
      className="glass-card p-4 rounded-[1.75rem] flex flex-col gap-3"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="bg-gray-200 rounded-2xl h-[270px] animate-pulse" />
      <div className="px-1 pb-1 flex flex-col gap-2">
        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse" />
        <div className="h-3 w-1/2 bg-gray-100 rounded animate-pulse" />
        <div className="flex items-center justify-between mt-1">
          <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-16 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}

export default memo(ProductCardSkeleton)