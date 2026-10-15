import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiX, FiAlertCircle } from 'react-icons/fi'

interface FeatureInputListProps {
  features: string[]
  onChange: (features: string[]) => void
  label?: string
  placeholder?: string
  addLabel?: string
  maxItems?: number
  maxLength?: number
  error?: string
}

export default function FeatureInputList({
  features, onChange, label = 'Product Features', placeholder = 'e.g. 120Hz AMOLED Display',
  addLabel = 'Add', maxItems = 20, maxLength = 255, error,
}: FeatureInputListProps) {
  const add = () => onChange([...features, ''])
  const remove = (i: number) => onChange(features.filter((_, idx) => idx !== i))
  const update = (i: number, val: string) => {
    const next = [...features]
    next[i] = val
    onChange(next)
  }
  const atMax = features.length >= maxItems

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-semibold text-text-secondary">
          {label} <span className="font-normal text-text-muted">({features.length}/{maxItems})</span>
        </span>
        <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={add} disabled={atMax}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        ><FiPlus size={12} /> {addLabel}</motion.button>
      </div>
      {features.length === 0 && (
        <p className="text-xs text-text-muted py-3 text-center rounded-xl border border-dashed border-border">None added</p>
      )}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {features.map((feat, i) => {
            const empty = !!error && !feat.trim()
            return (
              <motion.div key={i} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}
                className="flex items-center gap-2"
              >
                <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">{i + 1}</span>
                <input type="text" value={feat} maxLength={maxLength} onChange={(e) => update(i, e.target.value)} placeholder={placeholder}
                  aria-label={`${label} ${i + 1}`}
                  className={`flex-1 h-10 px-4 rounded-xl bg-surface-lighter border text-sm text-text-primary placeholder-text-muted outline-none transition-all focus:border-primary/50 ${empty ? 'border-danger' : 'border-border'}`}
                />
                <button type="button" onClick={() => remove(i)} aria-label={`Remove ${label.toLowerCase()} ${i + 1}`}
                  className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center hover:bg-rose-100 transition-colors cursor-pointer"
                ><FiX size={14} className="text-danger" /></button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
      {error && <p role="alert" className="text-xs text-danger mt-1.5 flex items-center gap-1"><FiAlertCircle size={11} /> {error}</p>}
    </div>
  )
}
