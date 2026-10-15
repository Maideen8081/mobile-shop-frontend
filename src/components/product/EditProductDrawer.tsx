import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Portal from '../ui/Portal'
import { FiX } from 'react-icons/fi'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import ProductForm from './ProductForm'
import type { Product } from '../../data/productData'
import type { SubCategory } from '../../services/categoryService'
import type { Errors } from '../../utils/catalogValidation'

interface EditProductDrawerProps {
  open: boolean
  /** null while the full product is loading. */
  product: Product | null
  loadError?: string
  onClose: () => void
  onSave: (id: number, formData: FormData) => Promise<Errors | null>
  loading?: boolean
  categoryOptions: { id: number; name: string }[]
  subcategoryOptions: SubCategory[]
}

export default function EditProductDrawer({
  open, product, loadError, onClose, onSave, loading, categoryOptions, subcategoryOptions,
}: EditProductDrawerProps) {
  useLockBodyScroll(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, loading, onClose])

  const thumb = product?.coverImage || product?.variants?.[0]?.images?.[0]

  return (
    <Portal>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={() => { if (!loading) onClose() }}
          >
            <motion.div
              role="dialog" aria-modal="true" aria-labelledby="edit-product-title"
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute right-0 top-0 bottom-0 w-full max-w-2xl lg:max-w-4xl bg-bg-card border-l border-border shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                    {thumb ? <img src={thumb} alt="" className="w-full h-full object-cover" /> : <span className="text-lg">📱</span>}
                  </div>
                  <div className="min-w-0">
                    <h3 id="edit-product-title" className="text-sm font-bold text-text-primary">Edit Product</h3>
                    <p className="text-xs text-text-muted truncate">{product ? `${product.brand} · ${product.name}` : 'Loading…'}</p>
                  </div>
                </div>
                <button onClick={onClose} disabled={loading} aria-label="Close"
                  className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer"
                ><FiX size={16} className="text-text-muted" /></button>
              </div>

              <div className="flex-1 min-h-0">
                {loadError ? (
                  <div className="p-8 text-center text-sm text-danger">{loadError}</div>
                ) : !product ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <ProductForm
                    key={product.id}
                    mode="edit"
                    layout="drawer"
                    initial={product}
                    categoryOptions={categoryOptions}
                    subcategoryOptions={subcategoryOptions}
                    onSubmit={(fd) => onSave(product.id, fd)}
                    onCancel={onClose}
                    loading={loading}
                  />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  )
}
