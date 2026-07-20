import { motion } from 'framer-motion'
import { FiEdit2, FiTrash2 } from 'react-icons/fi'
import StatusBadge from './StatusBadge'

interface SubCategory { id: number; name: string; products: number }
interface Category { id: number; name: string; image: string | null; products: number; sub_category_count: number; status: 'active' | 'inactive'; created: string; subcategories: SubCategory[] }

interface CategoryCardProps {
  cat: Category
  index: number
  onEdit?: (cat: Category) => void
  onDelete?: (cat: Category) => void
}

export default function CategoryCard({ cat, index, onEdit, onDelete }: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
      className="bg-bg-card rounded-xl border border-white/5 shadow-card p-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-xl bg-surface-lighter border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
          {cat.image ? (
            <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <span className="text-xl font-bold text-text-muted">{cat.name.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-text-primary truncate">{cat.name}</p>
            <StatusBadge status={cat.status} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-text-muted mb-2">
        <span><strong className="text-text-secondary">{cat.sub_category_count}</strong> Sub Categories</span>
        <span><strong className="text-text-secondary">{cat.products}</strong> Products</span>
        <span>{cat.created}</span>
      </div>

      {cat.subcategories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {cat.subcategories.map((sub) => (
            <span
              key={sub.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{
                backgroundColor: 'rgba(139,92,246,0.16)',
                color: '#c4b5fd',
              }}
            >
              {sub.name}
              <span className="text-[10px] opacity-60">({sub.products})</span>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-3 border-t border-white/5">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onEdit?.(cat)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-all cursor-pointer"
        >
          <FiEdit2 size={12} />
          Edit
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onDelete?.(cat)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 transition-all cursor-pointer"
        >
          <FiTrash2 size={12} />
          Delete
        </motion.button>
      </div>
    </motion.div>
  )
}
