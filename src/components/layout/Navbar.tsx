import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiMenu, FiSearch, FiBell, FiPlus, FiChevronDown,
  FiPackage, FiTool, FiUserPlus, FiFileText, FiFolder,
  FiShoppingBag, FiClock, FiAlertTriangle,
  FiSettings, FiHelpCircle, FiLogOut, FiUser,
  FiMessageCircle, FiCommand,
} from 'react-icons/fi'
import SearchModal from '../ui/SearchModal'

interface NavbarProps {
  setMobileOpen: (open: boolean) => void
  title?: string
}

const notifications = [
  { id: 1, type: 'order', text: 'New order #ORD-2026-0428', time: '2 min ago', unread: true, icon: FiShoppingBag, color: 'text-primary', bg: 'bg-primary/10' },
  { id: 2, type: 'repair', text: 'iPhone 15 Pro repair completed', time: '15 min ago', unread: true, icon: FiTool, color: 'text-secondary', bg: 'bg-secondary/10' },
  { id: 3, type: 'stock', text: 'Samsung S25 Ultra low stock (3 left)', time: '1 hr ago', unread: false, icon: FiAlertTriangle, color: 'text-warning', bg: 'bg-warning/10' },
  { id: 4, type: 'warranty', text: '5 warranties expiring this week', time: '3 hrs ago', unread: false, icon: FiClock, color: 'text-primary', bg: 'bg-primary/10' },
  { id: 5, type: 'customer', text: 'New customer registered: Priya K', time: '5 hrs ago', unread: false, icon: FiUserPlus, color: 'text-success', bg: 'bg-success/10' },
]

export default function Navbar({ setMobileOpen, title = 'Dashboard' }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)
  const quickAddRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false)
      if (quickAddRef.current && !quickAddRef.current.contains(e.target as Node)) setQuickAddOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const quickAddItems = [
    { label: 'Add Product', icon: FiPackage, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Add Repair Ticket', icon: FiTool, color: 'text-secondary', bg: 'bg-secondary/10' },
    { label: 'Add Customer', icon: FiUserPlus, color: 'text-success', bg: 'bg-success/10' },
    { label: 'Create Invoice', icon: FiFileText, color: 'text-warning', bg: 'bg-warning/10' },
    { label: 'Add Category', icon: FiFolder, color: 'text-primary', bg: 'bg-primary/10' },
  ]

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <>
      <nav className="sticky top-0 z-30">
        <div className={`transition-all duration-200 ${
          scrolled
            ? 'bg-surface/90 backdrop-blur-xl border-b border-border shadow-sm'
            : 'bg-surface/50'
        }`}>
          <div className="px-4 lg:px-6 h-14 lg:h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:bg-white/[0.04] transition-colors flex-shrink-0"
                aria-label="Open sidebar"
              >
                <FiMenu size={19} />
              </button>

              <div className="hidden lg:flex items-center gap-2 text-xs text-text-muted min-w-0">
                <span className="hover:text-text-secondary transition-colors cursor-pointer whitespace-nowrap">Dashboard</span>
                <span className="text-border-light mx-0.5">/</span>
                <span className="text-text-primary font-medium truncate">{title}</span>
              </div>

              <h1 className="lg:hidden text-sm font-semibold text-text-primary truncate">{title}</h1>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-6">
              <button
                onClick={() => setSearchOpen(true)}
                className="w-full flex items-center gap-3 h-9 px-4 rounded-lg bg-white/[0.04] border border-border hover:bg-white/[0.06] hover:border-border-light transition-all group cursor-pointer"
              >
                <FiSearch size={14} className="text-text-label group-hover:text-text-muted transition-colors flex-shrink-0" />
                <span className="text-sm text-text-label group-hover:text-text-muted transition-colors">Search anything...</span>
                <div className="ml-auto flex items-center gap-1 text-[10px] font-medium text-text-label bg-white/[0.04] rounded px-1.5 py-1 border border-border flex-shrink-0">
                  <FiCommand size={10} />
                  <span>K</span>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setSearchOpen(true)}
                className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:bg-white/[0.04] transition-colors"
                aria-label="Search"
              >
                <FiSearch size={18} />
              </button>

              <div ref={quickAddRef} className="relative">
                <button
                  onClick={() => setQuickAddOpen(!quickAddOpen)}
                  className="hidden sm:flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary-hover transition-all"
                  aria-label="Quick add"
                >
                  <FiPlus size={14} />
                  <span className="hidden lg:inline">Quick Add</span>
                </button>

                <AnimatePresence>
                  {quickAddOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-surface-lighter border border-border shadow-dropdown rounded-lg overflow-hidden z-50"
                    >
                      <div className="p-1.5">
                        <p className="px-3 py-1.5 text-[10px] font-medium text-text-label uppercase tracking-wider">Quick Actions</p>
                        {quickAddItems.map((item) => (
                          <button
                            key={item.label}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-white/[0.04] transition-colors text-left group cursor-pointer"
                          >
                            <div className={`w-7 h-7 rounded-md ${item.bg} flex items-center justify-center`}>
                              <item.icon size={14} className={item.color} />
                            </div>
                            <span className="text-sm text-text-secondary group-hover:text-text-primary">{item.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:bg-white/[0.04] transition-colors" aria-label="Messages">
                <FiMessageCircle size={18} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-success ring-2 ring-surface" />
              </button>

              <div ref={notifRef} className="relative">
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className="relative w-9 h-9 rounded-lg flex items-center justify-center text-text-muted hover:bg-white/[0.04] transition-colors"
                  aria-label="Notifications"
                >
                  <FiBell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-surface">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-2 w-80 lg:w-96 bg-surface-lighter border border-border shadow-dropdown rounded-lg overflow-hidden z-50"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
                        <span className="text-[11px] font-medium text-primary hover:text-primary-hover cursor-pointer">Mark all read</span>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.map((n) => (
                          <button
                            key={n.id}
                            className={`w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-white/[0.04] transition-colors group ${
                              n.unread ? 'bg-primary/[0.03]' : ''
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg ${n.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                              <n.icon size={15} className={n.color} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${n.unread ? 'font-medium text-text-primary' : 'text-text-secondary'}`}>{n.text}</p>
                              <p className="text-[11px] text-text-label mt-0.5">{n.time}</p>
                            </div>
                            {n.unread && (
                              <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="px-4 py-2.5 border-t border-border text-center">
                        <span className="text-xs font-medium text-text-label hover:text-text-secondary cursor-pointer">View all notifications</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div ref={profileRef} className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-2 pr-1.5 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors group cursor-pointer"
                  aria-label="Profile"
                >
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    MK
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-medium text-text-primary leading-tight">Maideen</p>
                    <p className="text-[10px] text-text-label leading-tight">Admin</p>
                  </div>
                  <FiChevronDown size={14} className="hidden lg:block text-text-label group-hover:text-text-muted transition-colors" />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 top-full mt-2 w-56 bg-surface-lighter border border-border shadow-dropdown rounded-lg overflow-hidden z-50"
                    >
                      <div className="p-3 border-b border-border">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-white text-sm font-bold">
                            MK
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary">Maideen</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-success" />
                              <span className="text-[11px] text-text-label">Online</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-1.5">
                        {[
                          { label: 'Profile', icon: FiUser },
                          { label: 'Settings', icon: FiSettings },
                          { label: 'Help Center', icon: FiHelpCircle },
                        ].map((item) => (
                          <button
                            key={item.label}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-white/[0.04] transition-colors text-left group cursor-pointer"
                          >
                            <item.icon size={15} className="text-text-label group-hover:text-text-muted" />
                            <span className="text-sm text-text-secondary group-hover:text-text-primary">{item.label}</span>
                          </button>
                        ))}
                      </div>
                      <div className="border-t border-border p-1.5">
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-danger/10 transition-colors text-left group cursor-pointer">
                          <FiLogOut size={15} className="text-text-label group-hover:text-danger" />
                          <span className="text-sm text-text-secondary group-hover:text-danger">Log Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  )
}
