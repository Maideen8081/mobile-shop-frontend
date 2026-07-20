import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSearch, FiChevronDown, FiCheck } from 'react-icons/fi'

interface FilterBarProps {
  search: string
  onSearchChange: (v: string) => void
  filterCategory: string
  onFilterCategoryChange: (v: string) => void
  categories: string[]
}

function CategoryDropdown({ value, onChange, categories }: { value: string; onChange: (v: string) => void; categories: string[] }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [focusedIdx, setFocusedIdx] = useState(-1)

  const filtered = useMemo(() => {
    if (!search) return categories
    return categories.filter((c) => c.toLowerCase().includes(search.toLowerCase()))
  }, [categories, search])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setSearch('')
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (open) { inputRef.current?.focus(); setFocusedIdx(-1) }
  }, [open])

  const select = (opt: string) => {
    onChange(opt); setOpen(false); setSearch('')
  }

  const display = value || 'All Categories'

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="h-11 px-4 pr-10 rounded-xl bg-bg-card border border-border text-sm text-left flex items-center justify-between gap-2 transition-all hover:border-primary/30 focus:border-primary/50 cursor-pointer w-full sm:w-48"
      >
        <span className={`truncate ${value ? 'text-text-primary' : 'text-text-muted'}`}>{display}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
          <FiChevronDown size={14} className="text-text-muted" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scaleY: 0.95 }} animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.95 }} transition={{ duration: 0.15 }}
            className="absolute z-50 top-full mt-1 left-0 right-0 rounded-xl bg-[#0F172A] border border-border shadow-2xl overflow-hidden origin-top min-w-[200px]"
          >
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-surface-lighter">
              <FiSearch size={14} className="text-text-muted flex-shrink-0" />
              <input ref={inputRef} type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories..." className="w-full bg-transparent text-xs text-text-primary outline-none placeholder-text-muted"
              />
            </div>
            <div className="max-h-48 overflow-y-auto">
              {[
                { label: 'All Categories', value: 'all', isAll: true },
                ...filtered.map((c) => ({ label: c, value: c, isAll: false }))
              ].map((opt, i) => (
                <button key={opt.value} type="button" onClick={() => select(opt.value)}
                  onMouseEnter={() => setFocusedIdx(i)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-xs text-left transition-all cursor-pointer ${
                    focusedIdx === i ? 'bg-[#1E293B] text-primary' : 'text-text-secondary hover:bg-[#1E293B]'
                  } ${opt.value === value ? 'font-semibold text-primary' : ''}`}
                >
                  <span>{opt.label}</span>
                  {opt.value === value && <FiCheck size={14} className="text-primary flex-shrink-0" />}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-6 text-center text-xs text-text-muted">No categories found</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FilterBar({ search, onSearchChange, filterCategory, onFilterCategoryChange, categories }: FilterBarProps) {
  const [focused, setFocused] = useState(false)
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      className="flex flex-col sm:flex-row gap-3"
    >
      <div className={`flex-1 relative transition-all duration-300 ${focused ? 'scale-[1.01]' : ''}`}>
        <FiSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
        <input type="text" placeholder="Search products..." value={search} onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="w-full h-11 pl-10 pr-4 rounded-xl bg-bg-card border border-border text-sm text-text-primary placeholder-text-muted outline-none transition-all focus:border-primary/50 focus:shadow-[0_0_0_4px_rgba(139,92,246,0.08)]"
        />
      </div>
      <div className="flex gap-2">
        <CategoryDropdown value={filterCategory} onChange={onFilterCategoryChange} categories={categories} />
        <select className="h-11 px-4 rounded-xl bg-bg-card border border-border text-sm text-text-secondary outline-none appearance-none cursor-pointer transition-all focus:border-primary/50">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="price-low">Price: Low</option>
          <option value="price-high">Price: High</option>
        </select>
      </div>
    </motion.div>
  )
}
