import { motion } from 'framer-motion'
import { FiEdit2, FiTrash2, FiChevronDown, FiChevronRight } from 'react-icons/fi'
import { useState } from 'react'
import StatusBadge from './StatusBadge'

interface SubCategory { id: number; name: string; products: number }
interface Category { id: number; name: string; image: string | null; products: number; sub_category_count: number; status: 'active' | 'inactive'; created: string; subcategories: SubCategory[] }

interface CategoryTableProps {
  data: Category[]
  onEdit?: (cat: Category) => void
  onDelete?: (cat: Category) => void
}

export default function CategoryTable({ data, onEdit, onDelete }: CategoryTableProps) {
  const [expanded, setExpanded] = useState<number | null>(null)

  if (data.length === 0) return null

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
      <table className="w-full min-w-[780px]">
        <thead>
          <tr className="border-b border-border bg-gray-50/80">
            {['S.No', 'Category', 'Sub Categories', 'Products', 'Status', 'Created', 'Actions'].map((h) => (
              <th key={h} className="text-left text-[11px] font-bold text-text-muted uppercase tracking-wider px-5 py-4">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((cat, i) => (
            <motion.tr
              key={cat.id}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
              className="border-b border-border hover:bg-gray-50/70 transition-colors"
            >
              <td className="px-5 py-4 text-sm text-text-muted font-medium">{String(i + 1).padStart(2, '0')}</td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-surface-lighter border border-border flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                    {cat.image ? (
                      <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <span className="text-lg font-bold text-text-muted">{cat.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{cat.name}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">
                <button
                  onClick={() => setExpanded(expanded === cat.id ? null : cat.id)}
                  className="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors cursor-pointer"
                >
                  {cat.sub_category_count}
                  {cat.sub_category_count > 0 && (
                    expanded === cat.id ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />
                  )}
                </button>
                {expanded === cat.id && cat.subcategories.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex flex-wrap gap-1.5 mt-2"
                  >
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
                  </motion.div>
                )}
              </td>
              <td className="px-5 py-4">
                <span className="text-sm font-semibold text-text-primary">{cat.products}</span>
              </td>
              <td className="px-5 py-4"><StatusBadge status={cat.status} /></td>
              <td className="px-5 py-4 text-sm text-text-muted whitespace-nowrap">{cat.created}</td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onEdit?.(cat)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 transition-all cursor-pointer"
                    title="Edit"
                  >
                    <FiEdit2 size={12} />
                    Edit
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onDelete?.(cat)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-pink-400 bg-pink-500/10 hover:bg-pink-500/20 transition-all cursor-pointer"
                    title="Delete"
                  >
                    <FiTrash2 size={12} />
                    Delete
                  </motion.button>
                </div>
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
