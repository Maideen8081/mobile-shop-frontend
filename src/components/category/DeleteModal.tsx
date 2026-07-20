import { motion, AnimatePresence } from 'framer-motion'
import { FiAlertTriangle } from 'react-icons/fi'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'

interface SubCategory { id: number; name: string; products: number }
interface Category { id: number; name: string; products: number; status: 'active' | 'inactive'; created: string; subcategories: SubCategory[] }

interface DeleteModalProps {
  open: boolean
  category: Category | null
  onClose: () => void
  onConfirm?: () => void
  loading?: boolean
}

export default function DeleteModal({ open, category, onClose, onConfirm, loading }: DeleteModalProps) {
  useLockBodyScroll(open)
  if (!open || !category) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-surface-lighter rounded-xl border border-white/5 shadow-dropdown p-6 text-center"
          >
            <div className="w-14 h-14 rounded-xl bg-pink-500/10 flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle size={24} className="text-pink-400" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary">Delete Category</h3>
            <p className="text-sm text-text-muted mt-1">
              Are you sure you want to delete <strong className="text-text-secondary">{category.name}</strong>? This action cannot be undone.
            </p>

            {category.subcategories.length > 0 && (
              <p className="text-xs text-pink-400 mt-3 bg-pink-500/10 rounded-lg px-3 py-2">
                This category has {category.subcategories.length} subcategories that will also be removed.
              </p>
            )}

            <div className="flex items-center gap-3 mt-6">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onConfirm}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-danger text-white text-sm font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
                ) : 'Delete'}
              </motion.button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-text-muted text-sm font-medium hover:bg-surface-hover transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
