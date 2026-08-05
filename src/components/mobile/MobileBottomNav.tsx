import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Smartphone, Wrench, LayoutGrid, User, Package } from 'lucide-react'

const tabs = [
  { name: 'Home', icon: Home, to: '/' },
  { name: 'Products', icon: LayoutGrid, to: '/collection/all' },
  { name: 'Phones', icon: Smartphone, to: '/phones' },
  { name: 'My Orders', icon: Package, to: '/orders' },
  { name: 'My Repairs', icon: Wrench, to: '/my-repairs' },
  { name: 'Profile', icon: User, to: '/profile' },
]

export default function MobileBottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isActive = (to: string) => (to === '/' ? pathname === '/' : pathname.startsWith(to.split('/').slice(0, 2).join('/')))

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-[480px] px-3 pb-[calc(env(safe-area-inset-bottom)+10px)] pt-2 pointer-events-none">
      <div
        className="pointer-events-auto flex items-center justify-around rounded-[26px] px-1.5 py-1.5 shadow-[0_12px_34px_rgba(15,23,42,0.18)] border border-white/60"
        style={{ background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(14px)' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = isActive(tab.to)
          return (
            <button
              key={tab.name}
              onClick={() => navigate(tab.to)}
              aria-label={tab.name}
              className="flex flex-col items-center gap-0.5 py-1 px-1.5 min-w-[42px] active:scale-90 transition relative"
            >
              <span
                className={`w-12 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${active ? 'bg-[#CB202D] text-white shadow-[0_6px_16px_rgba(203,32,45,0.45)]' : 'text-[#9CA3AF]'}`}
              >
                <Icon size={19} />
              </span>
              <span className={`text-[8px] font-semibold transition-colors ${active ? 'text-[#CB202D]' : 'text-[#9CA3AF]'}`}>
                {tab.name}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
