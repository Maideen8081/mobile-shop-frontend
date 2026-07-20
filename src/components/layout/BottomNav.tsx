import { useLocation, useNavigate } from 'react-router-dom'
import { FiHome, FiPackage, FiUsers, FiTool, FiSettings } from 'react-icons/fi'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: FiHome, path: '/dashboard' },
  { id: 'products', label: 'Products', icon: FiPackage, path: '/products' },
  { id: 'crm', label: 'CRM', icon: FiUsers, path: '/customer-dashboard' },
  { id: 'repairs', label: 'Repairs', icon: FiTool, path: '/repair-dashboard' },
  { id: 'settings', label: 'Settings', icon: FiSettings, path: '/business-settings' },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-surface-light border-t border-border">
      <div className="flex items-center justify-around px-2 py-1.5">
        {navItems.map(item => {
          const Icon = item.icon
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-lg transition-all relative`}
            >
              <span className="relative">
                <Icon size={20} className={active ? 'text-primary' : 'text-text-label'} />
              </span>
              <span className={`relative text-[10px] font-medium ${active ? 'text-primary' : 'text-text-label'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
