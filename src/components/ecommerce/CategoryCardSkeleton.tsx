import { memo } from 'react'

interface CategoryCardSkeletonProps {
  index?: number
}

function CategoryCardSkeleton({ index = 0 }: CategoryCardSkeletonProps) {
  return (
    <div
      className="flex-shrink-0 w-[200px] h-[230px] p-7 rounded-2xl flex flex-col items-center justify-center gap-4"
      style={{
        background: 'linear-gradient(145deg, #ffffff, #f5f5f5)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
        animationDelay: `${index * 80}ms`,
      }}
    >
      <div className="w-20 h-20 rounded-2xl bg-gray-200 animate-pulse" />
      <div className="text-center flex flex-col gap-2">
        <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mx-auto" />
        <div className="h-3 w-16 bg-gray-100 rounded animate-pulse mx-auto" />
      </div>
    </div>
  )
}

export default memo(CategoryCardSkeleton)