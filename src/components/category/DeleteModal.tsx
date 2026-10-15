import { motion, AnimatePresence } from 'framer-motion'
import Portal from '../ui/Portal'
import { FiAlertTriangle, FiLock } from 'react-icons/fi'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import type { Category } from '../../services/categoryService'

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

  const subCount = category.sub_category_count || category.subcategories.length
  const blocked = category.products > 0

  return (
    <Portal>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => { if (!loading) onClose() }}
        >
          <motion.div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-category-title"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-2xl border border-border shadow-[0_12px_40px_rgba(15,23,42,0.14)] p-6 text-center"
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 ${blocked ? 'bg-amber-50' : 'bg-danger/10'}`}>
              {blocked ? <FiLock size={24} className="text-amber-500" /> : <FiAlertTriangle size={24} className="text-danger" />}
            </div>
            <h3 id="delete-category-title" className="text-lg font-semibold text-text-primary">
              {blocked ? 'Category in use' : 'Delete Category'}
            </h3>
            {blocked ? (
              <p className="text-sm text-text-muted mt-1">
                <strong className="text-text-secondary">{category.name}</strong> still has {category.products} product
                {category.products === 1 ? '' : 's'}. Move or delete them first, or set the category to Inactive to hide it.
              </p>
            ) : (
              <>
                <p className="text-sm text-text-muted mt-1">
                  Delete <strong className="text-text-secondary">{category.name}</strong>? This cannot be undone.
                </p>
                {subCount > 0 && (
                  <p className="text-xs text-danger mt-3 bg-danger/5 rounded-lg px-3 py-2">
                    Its {subCount} sub categor{subCount === 1 ? 'y' : 'ies'} will also be removed.
                  </p>
                )}
              </>
            )}

            <div className="flex items-center gap-3 mt-6">
              {!blocked && (
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-danger text-white text-sm font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Delete'}
                </button>
              )}
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-white border border-border text-text-secondary text-sm font-medium hover:bg-surface-hover transition-colors cursor-pointer"
              >
                {blocked ? 'OK' : 'Cancel'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </Portal>
  )
}
