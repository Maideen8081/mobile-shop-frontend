import { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import {
  FiSearch, FiCommand, FiTrendingUp, FiClock,
  FiPackage, FiUsers, FiTool, FiShoppingBag, FiSmartphone,
  FiFileText, FiHash,
} from 'react-icons/fi'

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

const categories = [
  { label: 'Products', items: ['iPhone 16 Pro Max', 'Samsung Galaxy S25 Ultra', 'OnePlus 13', 'iPad Air M4', 'AirPods Pro 3'] },
  { label: 'Customers', items: ['Arun Kumar', 'Priya Sharma', 'Rahul Verma', 'Meera Joshi'] },
  { label: 'Repairs', items: ['REP-2026-0428 - iPhone 15 Pro', 'REP-2026-0427 - Galaxy S24', 'REP-2026-0426 - OnePlus 12'] },
  { label: 'Orders', items: ['ORD-2026-0428', 'ORD-2026-0427', 'ORD-2026-0426'] },
]

const quickActions = [
  { label: 'Go to Products', shortcut: 'G P', icon: FiPackage },
  { label: 'New Repair Ticket', shortcut: 'N R', icon: FiTool },
  { label: 'Create Invoice', shortcut: 'N I', icon: FiFileText },
  { label: 'Search by IMEI', shortcut: 'S I', icon: FiHash },
  { label: 'View Dashboard', shortcut: 'G D', icon: FiTrendingUp },
]

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  Products: FiPackage,
  Customers: FiUsers,
  Repairs: FiTool,
  Orders: FiShoppingBag,
}

export default function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useLockBodyScroll(open)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
    }
  }, [open])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const allResults = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    const results: { label: string; type: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = []
    categories.forEach(cat => {
      cat.items.forEach(item => {
        if (item.toLowerCase().includes(q)) {
          results.push({ label: item, type: cat.label, icon: iconMap[cat.label] || FiSmartphone })
        }
      })
    })
    return results
  }, [query])

  const hasResults = query.trim() && allResults.length > 0

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] lg:pt-[12vh] px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-xl bg-surface-lighter rounded-xl shadow-dropdown border border-border overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
              <FiSearch size={17} className="text-text-muted shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => { setQuery(e.target.value); setSelectedIndex(0) }}
                placeholder="Search products, customers, repairs..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-label"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-text-label hover:text-text-muted transition-colors">
                  <FiCommand size={14} />
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-text-label bg-white/[0.04] rounded-md flex-shrink-0 border border-border">
                ESC
              </kbd>
            </div>

            {hasResults ? (
              <div className="p-2 max-h-72 overflow-y-auto">
                <div className="px-3 py-1.5">
                  <span className="text-[11px] font-medium text-text-label uppercase tracking-wider">
                    Results ({allResults.length})
                  </span>
                </div>
                {allResults.map((result, i) => {
                  const Icon = result.icon
                  return (
                    <button
                      key={`${result.type}-${result.label}`}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        i === selectedIndex ? 'bg-primary/10' : 'hover:bg-white/[0.04]'
                      }`}
                      onMouseEnter={() => setSelectedIndex(i)}
                    >
                      <div className="w-7 h-7 rounded-md bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                        <Icon size={14} className="text-text-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-text-primary truncate">{result.label}</p>
                        <p className="text-[10px] text-text-label">{result.type}</p>
                      </div>
                      <kbd className="text-[10px] text-text-label bg-white/[0.04] px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                        ⌘{i + 1}
                      </kbd>
                    </button>
                  )
                })}
              </div>
            ) : query.trim() && !hasResults ? (
              <div className="flex flex-col items-center py-10 text-center">
                <div className="w-12 h-12 rounded-lg bg-white/[0.04] flex items-center justify-center mb-3">
                  <FiSearch size={20} className="text-text-label" />
                </div>
                <p className="text-sm font-medium text-text-secondary">No results found</p>
                <p className="text-xs text-text-label mt-0.5">Try a different search term</p>
              </div>
            ) : (
              <div className="p-3 space-y-3">
                <div>
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <FiClock size={13} className="text-text-label" />
                    <span className="text-[11px] font-medium text-text-label uppercase tracking-wider">Recent</span>
                  </div>
                  {['iPhone 16 Pro Max', 'Galaxy S25 Ultra', 'REP-2026-0428'].map(item => (
                    <button
                      key={item}
                      onClick={() => setQuery(item)}
                      className="w-full flex items-center gap-3 px-2 py-2.5 text-sm text-text-muted hover:text-text-secondary hover:bg-white/[0.04] rounded-lg transition-colors"
                    >
                      <FiClock size={14} className="text-text-label shrink-0" />
                      <span>{item}</span>
                    </button>
                  ))}
                </div>

                <div>
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <FiTrendingUp size={13} className="text-text-label" />
                    <span className="text-[11px] font-medium text-text-label uppercase tracking-wider">Quick Actions</span>
                  </div>
                  {quickActions.map(action => {
                    const Icon = action.icon
                    return (
                      <button
                        key={action.label}
                        className="w-full flex items-center justify-between px-2 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Icon size={14} className="text-text-label shrink-0" />
                          <span className="text-sm text-text-muted">{action.label}</span>
                        </div>
                        <kbd className="text-[10px] text-text-label bg-white/[0.04] px-1.5 py-0.5 rounded font-mono">{action.shortcut}</kbd>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 px-4 py-2.5 border-t border-border bg-white/[0.02]">
              <div className="flex items-center gap-1.5 text-[10px] text-text-label">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-border font-mono">↑↓</kbd>
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-text-label">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-border font-mono">↵</kbd>
                <span>Open</span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-text-label">
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-border font-mono">ESC</kbd>
                <span>Close</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
