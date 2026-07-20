import { useNavigate } from 'react-router-dom'
import { FALLBACK_IMG } from './fallback'
import { getProductImage } from './helpers'

function buildTags(product: any): { label: string; cls: string }[] {
  const tags: { label: string; cls: string }[] = []
  if (product.is_new_arrival || product.isNewArrival)
    tags.push({ label: 'New', cls: 'bg-[#059669] text-white' })
  if (product.is_best_selling || product.isBestSelling)
    tags.push({ label: 'Bestseller', cls: 'bg-[#4F46E5] text-white' })
  if (product.is_featured || product.isFeatured)
    tags.push({ label: 'Featured', cls: 'bg-[#F59E0B] text-white' })
  if (product.is_trending || product.isTrending)
    tags.push({ label: 'Trending', cls: 'bg-[#0EA5E9] text-white' })
  if (product.is_refurbished || product.isRefurbished)
    tags.push({ label: 'Refurbished', cls: 'bg-[#7C3AED] text-white' })
  return tags
}

export default function ProductCard({ product }: { product: any }) {
  const navigate = useNavigate()
  const img = getProductImage(product)
  const tags = buildTags(product)

  return (
    <div
      onClick={() => navigate(`/product/${product.id}`)}
      className="group flex flex-col items-stretch cursor-pointer select-none"
    >
      <div className="relative aspect-square w-full rounded-xl bg-[#F4F6FA] overflow-hidden">
        <img
          src={img || FALLBACK_IMG}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 ease-out group-active:scale-105"
          onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }}
        />

        {tags.length > 0 && (
          <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1 max-w-[85%]">
            {tags.map((t) => (
              <span
                key={t.label}
                className={`text-[8.5px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full leading-none ${t.cls}`}
              >
                {t.label}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="px-0.5 pt-1.5">
        {product.brand && (
          <span className="block text-[9px] font-semibold uppercase tracking-wider text-[#6366F1] truncate mb-0.5">
            {product.brand}
          </span>
        )}
        <h3 className="text-[11.5px] font-medium text-[#1E293B] leading-snug line-clamp-2 group-active:text-[#4F46E5] transition-colors">
          {product.name}
        </h3>
      </div>
    </div>
  )
}
