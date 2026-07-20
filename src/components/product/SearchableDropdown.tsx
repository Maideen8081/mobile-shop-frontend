import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiChevronDown, FiSearch, FiCheck } from 'react-icons/fi'

interface SearchableDropdownProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  error?: string
  required?: boolean
}

export default function SearchableDropdown({
  options, value, onChange, placeholder = 'Select...', label, error, required,
}: SearchableDropdownProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [focusedIdx, setFocusedIdx] = useState(-1)

  const filtered = useMemo(() => {
    if (!search) return options
    return options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
  }, [options, search])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      setFocusedIdx(-1)
    }
  }, [open])

  useEffect(() => {
    if (focusedIdx >= 0 && listRef.current) {
      const el = listRef.current.children[focusedIdx] as HTMLElement
      el?.scrollIntoView({ block: 'nearest' })
    }
  }, [focusedIdx])

  const select = (opt: string) => {
    onChange(opt)
    setOpen(false)
    setSearch('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIdx((prev) => Math.min(prev + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIdx((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && focusedIdx >= 0 && filtered[focusedIdx]) {
      e.preventDefault()
      select(filtered[focusedIdx])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setSearch('')
    }
  }

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="block text-xs font-semibold text-text-secondary mb-1.5">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}
      <button type="button" onClick={() => setOpen(!open)}
        className={`w-full h-11 px-4 rounded-xl border text-sm text-left flex items-center justify-between transition-all cursor-pointer ${
          error ? 'border-danger' : 'border-border hover:border-primary/30'
        } ${value ? 'bg-surface-lighter text-text-primary' : 'bg-surface-lighter text-text-muted'}`}
      >
        <span className={value ? 'text-text-primary' : 'text-text-muted'}>{value || placeholder}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <FiChevronDown size={16} className="text-text-muted flex-shrink-0" />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-1 left-0 right-0 rounded-xl bg-bg-card border border-border shadow-2xl overflow-hidden origin-top"
            onKeyDown={handleKeyDown}
          >
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-surface-lighter">
              <FiSearch size={14} className="text-text-muted flex-shrink-0" />
              <input ref={inputRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent text-xs text-text-primary outline-none placeholder-text-muted"
              />
            </div>
            <div ref={listRef} className="max-h-48 overflow-y-auto">
              {filtered.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-text-muted">No options found</div>
              ) : (
                filtered.map((opt, i) => (
                  <button key={opt} type="button" onClick={() => select(opt)}
                    onMouseEnter={() => setFocusedIdx(i)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-left transition-all cursor-pointer ${
                      focusedIdx === i ? 'bg-primary/15 text-primary' : 'text-text-secondary hover:bg-primary/10'
                    } ${opt === value ? 'font-semibold text-primary' : ''}`}
                  >
                    <span>{opt}</span>
                    {opt === value && <FiCheck size={14} className="text-primary flex-shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="text-xs text-danger mt-1">{error}</p>}
    </div>
  )
}
