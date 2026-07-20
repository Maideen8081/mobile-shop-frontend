import { motion, AnimatePresence } from 'framer-motion'
import { FiPlus, FiX } from 'react-icons/fi'

interface CareInstructionListProps {
  instructions: string[]
  onChange: (instructions: string[]) => void
}

export default function CareInstructionList({ instructions, onChange }: CareInstructionListProps) {
  const add = () => onChange([...instructions, ''])
  const remove = (i: number) => onChange(instructions.filter((_, idx) => idx !== i))
  const update = (i: number, val: string) => {
    const next = [...instructions]
    next[i] = val
    onChange(next)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <label className="text-xs font-semibold text-text-secondary">Care Instructions</label>
        <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={add}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500/20 text-teal-400 text-xs font-bold border border-teal-500/30 hover:bg-teal-500/30 hover:border-teal-400/50 transition-all cursor-pointer shadow-sm"
        ><FiPlus size={13} /> Add Instruction</motion.button>
      </div>
      <div className="space-y-2">
        <AnimatePresence>
          {instructions.map((inst, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -12, height: 0 }} animate={{ opacity: 1, x: 0, height: 'auto' }} exit={{ opacity: 0, x: 12, height: 0 }} transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <span className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center text-[10px] font-bold text-teal-500 flex-shrink-0">{i + 1}</span>
              <input type="text" value={inst} onChange={(e) => update(i, e.target.value)} placeholder="e.g. Avoid water exposure"
                className="flex-1 h-10 px-4 rounded-xl bg-surface-lighter border border-teal-100/30 text-sm text-text-primary placeholder-text-muted outline-none transition-all focus:border-teal-300/50 focus:shadow-[0_0_0_4px_rgba(20,184,166,0.08)]"
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
