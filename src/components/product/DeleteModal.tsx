import { motion, AnimatePresence } from 'framer-motion'
import { FiAlertTriangle } from 'react-icons/fi'
import type { Product } from '../../data/productData'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'

interface DeleteModalProps {
  open: boolean
  product: Product | null
  onClose: () => void
  onConfirm?: () => void
}

export default function DeleteModal({ open, product, onClose, onConfirm }: DeleteModalProps) {
  useLockBodyScroll(open)
  if (!open || !product) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={onClose}
        >
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl bg-bg-card border border-border shadow-2xl p-6 text-center"
          >
            <div className="w-16 h-16 rounded-xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
              <FiAlertTriangle size={28} className="text-danger" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">Delete Product</h3>
            <p className="text-sm text-text-muted mt-1">Delete <strong className="text-text-primary">{product.name}</strong>? This cannot be undone.</p>
            {product.variants.length > 0 && (
              <p className="text-xs text-danger mt-3 bg-rose-50 rounded-xl px-3 py-2">{product.variants.length} variants will also be removed.</p>
            )}
            <div className="flex items-center gap-3 mt-6">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onConfirm}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold cursor-pointer"
              >Delete</motion.button>
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-bg text-text-secondary text-sm font-semibold hover:bg-surface-hover transition-colors cursor-pointer">Cancel</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
