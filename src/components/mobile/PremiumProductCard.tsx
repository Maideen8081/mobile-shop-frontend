import { useNavigate } from 'react-router-dom'
import { Heart, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { FALLBACK_IMG } from './fallback'
import { getProductImage, getProductPrice } from './helpers'

interface PremiumProductCardProps {
  product: any
  onWishlistToggle?: (id: number, e: React.MouseEvent) => void
  onAddToCart?: (product: any, e: React.MouseEvent) => void
  wishlist?: Set<number>
  variant?: 'grid' | 'list' | 'featured'
}

export default function PremiumProductCard({
  product,
  onWishlistToggle,
  onAddToCart,
  wishlist = new Set(),
  variant = 'grid',
}: PremiumProductCardProps) {
  const navigate = useNavigate()
  const [imageError, setImageError] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const img = getProductImage(product)
  const { discountPct } = getProductPrice(product)
  const isInWishlist = wishlist.has(product.id)

  const tags = []
  if (product.is_new_arrival || product.isNewArrival) tags.push({ label: 'New', color: 'bg-emerald-500' })
  if (product.is_best_selling || product.isBestSelling) tags.push({ label: 'Bestseller', color: 'bg-indigo-500' })
  if (product.is_featured || product.isFeatured) tags.push({ label: 'Featured', color: 'bg-amber-500' })
  if (product.is_trending || product.isTrending) tags.push({ label: 'Trending', color: 'bg-sky-500' })
  if (product.is_refurbished || product.isRefurbished) tags.push({ label: 'Refurbished', color: 'bg-violet-500' })
  if (discountPct > 0) tags.push({ label: `${discountPct}% OFF`, color: 'bg-rose-500' })

  const handleClick = () => {
    navigate(`/product/${product.id}`)
  }

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onWishlistToggle?.(product.id, e)
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onAddToCart?.(product, e)
  }

  if (variant === 'list') {
    return (
      <div
        onClick={handleClick}
        className="group flex gap-4 p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-300 active:scale-[0.99] animate-fade-in-up"
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
      >
        <div className="relative w-24 h-24 flex-shrink-0 rounded-xl bg-slate-50 overflow-hidden animate-scale-in">
          <img
            src={imageError ? FALLBACK_IMG : img}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={() => setImageError(true)}
          />
          {tags.length > 0 && (
            <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
              {tags.slice(0, 2).map((tag, idx) => (
                <span key={idx} className={`animate-tag-pop ${tag.color} text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full`}>
                  {tag.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {product.brand && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1 block truncate">
                {product.brand}
              </span>
            )}
            <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors text-sm">
              {product.name}
            </h3>
          </div>

          <div className="flex items-center justify-end mt-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                onClick={handleWishlist}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                  isInWishlist
                    ? 'bg-rose-500 text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)]'
                    : 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500'
                }`}
                aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart size={16} className={isInWishlist ? 'fill-current' : ''} />
              </button>
              <button
                onClick={handleAddToCart}
                className="w-9 h-9 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_16px_rgba(79,70,229,0.4)] transition-all active:scale-95"
                aria-label="Add to cart"
              >
                <ShoppingBag size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'featured') {
    return (
      <div
        onClick={handleClick}
        className="group relative bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all duration-500 active:scale-[0.99] animate-fade-in-up"
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={imageError ? FALLBACK_IMG : img}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={() => setImageError(true)}
          />

          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {tags.map((tag, idx) => (
              <span key={idx} className={`animate-tag-pop ${tag.color} text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm`}>
                {tag.label}
              </span>
            ))}
          </div>

          <div className="absolute bottom-3 right-3 flex flex-col gap-2">
            <button
              onClick={handleWishlist}
              className={`animate-slide-up ${isInWishlist ? 'bg-rose-500 text-white' : 'bg-white/90 text-slate-600 backdrop-blur-sm'} w-10 h-10 rounded-full flex items-center justify-center shadow-lg`}
              aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart size={18} className={isInWishlist ? 'fill-current' : ''} />
            </button>
            <button
              onClick={handleAddToCart}
              className="animate-slide-up w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-lg"
              aria-label="Add to cart"
            >
              <ShoppingBag size={18} />
            </button>
          </div>
        </div>

        <div className="p-4">
          {product.brand && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1.5 block">
              {product.brand}
            </span>
          )}
          <h3 className="font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors text-base">
            {product.name}
          </h3>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={handleClick}
      className="group relative bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all duration-400 active:scale-[0.98] animate-fade-in-up"
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
        <img
          src={imageError ? FALLBACK_IMG : img}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-600 group-hover:scale-110"
          onError={() => setImageError(true)}
        />

        {tags.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {tags.map((tag, idx) => (
              <span key={idx} className={`animate-tag-pop ${tag.color} text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm`} style={{ animationDelay: `${idx * 100}ms` }}>
                {tag.label}
              </span>
            ))}
          </div>
        )}

        <div className="absolute bottom-2 right-2 flex flex-col gap-1.5">
          <button
            onClick={handleWishlist}
            className={`animate-slide-up ${isInWishlist ? 'bg-rose-500 text-white' : 'bg-white/90 text-slate-600 backdrop-blur-sm'} w-9 h-9 rounded-full flex items-center justify-center shadow-lg`}
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart size={16} className={isInWishlist ? 'fill-current' : ''} />
          </button>
          <button
            onClick={handleAddToCart}
            className="animate-slide-up w-9 h-9 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-lg"
            aria-label="Add to cart"
          >
            <ShoppingBag size={16} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/product/${product.id}`); }}
            className="animate-slide-up w-9 h-9 rounded-full bg-white/90 text-slate-600 backdrop-blur-sm flex items-center justify-center shadow-lg"
            aria-label="Quick view"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
        </div>
      </div>

        <div className="p-3.5">
        {product.brand && (
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 mb-1 block truncate">
            {product.brand}
          </span>
        )}
        <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors text-sm">
          {product.name}
        </h3>
      </div>
    </div>
  )
}