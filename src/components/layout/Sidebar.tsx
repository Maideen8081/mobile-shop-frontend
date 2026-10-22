import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import type { ComponentType } from 'react'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'
import { useAuth } from '../../context/AuthContext'
import {
  FiGrid, FiPackage, FiFolder, FiTool, FiPlusCircle, FiUsers,
  FiShoppingCart, FiSmartphone, FiRepeat, FiLogOut, FiInbox, FiX,
} from 'react-icons/fi'

export interface NavItem {
  id: string
  label: string
  icon: ComponentType<{ size?: number; className?: string }>
  path: string
  keywords?: string
}

export const navSections: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [{ id: 'dashboard', label: 'Dashboard', icon: FiGrid, path: '/admin/dashboard', keywords: 'home stats kpi' }],
  },
  {
    label: 'Catalog',
    items: [
      { id: 'products', label: 'Product', icon: FiPackage, path: '/admin/products', keywords: 'inventory stock variants' },
      { id: 'categories', label: 'Category', icon: FiFolder, path: '/admin/categories', keywords: 'sub categories' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { id: 'online-orders', label: 'Order', icon: FiShoppingCart, path: '/admin/online-orders', keywords: 'online orders shipping' },
      { id: 'customer-list', label: 'Customer', icon: FiUsers, path: '/admin/customer-list', keywords: 'users shoppers' },
      { id: 'trade-in-management', label: 'Trade-in', icon: FiRepeat, path: '/admin/trade-in-management', keywords: 'exchange buyback' },
    ],
  },
  {
    label: 'Service',
    items: [
      { id: 'repair-dashboard', label: 'Repairs', icon: FiTool, path: '/admin/repair-dashboard', keywords: 'tickets workshop' },
      { id: 'user-bookings', label: 'Online booking', icon: FiInbox, path: '/admin/user-bookings', keywords: 'repair requests' },
      { id: 'new-repair', label: 'New repair ticket', icon: FiPlusCircle, path: '/admin/new-repair', keywords: 'create walk-in' },
    ],
  },
]

export const allNavItems = navSections.flatMap((s) => s.items)

interface SidebarProps {
  mobileOpen: boolean
  setMobileOpen: (open: boolean) => void
}

export default function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
  useLockBodyScroll(mobileOpen)
  const location = useLocation()
  const navigate = useNavigate()
  const { adminLogout } = useAuth()

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/')

  const go = (path: string) => {
    navigate(path)
    setMobileOpen(false)
  }

  const sidebarContent = (
    <div className="admin-sidebar flex flex-col h-full w-64 bg-white border-r border-[#eceef2]">
      <div className="flex items-center gap-2.5 px-7 h-24 shrink-0">
        <div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(140deg,#e2333f 0%,#a91b27 100%)', boxShadow: '0 6px 14px -4px rgba(203,32,45,0.5)' }}
        >
          <FiSmartphone size={18} className="text-white" />
        </div>
        <span className="text-[22px] font-bold text-text-primary tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>
          Mobile<span className="text-primary">Shop</span>
        </span>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden ml-auto w-8 h-8 rounded-lg flex items-center justify-center text-text-label hover:bg-surface-hover hover:text-text-primary"
          aria-label="Close menu"
        >
          <FiX size={18} />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-5 pb-4" aria-label="Admin">
        {navSections.map((section, si) => (
          <div key={section.label} className={si > 0 ? 'mt-3 pt-3 border-t border-[#f2f3f5]' : ''}>
            {section.items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => go(item.path)}
                  aria-current={active ? 'page' : undefined}
                  className={`w-full flex items-center gap-3.5 h-11 px-4 rounded-[10px] text-[15px] transition-all mb-1 ${
                    active
                      ? 'bg-primary text-white font-medium shadow-[0_10px_20px_-8px_rgba(203,32,45,0.6)]'
                      : 'text-[#344054] hover:bg-[#fdf2f3] hover:text-primary'
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="px-5 pb-7 pt-3">
        <button
          type="button"
          onClick={async () => {
            await adminLogout()
            navigate('/admin/login', { replace: true })
          }}
          className="w-full flex items-center gap-3.5 h-11 px-4 rounded-[10px] text-[15px] text-[#344054] hover:bg-[#fdf2f3] hover:text-primary transition-colors"
        >
          <FiLogOut size={18} /> Log out
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="fixed left-0 top-0 bottom-0 z-40 hidden lg:block w-64">{sidebarContent}</aside>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-[#0c111d]/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute left-0 top-0 bottom-0 w-64 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {sidebarContent}
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
