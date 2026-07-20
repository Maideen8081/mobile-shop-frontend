import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronDown, FiSearch, FiCheck, FiPlus } from 'react-icons/fi'

interface CreatableSelectProps {
  options: string[]
  value: string
  onChange: (v: string) => void
  onCreate?: (v: string) => void
  placeholder?: string
  label?: string
  required?: boolean
  error?: string
  creatable?: boolean
}

export default function CreatableSelect({ options, value, onChange, onCreate, placeholder, label, required, error, creatable = true }: CreatableSelectProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [focusedIdx, setFocusedIdx] = useState(-1)

  const filtered = useMemo(() => {
    if (!search) return options
    return options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
  }, [options, search])

  const showCreate = creatable && !!onCreate && search.trim() && filtered.length === 0

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) { setOpen(false); setSearch('') }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  useEffect(() => { if (open) { inputRef.current?.focus(); setFocusedIdx(-1) } }, [open])

  const handleCreate = () => {
    if (search.trim() && onCreate) {
      onCreate(search.trim())
      onChange(search.trim())
      setOpen(false)
      setSearch('')
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIdx((p) => Math.min(p + 1, filtered.length + (showCreate ? 0 : 0) - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIdx((p) => Math.max(p - 1, 0)) }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (focusedIdx >= 0 && filtered[focusedIdx]) { select(filtered[focusedIdx]) }
      else if (showCreate) { handleCreate() }
    }
    if (e.key === 'Escape') { setOpen(false); setSearch('') }
  }

  const select = (opt: string) => { onChange(opt); setOpen(false); setSearch('') }

  return (
    <div ref={ref} className="relative" onKeyDown={handleKey}>
      {label && (
        <label className="block text-xs font-semibold text-text-secondary mb-1.5">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <button type="button" onClick={() => setOpen(!open)}
        className={`w-full h-11 px-4 rounded-xl border text-sm text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
          error ? 'border-danger shadow-[0_0_0_3px_rgba(239,68,68,0.15)]' : 'border-border hover:border-primary/30 focus:border-primary/50'
        } ${value ? 'bg-[rgba(15,23,42,0.8)] text-text-primary' : 'bg-[rgba(15,23,42,0.8)] text-text-muted'}`}
      >
        <span className={`truncate ${value ? 'text-text-primary' : 'text-text-muted'}`}>{value || placeholder || 'Select...'}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <FiChevronDown size={14} className="text-text-muted flex-shrink-0" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scaleY: 0.95 }} animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.95 }} transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-1 left-0 right-0 rounded-xl bg-[#0F172A] border border-border shadow-2xl overflow-hidden origin-top"
          >
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-surface-lighter">
              <FiSearch size={14} className="text-text-muted flex-shrink-0" />
              <input ref={inputRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..." className="w-full bg-transparent text-xs text-text-primary outline-none placeholder-text-muted"
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {showCreate ? (
                <button type="button" onClick={handleCreate}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-xs text-left text-primary hover:bg-[#1E293B] transition-all cursor-pointer border-b border-border"
                >
                  <span className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center"><FiPlus size={13} /></span>
                  <span>Add &quot;{search.trim()}&quot;</span>
                </button>
              ) : filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-text-muted">No options found</div>
              ) : null}
              {filtered.map((opt, i) => (
                <button key={opt} type="button" onClick={() => select(opt)}
                  onMouseEnter={() => setFocusedIdx(i)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-left transition-all cursor-pointer ${
                    focusedIdx === i ? 'bg-[#1E293B] text-primary' : 'text-text-secondary hover:bg-[#1E293B]'
                  } ${opt === value ? 'font-semibold text-primary' : ''}`}
                >
                  <span>{opt}</span>
                  {opt === value && <FiCheck size={14} className="text-primary flex-shrink-0" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {error && <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-danger mt-1">{error}</motion.p>}
    </div>
  )
}
