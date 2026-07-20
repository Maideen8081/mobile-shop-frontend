import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiX } from 'react-icons/fi'

interface FeatureInputListProps {
  features: string[]
  onChange: (features: string[]) => void
  label?: string
  placeholder?: string
}

export default function FeatureInputList({
  features, onChange, label = 'Product Features', placeholder = 'e.g. 120Hz AMOLED Display',
}: FeatureInputListProps) {
  const add = () => onChange([...features, ''])
  const remove = (i: number) => onChange(features.filter((_, idx) => idx !== i))
  const update = (i: number, val: string) => {
    const next = [...features]
    next[i] = val
    onChange(next)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <label className="text-xs font-semibold text-text-secondary">{label}</label>
        <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={add}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors cursor-pointer"
        ><FiPlus size={12} /> Add</motion.button>
      </div>
      <div className="space-y-2">
        <AnimatePresence>
          {features.map((feat, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -12, height: 0 }} animate={{ opacity: 1, x: 0, height: 'auto' }} exit={{ opacity: 0, x: 12, height: 0 }} transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <span className="text-text-muted text-xs">⟷</span>
              <input type="text" value={feat} onChange={(e) => update(i, e.target.value)} placeholder={placeholder}
                className="flex-1 h-10 px-4 rounded-xl bg-surface-lighter border border-border text-sm text-text-primary placeholder-text-muted outline-none transition-all focus:border-primary/50 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.08)]"
              />
              <button type="button" onClick={() => remove(i)}
                className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center hover:bg-rose-100 transition-colors cursor-pointer"
              ><FiX size={14} className="text-danger" /></button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
