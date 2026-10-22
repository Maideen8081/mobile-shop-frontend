import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { FiBell, FiChevronDown, FiMail, FiMenu, FiPlus, FiSearch, FiCornerDownLeft, FiPackage, FiTool, FiFolder, FiLogOut, FiExternalLink } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import Sidebar, { allNavItems } from './Sidebar'

interface PageLayoutProps {
  children: ReactNode
  title?: string
}

const quickCreate = [
  { label: 'Product', hint: 'Add to catalog', icon: FiPackage, path: '/admin/products/new' },
  { label: 'Repair ticket', hint: 'Walk-in customer', icon: FiTool, path: '/admin/new-repair' },
  { label: 'Category', hint: 'Organise catalog', icon: FiFolder, path: '/admin/categories/new' },
]

function useOutsideClose(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])
  return ref
}

function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  useLockBodyScroll(open)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)

  const items = useMemo(() => {
    const all = [
      ...allNavItems.map((i) => ({ id: i.id, label: i.label, group: 'Go to', path: i.path, icon: i.icon, keywords: i.keywords ?? '' })),
      ...quickCreate.map((q) => ({ id: `new-${q.label}`, label: `New ${q.label.toLowerCase()}`, group: 'Create', path: q.path, icon: q.icon, keywords: 'add create new' })),
    ]
    const q = query.trim().toLowerCase()
    return q ? all.filter((i) => `${i.label} ${i.keywords}`.toLowerCase().includes(q)) : all
  }, [query])

  useEffect(() => {
    if (open) {
      setQuery('')
      setIndex(0)
    }
  }, [open])
  useEffect(() => setIndex(0), [query])

  const run = (path: string) => {
    onClose()
    navigate(path)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[12vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-[#0c111d]/50 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Jump to"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-[var(--shadow-pop)] overflow-hidden ring-1 ring-black/5"
          >
            <div className="flex items-center gap-3 px-4 border-b border-border-light">
              <FiSearch className="text-text-muted" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => Math.min(i + 1, items.length - 1)) }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => Math.max(i - 1, 0)) }
                  if (e.key === 'Enter' && items[index]) run(items[index].path)
                  if (e.key === 'Escape') onClose()
                }}
                placeholder="Search pages and actions…"
                className="flex-1 h-14 text-[15px] !border-0 !shadow-none !rounded-none bg-transparent outline-none"
              />
              <kbd className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-surface-lighter text-text-label">ESC</kbd>
            </div>
            <div className="max-h-[50vh] overflow-y-auto p-2">
              {items.length === 0 && <p className="px-3 py-8 text-center text-sm text-text-label">No matches for “{query}”</p>}
              {items.map((item, i) => {
                const Icon = item.icon
                const showGroup = i === 0 || items[i - 1].group !== item.group
                return (
                  <div key={item.id}>
                    {showGroup && <p className="px-3 pt-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">{item.group}</p>}
                    <button
                      type="button"
                      onMouseEnter={() => setIndex(i)}
                      onClick={() => run(item.path)}
                      className={`w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm text-left ${i === index ? 'bg-surface-hover text-text-primary' : 'text-text-secondary'}`}
                    >
                      <Icon size={16} className={i === index ? 'text-primary' : 'text-text-muted'} />
                      <span className="flex-1">{item.label}</span>
                      {i === index && <FiCornerDownLeft size={14} className="text-text-muted" />}
                    </button>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function PageLayout({ children, title }: PageLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, adminLogout } = useAuth()
  const adminName = user?.fullName?.trim() || user?.email?.split('@')[0] || 'Admin'
  const initial = adminName.charAt(0).toUpperCase()

  const userRef = useOutsideClose(userOpen, () => setUserOpen(false))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const current = allNavItems.find((i) => location.pathname === i.path || location.pathname.startsWith(i.path + '/'))
  const pageTitle = title || current?.label || 'Dashboard'

  useEffect(() => {
    document.title = `${pageTitle} · MobileShop Admin`
  }, [pageTitle])

  const iconBtn = (active: boolean) =>
    `relative w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
      active ? 'bg-white text-primary shadow-sm' : 'text-text-secondary hover:bg-white hover:text-primary'
    }`

  return (
    <div className="admin-theme min-h-screen bg-bg">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />

      <div className="lg:ml-64 min-h-screen">
        <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur-xl">
          <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 lg:px-10 h-20 max-w-[1600px] mx-auto">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-text-secondary hover:bg-white"
              aria-label="Open menu"
            >
              <FiMenu size={20} />
            </button>

            <button
              type="button"
              onClick={() => setCommandOpen(true)}
              className="flex-1 sm:flex-none flex items-center gap-3 h-11 sm:w-[min(470px,45vw)] px-5 rounded-full bg-white text-sm text-text-muted shadow-[0_1px_2px_rgba(16,24,40,0.04)] ring-1 ring-inset ring-[#eceef2] hover:ring-border-dark transition"
            >
              <FiSearch size={16} className="text-text-label" />
              <span className="flex-1 text-left">Search</span>
              <kbd className="hidden md:inline text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-surface-lighter text-text-label">⌘K</kbd>
            </button>

            <div className="flex-1 hidden sm:block" />

            <button
              type="button"
              onClick={() => navigate('/admin/user-bookings')}
              className={iconBtn(location.pathname === '/admin/user-bookings')}
              aria-label="Online bookings"
              title="Online bookings"
            >
              <FiMail size={19} />
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/online-orders')}
              className={`${iconBtn(location.pathname === '/admin/online-orders')} hidden sm:flex`}
              aria-label="Online orders"
              title="Online orders"
            >
              <FiBell size={19} />
            </button>

            <div className="relative" ref={userRef}>
              <button
                type="button"
                onClick={() => setUserOpen((o) => !o)}
                aria-expanded={userOpen}
                aria-label="Account menu"
                className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-full hover:bg-white transition-colors"
              >
                <span className="w-10 h-10 rounded-full bg-gradient-to-br from-[#e2333f] to-[#a91b27] text-white text-sm font-semibold flex items-center justify-center ring-2 ring-white shadow-sm shrink-0">
                  {initial}
                </span>
                <span className="hidden md:block text-left min-w-0 max-w-[180px]">
                  <span className="block text-sm font-semibold text-text-primary truncate">{adminName}</span>
                  <span className="block text-xs text-text-label truncate">{user?.email ?? 'Administrator'}</span>
                </span>
                <FiChevronDown size={16} className={`hidden md:block text-text-label transition-transform ${userOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {userOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.12 }}
                    className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-[var(--shadow-pop)] ring-1 ring-black/5 z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-border-light md:hidden">
                      <p className="text-sm font-semibold text-text-primary truncate">{adminName}</p>
                      <p className="text-xs text-text-label truncate">{user?.email}</p>
                    </div>
                    <div className="p-1.5">
                      {quickCreate.map((q) => (
                        <button
                          key={q.label}
                          type="button"
                          onClick={() => { setUserOpen(false); navigate(q.path) }}
                          className="w-full flex items-center gap-2.5 px-2.5 h-9 rounded-lg text-sm text-text-secondary hover:bg-surface-hover"
                        >
                          <FiPlus size={15} /> New {q.label.toLowerCase()}
                        </button>
                      ))}
                      <div className="my-1 border-t border-border-light" />
                      <button
                        type="button"
                        onClick={() => window.open('/home', '_blank', 'noopener')}
                        className="w-full flex items-center gap-2.5 px-2.5 h-9 rounded-lg text-sm text-text-secondary hover:bg-surface-hover"
                      >
                        <FiExternalLink size={15} /> View storefront
                      </button>
                      <button
                        type="button"
                        onClick={async () => { await adminLogout(); navigate('/admin/login', { replace: true }) }}
                        className="w-full flex items-center gap-2.5 px-2.5 h-9 rounded-lg text-sm text-danger hover:bg-[#fef3f2]"
                      >
                        <FiLogOut size={15} /> Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-10 pt-4 pb-12 max-w-[1600px] mx-auto animate-admin-in">{children}</main>
      </div>
    </div>
  )
}
