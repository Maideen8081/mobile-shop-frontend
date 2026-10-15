import { motion, AnimatePresence } from 'framer-motion'
import Portal from '../ui/Portal'
import { FiAlertTriangle } from 'react-icons/fi'
import type { Product } from '../../data/productData'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'

interface DeleteModalProps {
  open: boolean
  product: Product | null
  onClose: () => void
  onConfirm?: () => void
  loading?: boolean
}

export default function DeleteModal({ open, product, onClose, onConfirm, loading }: DeleteModalProps) {
  useLockBodyScroll(open)
  if (!open || !product) return null

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => { if (!loading) onClose() }}
          >
            <motion.div role="alertdialog" aria-modal="true" initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl bg-bg-card border border-border shadow-2xl p-6 text-center"
            >
              <div className="w-16 h-16 rounded-xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
                <FiAlertTriangle size={28} className="text-danger" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">Delete Product</h3>
              <p className="text-sm text-text-muted mt-1">Delete <strong className="text-text-primary">{product.name}</strong>? This cannot be undone.</p>
              {product.variants.length > 0 && (
                <p className="text-xs text-danger mt-3 bg-rose-50 rounded-xl px-3 py-2">
                  Its {product.variants.length} variant{product.variants.length === 1 ? '' : 's'} and their images will also be removed. Past orders keep their own copy of the details.
                </p>
              )}
              {product.status === 'active' && (
                <p className="text-xs text-text-muted mt-2">To take it off the shop without losing it, edit the product and switch it to Hidden instead.</p>
              )}
              <div className="flex items-center gap-3 mt-6">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onConfirm} disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-danger text-white text-sm font-semibold cursor-pointer disabled:opacity-50"
                >{loading ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Delete'}</motion.button>
                <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-bg text-text-secondary text-sm font-semibold hover:bg-surface-hover transition-colors cursor-pointer">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  )
}
