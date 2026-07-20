import { motion } from 'framer-motion'
import { FiEdit2, FiTrash2, FiStar, FiClock, FiCpu, FiImage } from 'react-icons/fi'
import StatusBadge, { TagBadge } from './StatusBadge'
import type { Product } from '../../data/productData'

interface ProductCardProps {
  product: Product
  index: number
  onEdit?: (p: Product) => void
  onDelete?: (p: Product) => void
}

export default function ProductCard({ product: p, index, onEdit, onDelete }: ProductCardProps) {
  const totalStock = p.variants.reduce((s, v) => s + (v.stock || 0), 0)
  const prices = p.variants.map((v) => v.discountPrice || v.price).filter(Boolean)
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0
  const maxOriginal = Math.max(...p.variants.map((v) => v.price || 0))
  const thumb = p.images?.[0] || p.variants[0]?.images?.[0] || ''
  const isLowStock = p.variants.some((v) => v.lowStockAlert && v.stock <= v.lowStockAlert)
  const firstVar = p.variants[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}
      className="relative rounded-xl bg-bg-card border border-border/50 p-5 overflow-hidden group cursor-pointer hover:border-primary/20 hover:shadow-[0_0_30px_rgba(139,92,246,0.08)] transition-all duration-300"
    >
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br from-primary/8 to-blue-500/8 blur-2xl group-hover:scale-150 transition-transform duration-700" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-16 h-16 rounded-xl bg-[#0F172A] flex items-center justify-center text-3xl shadow-sm flex-shrink-0 border border-border overflow-hidden relative">
            <FiImage size={20} className="text-text-muted" />
            {thumb ? (
              <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
            ) : null}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <p className="text-sm font-bold text-text-primary truncate">{p.name}</p>
            </div>
            <p className="text-xs text-text-muted">{p.brand} • {p.category}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <StatusBadge status={p.status} />
              <span className="flex items-center gap-0.5 text-xs text-warning font-semibold">
                <FiStar size={11} className="fill-warning" />{p.rating}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-1">
            {p.trending && <TagBadge label="Trending" color="trending" />}
            {p.newArrival && <TagBadge label="New" color="new" />}
            {p.bestSelling && <TagBadge label="Best Seller" color="bestseller" />}
            {p.featured && <TagBadge label="Featured" color="featured" />}
          </div>
        </div>

        {firstVar && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {firstVar.ram && <span className="text-[10px] font-semibold text-text-secondary bg-primary/10 rounded-lg px-2 py-1">{firstVar.ram}</span>}
            {firstVar.storage && <span className="text-[10px] font-semibold text-text-secondary bg-primary/10 rounded-lg px-2 py-1">{firstVar.storage}</span>}
            {firstVar.processor && <span className="text-[10px] font-semibold text-text-secondary bg-primary/10 rounded-lg px-2 py-1 flex items-center gap-1"><FiCpu size={10} />{firstVar.processor}</span>}
            {firstVar.battery ? <span className="text-[10px] font-semibold text-text-secondary bg-primary/10 rounded-lg px-2 py-1">{firstVar.battery}mAh</span> : null}
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-xl bg-[#0F172A]/80 border border-border/50 p-2.5 text-center">
            <p className="text-[10px] text-text-muted font-medium">Variants</p>
            <p className="text-sm font-bold text-text-primary">{p.variants.length}</p>
          </div>
          <div className={`rounded-xl border border-border/50 p-2.5 text-center ${
            totalStock === 0 ? 'bg-rose-950/30' : isLowStock ? 'bg-amber-950/30' : 'bg-emerald-950/30'
          }`}>
            <p className="text-[10px] text-text-muted font-medium">Stock</p>
            <p className={`text-sm font-bold ${totalStock === 0 ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-emerald-400'}`}>
              {totalStock}
            </p>
          </div>
          <div className="rounded-xl bg-[#0F172A]/80 border border-border/50 p-2.5 text-center">
            <p className="text-[10px] text-text-muted font-medium">Price</p>
            <p className="text-sm font-bold text-text-primary">{minPrice > 0 ? `₹${minPrice.toLocaleString('en-IN')}` : '—'}</p>
          </div>
        </div>

        {maxOriginal > minPrice && (
          <div className="flex items-center gap-2 mb-3 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-900/30">
            <span className="text-[10px] font-semibold text-emerald-400">{minPrice > 0 ? Math.round((1 - minPrice / maxOriginal) * 100) : 0}% OFF</span>
            {maxOriginal > 0 && <span className="text-[10px] text-text-muted line-through">₹{maxOriginal.toLocaleString('en-IN')}</span>}
            <span className="flex items-center gap-0.5 text-[10px] text-text-muted ml-auto">
              <FiClock size={10} /> {p.sold} sold
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 pt-3 border-t border-border/50">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => onEdit?.(p)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 hover:shadow-[0_0_12px_rgba(139,92,246,0.2)] transition-all cursor-pointer"
          ><FiEdit2 size={13} /> Edit</motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => onDelete?.(p)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-500/10 text-rose-400 text-xs font-semibold hover:bg-rose-500/20 hover:shadow-[0_0_12px_rgba(239,68,68,0.2)] transition-all cursor-pointer"
          ><FiTrash2 size={13} /> Delete</motion.button>
        </div>
      </div>
    </motion.div>
  )
}
