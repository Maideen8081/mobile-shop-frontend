import { useState, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import {
  FiHome, FiPackage, FiFolder, FiTool, FiPlus, FiUserCheck,
  FiShoppingBag, FiSearch, FiSmartphone, FiX,
} from 'react-icons/fi'

interface NavItem {
  id: string
  label: string
  icon: string
  path: string
}

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  FiHome, FiPackage, FiFolder, FiTool, FiPlus, FiUserCheck, FiShoppingBag, FiSmartphone,
}

const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'FiHome', path: '/dashboard' },
      { id: 'products', label: 'Products', icon: 'FiPackage', path: '/products' },
      { id: 'categories', label: 'Categories', icon: 'FiFolder', path: '/categories' },
    ],
  },
  {
    label: 'Repairs',
    items: [
      { id: 'new-repair', label: 'New Repair Ticket', icon: 'FiPlus', path: '/new-repair' },
      { id: 'repair-history', label: 'Repair History', icon: 'FiTool', path: '/repair-history' },
    ],
  },
  {
    label: 'Customers',
    items: [
      { id: 'customer-list', label: 'Customers', icon: 'FiUserCheck', path: '/customer-list' },
    ],
  },
  {
    label: 'Orders',
    items: [
      { id: 'online-orders', label: 'Online Orders', icon: 'FiShoppingBag', path: '/online-orders' },
    ],
  },
]

interface SidebarProps {
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

export default function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  useLockBodyScroll(mobileOpen)
  const [searchQuery, setSearchQuery] = useState('')
  const location = useLocation()
  const navigate = useNavigate()

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return navSections
    const q = searchQuery.toLowerCase()
    return navSections
      .map(s => ({ ...s, items: s.items.filter(i => i.label.toLowerCase().includes(q)) }))
      .filter(s => s.items.length > 0)
  }, [searchQuery])

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  const sidebarContent = (
    <div className="flex flex-col h-full w-64 bg-white border-r border-border">
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-sm" style={{ boxShadow: '0 4px 12px rgba(34,197,94,0.35)' }}>
          <FiSmartphone size={18} className="text-white" />
        </div>
        <div>
          <span className="text-base font-bold text-text-primary tracking-tight block leading-tight">MobileShop</span>
          <span className="block text-[10px] font-medium text-text-label -mt-0.5">Admin Console</span>
        </div>
      </div>

      <div className="px-3 mt-3 mb-2">
        <div className="relative">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-label" />
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg bg-surface-lighter border border-border text-sm text-text-primary placeholder-text-label outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/15 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-label hover:text-text-muted">
              <FiX size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-3">
        {filteredSections.map(section => (
          <div key={section.label} className="mb-1">
            <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-text-label">
              {section.label}
            </p>
            {section.items.map(item => {
              const Icon = iconMap[item.icon]
              const active = isActive(item.path)
              return (
                <button
                  key={item.id}
                  onClick={() => { navigate(item.path); setMobileOpen(false) }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 mb-0.5
                    ${active
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
                    }
                  `}
                >
                  <span className={`flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-md transition-all ${active ? 'bg-primary text-white' : ''}`}>
                    {Icon && <Icon size={16} />}
                  </span>
                  <span className="truncate">{item.label}</span>
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-3 pb-4 px-3">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-9 h-9 rounded-full bg-primary/10 text-primary text-sm font-bold flex-shrink-0 flex items-center justify-center">
            M
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">Maideen</p>
            <p className="text-[11px] text-text-label truncate">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <aside className="fixed left-0 top-0 bottom-0 z-40 hidden lg:block w-64">
        {sidebarContent}
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute left-0 top-0 bottom-0 w-64 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {sidebarContent}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
