import { motion } from 'framer-motion'
import { FiEdit2, FiTrash2, FiImage } from 'react-icons/fi'
import StatusBadge, { TagBadge } from './StatusBadge'
import type { Product } from '../../data/productData'

interface ProductTableProps {
  data: Product[]
  onEdit?: (p: Product) => void
  onDelete?: (p: Product) => void
}

export default function ProductTable({ data, onEdit, onDelete }: ProductTableProps) {
  if (data.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-xl bg-white border border-border shadow-sm">
      <table className="w-full min-w-[1000px]">
        <thead>
          <tr className="border-b border-border bg-gray-50/80">
            {['S.No', 'Product', 'Category', 'Variants', 'Stock', 'Price', 'Status', 'Actions'].map((h) => (
              <th key={h} className="text-left text-[11px] font-bold text-text-muted uppercase tracking-wider px-5 py-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((p, i) => {
            const totalStock = p.variants.reduce((s, v) => s + (v.stock || 0), 0)
            const prices = p.variants.map((v) => v.discountPrice || v.price).filter(Boolean)
            const minPrice = prices.length > 0 ? Math.min(...prices) : 0
            const maxOriginal = Math.max(...p.variants.map((v) => v.price || 0))
            const thumb = p.images?.[0] || p.variants[0]?.images?.[0] || '📱'
            const isLowStock = p.variants.some((v) => v.lowStockAlert && v.stock <= v.lowStockAlert)

            return (
              <motion.tr key={p.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: i * 0.04 }}
                className="border-b border-border hover:bg-gray-50/70 transition-colors"
              >
                <td className="px-5 py-4 text-sm text-text-muted font-medium">{String(i + 1).padStart(2, '0')}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl shadow-sm border border-border overflow-hidden relative">
                      <FiImage size={16} className="text-text-muted" />
                      {thumb.startsWith('http') || thumb.startsWith('data:') || thumb.startsWith('blob:') ? (
                        <img src={thumb} alt="" className="absolute inset-0 w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : null}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-text-primary truncate max-w-[180px]">{p.name}</p>
                        {p.trending && <TagBadge label="Trending" color="trending" />}
                        {p.newArrival && <TagBadge label="New" color="new" />}
                        {p.bestSelling && <TagBadge label="Best Seller" color="bestseller" />}
                        {p.featured && <TagBadge label="Featured" color="featured" />}
                      </div>
                      <p className="text-[10px] text-text-muted">{p.brand} • {p.model}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-text-secondary">{p.category}</td>
                <td className="px-5 py-4 text-sm font-semibold text-text-primary">{p.variants.length}</td>
                <td className="px-5 py-4">
                  <span className={`text-sm font-bold ${totalStock === 0 ? 'text-danger' : isLowStock ? 'text-warning' : 'text-text-primary'}`}>
                    {totalStock}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div>
                    <p className="text-sm font-bold text-text-primary">{minPrice > 0 ? `₹${minPrice.toLocaleString('en-IN')}` : '—'}</p>
                    {maxOriginal > minPrice && (
                      <p className="text-[10px] text-text-muted line-through">₹{maxOriginal.toLocaleString('en-IN')}</p>
                    )}
                  </div>
                </td>
                <td className="px-5 py-4"><StatusBadge status={p.status} /></td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onEdit?.(p)}
                      className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 hover:shadow-[0_0_12px_rgba(139,92,246,0.3)] transition-all cursor-pointer"
                      title="Edit" aria-label="Edit"
                    ><FiEdit2 size={14} /></motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onDelete?.(p)}
                      className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center hover:bg-rose-500/20 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)] transition-all cursor-pointer"
                      title="Delete" aria-label="Delete"
                    ><FiTrash2 size={14} /></motion.button>
                  </div>
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
