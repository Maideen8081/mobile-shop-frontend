import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Heart, ShoppingBag, Eye, Star, Tag } from 'lucide-react'
import { FALLBACK_IMG } from '../../components/mobile/fallback'
import { getProductImage, getProductPrice } from '../../components/mobile/helpers'

interface PremiumProductCardProps {
  product: any
  index?: number
  wishlist?: Set<number>
  onWishlistToggle?: (id: number, e: React.MouseEvent) => void
  onAddToCart?: (product: any, e: React.MouseEvent) => void
  variant?: 'grid' | 'list' | 'featured'
}

export default function PremiumProductCard({
  product,
  index = 0,
  wishlist = new Set(),
  onWishlistToggle,
  onAddToCart,
  variant = 'grid',
}: PremiumProductCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const img = getProductImage(product)
  const { price, discount, discountPct } = getProductPrice(product)
  const isInWishlist = wishlist.has(product.id)

  const tags = []
  if (product.is_new_arrival || product.isNewArrival) tags.push({ label: 'New', color: 'from-emerald-500 to-emerald-600' })
  if (product.is_best_selling || product.isBestSelling) tags.push({ label: 'Bestseller', color: 'from-indigo-500 to-indigo-600' })
  if (product.is_featured || product.isFeatured) tags.push({ label: 'Featured', color: 'from-amber-500 to-amber-600' })
  if (product.is_trending || product.isTrending) tags.push({ label: 'Trending', color: 'from-sky-500 to-sky-600' })
  if (product.is_refurbished || product.isRefurbished) tags.push({ label: 'Refurbished', color: 'from-violet-500 to-violet-600' })
  if (discountPct > 0) tags.push({ label: `${discountPct}% OFF`, color: 'from-rose-500 to-rose-600' })

  const handleClick = (e: React.MouseEvent) => {
    if (!e.target.closest('button') && !e.target.closest('a')) {
      window.location.href = `/product/${product.id}`
    }
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
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ x: 8, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
        className="group flex gap-6 p-5 bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-100 hover:border-indigo-200 hover:shadow-xl transition-all duration-500"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative w-36 h-36 flex-shrink-0 rounded-xl bg-slate-50 overflow-hidden">
          <img
            src={imageError ? FALLBACK_IMG : img}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            onError={() => setImageError(true)}
          />
          {tags.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {tags.slice(0, 2).map((tag, idx) => (
                <span key={idx} className={`bg-gradient-to-r ${tag.color} text-white text-[9px] font-bold px-2 py-1 rounded-full shadow-sm`}>
                  {tag.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {product.brand && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-1 block truncate">
                {product.brand}
              </span>
            )}
            <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors text-base">
              {product.name}
            </h3>
          </div>

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <span className="text-xl font-extrabold text-slate-900">₹{price.toLocaleString('en-IN')}</span>
              {discount > price && (
                <span className="text-sm text-slate-400 line-through">₹{discount.toLocaleString('en-IN')}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleWishlist}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  isInWishlist
                    ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-[0_4px_12px_rgba(239,68,68,0.3)]'
                    : 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-500'
                }`}
                aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart size={18} className={isInWishlist ? 'fill-current' : ''} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAddToCart}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_16px_rgba(79,70,229,0.4)] transition-all"
                aria-label="Add to cart"
              >
                <ShoppingBag size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => window.location.href = `/product/${product.id}`}
                className="w-10 h-10 rounded-xl bg-white/90 text-slate-600 backdrop-blur-sm flex items-center justify-center shadow-lg border border-slate-200"
                aria-label="View product"
              >
                <Eye size={18} />
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  if (variant === 'featured') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ y: -12, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
        className="group relative bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all duration-700"
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <img
            src={imageError ? FALLBACK_IMG : img}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            onError={() => setImageError(true)}
          />

          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {tags.map((tag, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={`bg-gradient-to-r ${tag.color} text-white text-[11px] font-bold px-3 py-1.5 rounded-full shadow-lg`}
              >
                {tag.label}
              </motion.span>
            ))}
          </div>

          <div className="absolute bottom-4 right-4 flex flex-col gap-2">
            <AnimatePresence>
              {isHovered && (
                <motion.button
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: 0.05, type: 'spring', stiffness: 400, damping: 25 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleWishlist}
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-xl ${
                    isInWishlist
                      ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white'
                      : 'bg-white/95 text-slate-600 backdrop-blur-sm'
                  }`}
                  aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <Heart size={20} className={isInWishlist ? 'fill-current' : ''} />
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isHovered && (
                <motion.button
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAddToCart}
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-xl"
                  aria-label="Add to cart"
                >
                  <ShoppingBag size={20} />
                </motion.button>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {isHovered && (
                <motion.button
                  initial={{ opacity: 0, y: 20, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.8 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 25 }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => window.location.href = `/product/${product.id}`}
                  className="w-12 h-12 rounded-full bg-white/95 text-slate-600 backdrop-blur-sm flex items-center justify-center shadow-xl border border-slate-200"
                  aria-label="Quick view"
                >
                  <Eye size={20} />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="p-5">
          {product.brand && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2 block">
              {product.brand}
            </span>
          )}
          <h3 className="font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors text-lg mb-3">
            {product.name}
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-extrabold text-slate-900">₹{price.toLocaleString('en-IN')}</span>
            {discount > price && (
              <span className="text-base text-slate-400 line-through">₹{discount.toLocaleString('en-IN')}</span>
            )}
            {discountPct > 0 && (
              <span className="ml-auto text-sm font-bold px-3 py-1 bg-rose-500/10 text-rose-600 rounded-full">
                {discountPct}% OFF
              </span>
            )}
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -12, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
      className="group relative bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-2xl hover:border-indigo-200 transition-all duration-700"
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100">
        <img
          src={imageError ? FALLBACK_IMG : img}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
          onError={() => setImageError(true)}
        />

        {tags.length > 0 && (
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {tags.map((tag, idx) => (
              <motion.span
                key={idx}
                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={`bg-gradient-to-r ${tag.color} text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg`}
              >
                {tag.label}
              </motion.span>
            ))}
          </div>
        )}

        <div className="absolute bottom-3 right-3 flex flex-col gap-2">
          <AnimatePresence>
            {isHovered && (
              <motion.button
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: 0.05, type: 'spring', stiffness: 400, damping: 25 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleWishlist}
                className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xl ${
                  isInWishlist
                    ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white'
                    : 'bg-white/95 text-slate-600 backdrop-blur-sm'
                }`}
                aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart size={18} className={isInWishlist ? 'fill-current' : ''} />
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isHovered && (
              <motion.button
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleAddToCart}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 text-white flex items-center justify-center shadow-xl"
                aria-label="Add to cart"
              >
                <ShoppingBag size={18} />
              </motion.button>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isHovered && (
              <motion.button
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 400, damping: 25 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => window.location.href = `/product/${product.id}`}
                className="w-10 h-10 rounded-full bg-white/95 text-slate-600 backdrop-blur-sm flex items-center justify-center shadow-xl border border-slate-200"
                aria-label="Quick view"
              >
                <Eye size={18} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="p-4">
        {product.brand && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-1.5 block truncate">
            {product.brand}
          </span>
        )}
        <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors text-base mb-2">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold text-slate-900">₹{price.toLocaleString('en-IN')}</span>
          {discount > price && (
            <span className="text-sm text-slate-400 line-through">₹{discount.toLocaleString('en-IN')}</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}