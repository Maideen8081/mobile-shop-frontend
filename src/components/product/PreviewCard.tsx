import { motion } from 'framer-motion'
import { FiStar, FiShoppingBag, FiCpu, FiMonitor, FiCamera } from 'react-icons/fi'
import { TagBadge } from './StatusBadge'

interface PreviewCardProps {
  product: {
    name: string
    originalPrice: number
    discountPrice: number
    thumbnail: string
    category: string
    brand: string
    stock: number
    trending?: boolean
    newArrival?: boolean
    bestSelling?: boolean
    featured?: boolean
    ram?: string
    storage?: string
    battery?: number
    processor?: string
    display?: string
    camera?: string
    color?: string
    images?: string[]
  }
}

export default function PreviewCard({ product }: PreviewCardProps) {
  const discount = product.originalPrice > 0 ? Math.round((1 - product.discountPrice / product.originalPrice) * 100) : 0

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl bg-bg-card border border-border shadow-sm overflow-hidden"
    >
      <div className="bg-primary/10 p-6 flex items-center justify-center min-h-[160px] relative">
        {product.thumbnail && (product.thumbnail.startsWith('data:') || product.thumbnail.startsWith('http') || product.thumbnail.startsWith('blob:')) ? (
          <img src={product.thumbnail} alt="" className="w-full h-full max-h-[120px] object-contain" />
        ) : (
          <motion.span animate={{ y: [0, -6, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="text-6xl"
          >{product.thumbnail || '📱'}</motion.span>
        )}
        {discount > 0 && (
          <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-primary text-white text-[10px] font-bold">
            {discount}% OFF
          </div>
        )}
        {(product.trending || product.newArrival) && (
          <div className="absolute top-3 left-3 flex gap-1">
            {product.newArrival && <TagBadge label="New" color="new" />}
            {product.trending && <TagBadge label="Trending" color="trending" />}
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        <div>
          <p className="text-xs text-text-muted">{product.brand} • {product.category}</p>
          <p className="text-sm font-bold text-text-primary mt-0.5">{product.name || 'Product Name'}</p>
          {product.color && <p className="text-[10px] text-text-muted mt-0.5">{product.color}</p>}
        </div>

        {(product.ram || product.storage || product.battery || product.processor) && (
          <div className="grid grid-cols-2 gap-1.5">
            {product.ram && product.storage && (
              <div className="flex items-center gap-1 text-[10px] text-text-secondary bg-primary/10 rounded-lg px-2.5 py-1.5">
                <FiCpu size={11} className="text-primary flex-shrink-0" />
                <span className="truncate">{product.ram} · {product.storage}</span>
              </div>
            )}
            {product.battery ? (
              <div className="flex items-center gap-1 text-[10px] text-text-secondary bg-primary/10 rounded-lg px-2.5 py-1.5">
                <span className="text-primary flex-shrink-0">🔋</span>
                <span className="truncate">{product.battery}mAh</span>
              </div>
            ) : null}
            {product.processor && (
              <div className="flex items-center gap-1 text-[10px] text-text-secondary bg-primary/10 rounded-lg px-2.5 py-1.5">
                <FiCpu size={11} className="text-primary flex-shrink-0" />
                <span className="truncate">{product.processor}</span>
              </div>
            )}
            {product.display && (
              <div className="flex items-center gap-1 text-[10px] text-text-secondary bg-primary/10 rounded-lg px-2.5 py-1.5">
                <FiMonitor size={11} className="text-primary flex-shrink-0" />
                <span className="truncate">{product.display}</span>
              </div>
            )}
            {product.camera && (
              <div className="flex items-center gap-1 text-[10px] text-text-secondary bg-primary/10 rounded-lg px-2.5 py-1.5">
                <FiCamera size={11} className="text-primary flex-shrink-0" />
                <span className="truncate">{product.camera}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          {(product.discountPrice || 0) > 0 ? (
            <>
              <span className="text-lg font-bold text-text-primary">₹{product.discountPrice.toLocaleString('en-IN')}</span>
              {product.originalPrice > product.discountPrice && (
                <span className="text-sm text-text-muted line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>
              )}
            </>
          ) : product.originalPrice > 0 ? (
            <span className="text-lg font-bold text-text-primary">₹{product.originalPrice.toLocaleString('en-IN')}</span>
          ) : (
            <span className="text-lg font-bold text-text-muted">Set price</span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-text-secondary">
          <span className={`font-semibold ${product.stock === 0 ? 'text-danger' : product.stock <= 5 ? 'text-warning' : 'text-success'}`}>
            {product.stock === 0 ? 'Out of Stock' : `${product.stock} in stock`}
          </span>
          <span className="flex items-center gap-1">
            <FiStar size={11} className="text-warning fill-warning" /> 4.8
          </span>
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          className="w-full py-2.5 rounded-xl bg-primary text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
        ><FiShoppingBag size={14} /> View Product</motion.button>
      </div>
    </motion.div>
  )
}
