import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronDown, FiTrash2, FiCopy, FiImage, FiX, FiStar, FiUploadCloud } from 'react-icons/fi'
import { useRef, useState, useCallback } from 'react'
import SearchableDropdown from './SearchableDropdown'
import { ramOptions, storageOptions } from '../../data/productData'
import type { Variant } from '../../data/productData'

function VariantImage({ src, onRemove, onSetMain, isMain, index }: { src: string; onRemove: () => void; onSetMain?: () => void; isMain: boolean; index: number }) {
  const [error, setError] = useState(false)
  const isUrl = src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('http')
  return (
    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
      className="relative group aspect-square rounded-xl bg-surface-lighter border border-border overflow-hidden"
    >
      {isUrl && !error ? (
        <img src={src} alt={`Variant image ${index + 1}`} onError={() => setError(true)} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <FiImage size={20} className="text-text-muted" />
        </div>
      )}
      {isMain && (
        <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-warning text-white text-[8px] font-bold">Main</div>
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
        {!isMain && onSetMain && (
          <button type="button" onClick={(e) => { e.stopPropagation(); onSetMain() }}
            className="w-6 h-6 rounded-lg bg-white/90 flex items-center justify-center hover:bg-white cursor-pointer"
            title="Set as main"
          ><FiStar size={10} className="text-warning" /></button>
        )}
        <button type="button" onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="w-6 h-6 rounded-lg bg-white/90 flex items-center justify-center hover:bg-white cursor-pointer"
          title="Remove"
        ><FiX size={10} className="text-danger" /></button>
      </div>
    </motion.div>
  )
}

interface VariantCardProps {
  variant: Variant
  index: number
  onChange: (variant: Variant) => void
  onDelete: () => void
  onDuplicate: () => void
  errors?: Record<string, string>
}

export default function VariantCard({ variant, index, onChange, onDelete, onDuplicate, errors = {} }: VariantCardProps) {
  const [open, setOpen] = useState(index === 0)
  const inputRef = useRef<HTMLInputElement>(null)

  const update = (key: keyof Variant, val: string | number | string[]) => onChange({ ...variant, [key]: val })

  const handleFiles = useCallback((files: FileList) => {
    const remaining = 10 - variant.images.length
    if (remaining <= 0) return
    const toAdd = Math.min(files.length, remaining)
    for (let i = 0; i < toAdd; i++) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          onChange({ ...variant, images: [...variant.images, e.target.result as string] })
        }
      }
      reader.readAsDataURL(files[i])
    }
  }, [variant, onChange])

  const addImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) handleFiles(e.target.files)
    e.target.value = ''
  }

  const removeImage = (imgIdx: number) => {
    onChange({ ...variant, images: variant.images.filter((_, i) => i !== imgIdx) })
  }

  const setMainImage = (imgIdx: number) => {
    const next = [...variant.images]
    const [item] = next.splice(imgIdx, 1)
    next.unshift(item)
    onChange({ ...variant, images: next })
  }

  const [imageDragOver, setImageDragOver] = useState(false)

  const hasError = (field: string) => errors[field] ? true : false
  const getError = (field: string) => errors[field] || ''

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
      className={`rounded-xl bg-bg-card border overflow-hidden ${
        Object.keys(errors).length > 0 ? 'border-danger/30' : 'border-border'
      }`}
    >
      <button type="button" onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-primary/[0.03] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">{index + 1}</span>
          <div className="text-left">
            <p className="text-sm font-semibold text-text-primary">{variant.name || `Variant ${index + 1}`}</p>
            <p className="text-[10px] text-text-muted">
              {variant.ram || 'RAM'} • {variant.storage || 'Storage'} • {variant.color || 'Color'}
              {variant.price > 0 && ` • ₹${variant.price.toLocaleString('en-IN')}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <FiChevronDown size={16} className="text-text-muted" />
          </motion.span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="border-t border-border"
          >
            <div className="p-5 space-y-5">
              {/* Basic Variant Info */}
              <div>
                <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">Basic Variant Info</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                      Variant Name <span className="text-danger">*</span>
                    </label>
                    <input type="text" value={variant.name} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Midnight Black 256GB"
                      className={`w-full h-11 px-4 rounded-xl bg-surface-lighter border text-sm text-text-primary outline-none transition-all focus:border-primary/50 ${
                        hasError('name') ? 'border-danger' : 'border-border'
                      }`}
                    />
                    {getError('name') && <p className="text-xs text-danger mt-1">{getError('name')}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                      Color <span className="text-danger">*</span>
                    </label>
                    <input type="text" value={variant.color} onChange={(e) => update('color', e.target.value)} placeholder="e.g. Midnight Black"
                      className={`w-full h-11 px-4 rounded-xl bg-surface-lighter border text-sm text-text-primary outline-none transition-all focus:border-primary/50 ${
                        hasError('color') ? 'border-danger' : 'border-border'
                      }`}
                    />
                    {getError('color') && <p className="text-xs text-danger mt-1">{getError('color')}</p>}
                  </div>
                </div>
              </div>

              {/* Mobile Specs */}
              <div className="border-t border-border pt-4">
                <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">Mobile Specifications</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <SearchableDropdown
                      label="RAM Size"
                      options={ramOptions}
                      value={variant.ram}
                      onChange={(v) => update('ram', v)}
                      placeholder="Select RAM"
                      error={getError('ram')}
                      required
                    />
                  </div>
                  <div>
                    <SearchableDropdown
                      label="Storage Size"
                      options={storageOptions}
                      value={variant.storage}
                      onChange={(v) => update('storage', v)}
                      placeholder="Select Storage"
                      error={getError('storage')}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                      Battery Capacity (mAh) <span className="text-danger">*</span>
                    </label>
                    <input type="number" value={variant.battery || ''} onChange={(e) => update('battery', Number(e.target.value))} placeholder="e.g. 5000"
                      className={`w-full h-11 px-4 rounded-xl bg-surface-lighter border text-sm text-text-primary outline-none transition-all focus:border-primary/50 ${
                        hasError('battery') ? 'border-danger' : 'border-border'
                      }`}
                    />
                    {getError('battery') && <p className="text-xs text-danger mt-1">{getError('battery')}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                      Processor <span className="text-danger">*</span>
                    </label>
                    <input type="text" value={variant.processor} onChange={(e) => update('processor', e.target.value)} placeholder="e.g. A17 Pro"
                      className={`w-full h-11 px-4 rounded-xl bg-surface-lighter border text-sm text-text-primary outline-none transition-all focus:border-primary/50 ${
                        hasError('processor') ? 'border-danger' : 'border-border'
                      }`}
                    />
                    {getError('processor') && <p className="text-xs text-danger mt-1">{getError('processor')}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                      Display Size <span className="text-danger">*</span>
                    </label>
                    <input type="text" value={variant.display} onChange={(e) => update('display', e.target.value)} placeholder='e.g. 6.7" Super Retina XDR'
                      className={`w-full h-11 px-4 rounded-xl bg-surface-lighter border text-sm text-text-primary outline-none transition-all focus:border-primary/50 ${
                        hasError('display') ? 'border-danger' : 'border-border'
                      }`}
                    />
                    {getError('display') && <p className="text-xs text-danger mt-1">{getError('display')}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                      Camera Details <span className="text-danger">*</span>
                    </label>
                    <input type="text" value={variant.camera} onChange={(e) => update('camera', e.target.value)} placeholder="e.g. 48MP + 12MP + 12MP"
                      className={`w-full h-11 px-4 rounded-xl bg-surface-lighter border text-sm text-text-primary outline-none transition-all focus:border-primary/50 ${
                        hasError('camera') ? 'border-danger' : 'border-border'
                      }`}
                    />
                    {getError('camera') && <p className="text-xs text-danger mt-1">{getError('camera')}</p>}
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="border-t border-border pt-4">
                <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">Pricing</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                      Price (₹) <span className="text-danger">*</span>
                    </label>
                    <input type="number" value={variant.price || ''} onChange={(e) => update('price', Number(e.target.value))} placeholder="e.g. 159900"
                      className={`w-full h-11 px-4 rounded-xl bg-surface-lighter border text-sm text-text-primary outline-none transition-all focus:border-primary/50 ${
                        hasError('price') ? 'border-danger' : 'border-border'
                      }`}
                    />
                    {getError('price') && <p className="text-xs text-danger mt-1">{getError('price')}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Discount Price (₹)</label>
                    <input type="number" value={variant.discountPrice || ''} onChange={(e) => update('discountPrice', Number(e.target.value))} placeholder="e.g. 142900"
                      className={`w-full h-11 px-4 rounded-xl bg-surface-lighter border text-sm text-text-primary outline-none transition-all focus:border-primary/50 ${
                        hasError('discountPrice') ? 'border-danger' : 'border-border'
                      }`}
                    />
                    {getError('discountPrice') && <p className="text-xs text-danger mt-1">{getError('discountPrice')}</p>}
                  </div>
                </div>
                {variant.price > 0 && variant.discountPrice > 0 && variant.discountPrice < variant.price && (
                  <div className="mt-3 px-4 py-2.5 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3">
                    <span className="text-xs font-bold text-success">{Math.round((1 - variant.discountPrice / variant.price) * 100)}% OFF</span>
                    <span className="text-xs text-text-muted line-through">₹{variant.price.toLocaleString('en-IN')}</span>
                    <span className="text-xs font-semibold text-text-primary">₹{variant.discountPrice.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              {/* Stock */}
              <div className="border-t border-border pt-4">
                <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">Stock</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                      Stock Quantity <span className="text-danger">*</span>
                    </label>
                    <input type="number" value={variant.stock || ''} onChange={(e) => update('stock', Number(e.target.value))} placeholder="e.g. 50"
                      className={`w-full h-11 px-4 rounded-xl bg-surface-lighter border text-sm text-text-primary outline-none transition-all focus:border-primary/50 ${
                        hasError('stock') ? 'border-danger' : 'border-border'
                      }`}
                    />
                    {getError('stock') && <p className="text-xs text-danger mt-1">{getError('stock')}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">Low Stock Alert</label>
                    <input type="number" value={variant.lowStockAlert || ''} onChange={(e) => update('lowStockAlert', Number(e.target.value))} placeholder="e.g. 5"
                      className={`w-full h-11 px-4 rounded-xl bg-surface-lighter border text-sm text-text-primary outline-none transition-all focus:border-primary/50 ${
                        hasError('lowStockAlert') ? 'border-danger' : 'border-border'
                      }`}
                    />
                    {getError('lowStockAlert') && <p className="text-xs text-danger mt-1">{getError('lowStockAlert')}</p>}
                  </div>
                </div>
                {variant.stock > 0 && (
                  <div className={`mt-3 px-4 py-2.5 rounded-xl text-xs font-semibold ${
                    variant.stock === 0 ? 'bg-rose-50 text-rose-600' :
                    variant.lowStockAlert && variant.stock <= variant.lowStockAlert ? 'bg-amber-50 text-amber-600' :
                    'bg-emerald-50 text-emerald-700'
                  }`}>
                    {variant.stock === 0 ? 'Out of Stock' :
                     variant.lowStockAlert && variant.stock <= variant.lowStockAlert ? 'Low Stock' : 'In Stock'}
                  </div>
                )}
              </div>

              {/* Images */}
              <div className="border-t border-border pt-4">
                <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">
                  Variant Images ({variant.images.length}/10) <span className="text-danger">*</span>
                </h5>
                <div
                  onDragOver={(e) => { e.preventDefault(); setImageDragOver(true) }}
                  onDragLeave={() => setImageDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setImageDragOver(false); if (e.dataTransfer.files) handleFiles(e.dataTransfer.files) }}
                  className={`rounded-xl border-2 border-dashed p-4 text-center transition-all duration-200 cursor-pointer ${
                    imageDragOver ? 'border-primary bg-primary/10' : 'border-primary/20 hover:border-primary/30 bg-surface-lighter'
                  }`}
                  onClick={() => inputRef.current?.click()}
                >
                  <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={addImages} />
                  <div className="flex flex-col items-center gap-1.5">
                    <FiUploadCloud size={18} className="text-primary" />
                    <p className="text-xs font-semibold text-text-secondary">Drop images or click to upload</p>
                    <p className="text-[10px] text-text-muted">Up to 10 images | PNG, JPG, WebP</p>
                  </div>
                </div>

                {variant.images.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 mt-3">
                    <AnimatePresence>
                      {variant.images.map((img, i) => (
                        <VariantImage key={`${i}-${img.slice(0, 30)}`} src={img} index={i} isMain={i === 0}
                          onSetMain={i !== 0 ? () => setMainImage(i) : undefined}
                          onRemove={() => removeImage(i)}
                        />
                      ))}
                    </AnimatePresence>
                    {variant.images.length < 10 && (
                      <button type="button" onClick={() => inputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-primary/20 flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                      ><FiImage size={18} /></button>
                    )}
                  </div>
                )}
                {getError('images') && <p className="text-xs text-danger mt-1">{getError('images')}</p>}
              </div>

              {/* Actions */}
              <div className="border-t border-border pt-3 flex items-center gap-2">
                <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={onDuplicate}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors cursor-pointer"
                ><FiCopy size={12} /> Duplicate</motion.button>
                <motion.button type="button" whileTap={{ scale: 0.95 }} onClick={onDelete}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100/50 transition-colors cursor-pointer"
                ><FiTrash2 size={12} /> Remove</motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
