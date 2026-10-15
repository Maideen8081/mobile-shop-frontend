import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronDown, FiTrash2, FiCopy, FiImage, FiX, FiStar, FiUploadCloud, FiAlertCircle } from 'react-icons/fi'
import { useRef, useState } from 'react'
import SearchableDropdown from './SearchableDropdown'
import { ramOptions, storageOptions } from '../../data/productData'
import {
  IMAGE_ACCEPT, IMAGE_TYPES_LABEL, PRODUCT, PRODUCT_IMAGE_MAX_MB, imageFileError,
} from '../../utils/catalogValidation'
import { fileDraft, releaseImage, type VariantDraft } from './productDraft'

interface VariantCardProps {
  variant: VariantDraft
  index: number
  canDelete: boolean
  onChange: (variant: VariantDraft) => void
  onDelete: () => void
  onDuplicate: () => void
  errors?: Record<string, string>
}

const withCurrent = (options: string[], value: string) => (value && !options.includes(value) ? [value, ...options] : options)

export default function VariantCard({ variant, index, canDelete, onChange, onDelete, onDuplicate, errors = {} }: VariantCardProps) {
  const [openState, setOpen] = useState(index === 0 || !variant.dbId)
  const [dragOver, setDragOver] = useState(false)
  const [imageError, setImageError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const errorCount = Object.keys(errors).length

  // A card with errors stays open so the admin sees them.
  const open = openState || errorCount > 0

  const update = <K extends keyof VariantDraft>(key: K, val: VariantDraft[K]) => onChange({ ...variant, [key]: val })
  const num = (s: string) => (s.trim() === '' ? 0 : Number(s))

  const addFiles = (files: FileList) => {
    const room = PRODUCT.maxImagesPerVariant - variant.images.length
    const picked = Array.from(files)
    const problems: string[] = []
    const good = picked.filter((f) => { const err = imageFileError(f, PRODUCT_IMAGE_MAX_MB); if (err) problems.push(err); return !err })
    if (good.length > room) problems.push(`Only ${room} more image${room === 1 ? '' : 's'} allowed (max ${PRODUCT.maxImagesPerVariant})`)
    setImageError(problems.join(' · '))
    if (room > 0 && good.length) onChange({ ...variant, images: [...variant.images, ...good.slice(0, room).map(fileDraft)] })
  }

  const removeImage = (key: string) => {
    const img = variant.images.find((i) => i.key === key)
    if (img) releaseImage(img)
    onChange({ ...variant, images: variant.images.filter((i) => i.key !== key) })
  }

  const makeMain = (key: string) => {
    const img = variant.images.find((i) => i.key === key)
    if (img) onChange({ ...variant, images: [img, ...variant.images.filter((i) => i.key !== key)] })
  }

  const input = (hasErr: boolean) =>
    `w-full h-11 px-4 rounded-xl bg-surface-lighter border text-sm text-text-primary outline-none transition-all focus:border-primary/50 ${hasErr ? 'border-danger' : 'border-border'}`
  const err = (k: string) => (errors[k] ? <p role="alert" className="text-xs text-danger mt-1">{errors[k]}</p> : null)
  const label = (text: string, required = true) => (
    <span className="block text-xs font-semibold text-text-secondary mb-1.5">{text} {required && <span className="text-danger">*</span>}</span>
  )

  const discountPct = variant.price > 0 && variant.discountPrice > 0 && variant.discountPrice < variant.price
    ? Math.round((1 - variant.discountPrice / variant.price) * 100) : 0
  const stockState = variant.stock === 0 ? 'Out of stock' : variant.stock <= variant.lowStockAlert ? 'Low stock' : 'In stock'

  return (
    <motion.div layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
      className={`rounded-xl bg-bg-card border overflow-hidden ${errorCount ? 'border-danger/40' : 'border-border'}`}
    >
      <button type="button" onClick={() => setOpen(!openState)} aria-expanded={open}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-primary/[0.03] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0 overflow-hidden">
            {variant.images[0] ? <img src={variant.images[0].src} alt="" className="w-full h-full object-cover" /> : index + 1}
          </span>
          <div className="text-left min-w-0">
            <p className="text-sm font-semibold text-text-primary truncate">{variant.name || `Variant ${index + 1}`}</p>
            <p className="text-[10px] text-text-muted truncate">
              {variant.ram || 'RAM'} • {variant.storage || 'Storage'} • {variant.color || 'Color'}
              {variant.price > 0 && ` • ₹${variant.price.toLocaleString('en-IN')}`}
              {variant.dbId ? '' : ' • new'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {errorCount > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-danger/10 text-danger text-[10px] font-semibold">
              <FiAlertCircle size={10} /> {errorCount} to fix
            </span>
          )}
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <FiChevronDown size={16} className="text-text-muted" />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="border-t border-border"
          >
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  {label('Variant Name')}
                  <input type="text" value={variant.name} maxLength={100} onChange={(e) => update('name', e.target.value)} placeholder="e.g. Midnight Black 256GB" className={input(!!errors.name)} />
                  {err('name')}
                </label>
                <label className="block">
                  {label('Color')}
                  <input type="text" value={variant.color} maxLength={50} onChange={(e) => update('color', e.target.value)} placeholder="e.g. Midnight Black" className={input(!!errors.color)} />
                  {err('color')}
                </label>
              </div>

              <div className="border-t border-border pt-4">
                <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">Specifications</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <SearchableDropdown label="RAM Size" options={withCurrent(ramOptions, variant.ram)} value={variant.ram}
                    onChange={(v) => update('ram', v)} placeholder="Select RAM" error={errors.ram} required />
                  <SearchableDropdown label="Storage Size" options={withCurrent(storageOptions, variant.storage)} value={variant.storage}
                    onChange={(v) => update('storage', v)} placeholder="Select Storage" error={errors.storage} required />
                  <label className="block">
                    {label('Battery (mAh)')}
                    <input type="number" inputMode="numeric" min={PRODUCT.batteryMin} max={PRODUCT.batteryMax} step={1}
                      value={variant.battery || ''} onChange={(e) => update('battery', num(e.target.value))} placeholder="e.g. 5000" className={input(!!errors.battery)} />
                    {err('battery')}
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <label className="block">
                    {label('Processor')}
                    <input type="text" value={variant.processor} maxLength={100} onChange={(e) => update('processor', e.target.value)} placeholder="e.g. A17 Pro" className={input(!!errors.processor)} />
                    {err('processor')}
                  </label>
                  <label className="block">
                    {label('Display Size')}
                    <input type="text" value={variant.display} maxLength={50} onChange={(e) => update('display', e.target.value)} placeholder='e.g. 6.7" OLED' className={input(!!errors.display)} />
                    {err('display')}
                  </label>
                  <label className="block">
                    {label('Camera Details')}
                    <input type="text" value={variant.camera} maxLength={255} onChange={(e) => update('camera', e.target.value)} placeholder="e.g. 48MP + 12MP" className={input(!!errors.camera)} />
                    {err('camera')}
                  </label>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">Pricing & Stock</h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <label className="block">
                    {label('Price (₹)')}
                    <input type="number" inputMode="decimal" min={0.01} step={0.01} value={variant.price || ''}
                      onChange={(e) => update('price', num(e.target.value))} placeholder="e.g. 59999" className={input(!!errors.price)} />
                    {err('price')}
                  </label>
                  <label className="block">
                    {label('Discount Price (₹)', false)}
                    <input type="number" inputMode="decimal" min={0} step={0.01} value={variant.discountPrice || ''}
                      onChange={(e) => update('discountPrice', num(e.target.value))} placeholder="Optional" className={input(!!errors.discountPrice)} />
                    {err('discountPrice')}
                  </label>
                  <label className="block">
                    {label('Stock')}
                    <input type="number" inputMode="numeric" min={0} max={PRODUCT.stockMax} step={1} value={Number.isNaN(variant.stock) ? '' : variant.stock}
                      onChange={(e) => update('stock', num(e.target.value))} className={input(!!errors.stock)} />
                    {err('stock')}
                  </label>
                  <label className="block">
                    {label('Low Stock Alert', false)}
                    <input type="number" inputMode="numeric" min={0} max={PRODUCT.lowStockMax} step={1} value={Number.isNaN(variant.lowStockAlert) ? '' : variant.lowStockAlert}
                      onChange={(e) => update('lowStockAlert', num(e.target.value))} className={input(!!errors.lowStockAlert)} />
                    {err('lowStockAlert')}
                  </label>
                </div>
                <div className="flex flex-wrap gap-2 mt-3 text-xs font-semibold">
                  {discountPct > 0 && (
                    <span className="px-3 py-1.5 rounded-lg bg-success/10 text-success">{discountPct}% off · customer pays ₹{variant.discountPrice.toLocaleString('en-IN')}</span>
                  )}
                  <span className={`px-3 py-1.5 rounded-lg ${variant.stock === 0 ? 'bg-rose-50 text-rose-600' : variant.stock <= variant.lowStockAlert ? 'bg-amber-50 text-amber-700' : 'bg-primary/10 text-primary'}`}>
                    {stockState}
                  </span>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-3">
                  Images ({variant.images.length}/{PRODUCT.maxImagesPerVariant}) <span className="text-danger">*</span>
                  <span className="normal-case font-normal tracking-normal ml-2">First image is the main one</span>
                </h5>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files) }}
                  onClick={() => inputRef.current?.click()}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click() } }}
                  role="button" tabIndex={0} aria-label={`Upload images for variant ${index + 1}`}
                  className={`rounded-xl border-2 border-dashed p-4 text-center transition-all duration-200 cursor-pointer ${
                    dragOver ? 'border-primary bg-primary/10' : errors.images ? 'border-danger bg-danger/5' : 'border-primary/20 hover:border-primary/30 bg-surface-lighter'
                  }`}
                >
                  <input ref={inputRef} type="file" accept={IMAGE_ACCEPT} multiple className="hidden"
                    onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = '' }} />
                  <div className="flex flex-col items-center gap-1.5">
                    <FiUploadCloud size={18} className="text-primary" />
                    <p className="text-xs font-semibold text-text-secondary">Drop images or click to upload</p>
                    <p className="text-[10px] text-text-muted">{IMAGE_TYPES_LABEL}, up to {PRODUCT_IMAGE_MAX_MB}MB each</p>
                  </div>
                </div>
                {variant.images.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mt-3">
                    <AnimatePresence initial={false}>
                      {variant.images.map((img, i) => (
                        <motion.div key={img.key} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                          className="relative group aspect-square rounded-xl bg-surface-lighter border border-border overflow-hidden"
                        >
                          <img src={img.src} alt={`Variant image ${i + 1}`} className="w-full h-full object-cover" />
                          {i === 0 && <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-warning text-white text-[8px] font-bold">Main</span>}
                          {!img.id && <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-primary text-white text-[8px] font-bold">New</span>}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 group-focus-within:bg-black/40 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100">
                            {i !== 0 && (
                              <button type="button" onClick={() => makeMain(img.key)} title="Make main image" aria-label="Make main image"
                                className="w-6 h-6 rounded-lg bg-white/90 flex items-center justify-center hover:bg-white cursor-pointer"
                              ><FiStar size={10} className="text-warning" /></button>
                            )}
                            <button type="button" onClick={() => removeImage(img.key)} title="Remove image" aria-label="Remove image"
                              className="w-6 h-6 rounded-lg bg-white/90 flex items-center justify-center hover:bg-white cursor-pointer"
                            ><FiX size={10} className="text-danger" /></button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {variant.images.length < PRODUCT.maxImagesPerVariant && (
                      <button type="button" onClick={() => inputRef.current?.click()} aria-label="Add image"
                        className="aspect-square rounded-xl border-2 border-dashed border-primary/20 flex items-center justify-center text-text-muted hover:text-primary hover:border-primary/30 transition-all cursor-pointer"
                      ><FiImage size={18} /></button>
                    )}
                  </div>
                )}
                {(imageError || errors.images) && (
                  <p role="alert" className="text-xs text-danger mt-1.5">{[errors.images, imageError].filter(Boolean).join(' · ')}</p>
                )}
              </div>

              <div className="border-t border-border pt-3 flex items-center gap-2">
                <button type="button" onClick={onDuplicate}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors cursor-pointer"
                ><FiCopy size={12} /> Duplicate</button>
                <button type="button" onClick={onDelete} disabled={!canDelete}
                  title={canDelete ? undefined : 'A product needs at least one variant'}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold hover:bg-rose-100/50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                ><FiTrash2 size={12} /> Remove variant</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
