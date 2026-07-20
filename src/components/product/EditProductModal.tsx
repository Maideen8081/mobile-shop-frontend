import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiX, FiSave } from 'react-icons/fi'
import type { Product } from '../../data/productData'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'

interface EditProductModalProps {
  open: boolean
  product: Product | null
  onClose: () => void
  onSave?: (data: Partial<Product>) => void
}

export default function EditProductModal({ open, product, onClose, onSave }: EditProductModalProps) {
  useLockBodyScroll(open)
  const [name, setName] = useState(product?.name ?? '')
  const firstVariant = product?.variants?.[0]
  const [price, setPrice] = useState(firstVariant?.discountPrice || firstVariant?.price || 0)
  const [stock, setStock] = useState(firstVariant?.stock ?? 0)
  const [status, setStatus] = useState(product?.status === 'active')

  const thumb = product?.variants?.[0]?.images?.[0] || '📱'

  if (!open || !product) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm" onClick={onClose}
        >
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-xl bg-bg-card border border-border shadow-2xl p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">{thumb}</div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">Edit Product</h3>
                  <p className="text-xs text-text-muted">{product.name.slice(0, 30)}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-xl bg-bg flex items-center justify-center hover:bg-surface-hover transition-colors cursor-pointer">
                <FiX size={14} className="text-text-muted" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5">Product Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl bg-surface-lighter border border-border text-sm text-text-primary outline-none transition-all focus:border-primary/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">Price (₹)</label>
                  <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full h-11 px-4 rounded-xl bg-surface-lighter border border-border text-sm text-text-primary outline-none transition-all focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1.5">Stock</label>
                  <input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full h-11 px-4 rounded-xl bg-surface-lighter border border-border text-sm text-text-primary outline-none transition-all focus:border-primary/50"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-text-secondary">Status</label>
                <button type="button" onClick={() => setStatus(!status)}
                  className={`relative w-20 h-8 rounded-xl border transition-all cursor-pointer ${status ? 'bg-emerald-50 border-emerald-200/50' : 'bg-rose-50 border-rose-200/50'}`}
                >
                  <span className={`text-[10px] font-semibold ${status ? 'text-emerald-700' : 'text-rose-600'}`}>{status ? 'Active' : 'Inactive'}</span>
                  <span className={`absolute top-1 bottom-1 w-4 rounded-lg bg-white shadow-sm transition-all duration-200 ${status ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => { onSave?.({ name, status: status ? 'active' : 'inactive' }); onClose() }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold cursor-pointer"
              ><FiSave size={14} /> Save Changes</motion.button>
              <button onClick={onClose} className="px-5 py-2.5 rounded-xl bg-bg text-text-secondary text-sm font-semibold hover:bg-surface-hover transition-colors cursor-pointer">Cancel</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
