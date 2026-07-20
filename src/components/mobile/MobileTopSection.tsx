import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, ShoppingBag, Bell, Search } from 'lucide-react'

export default function MobileTopSection({
  title,
  subtitle,
  onBack,
  icon = 'cart',
  showSearch = false,
}: {
  title: string
  subtitle?: string
  onBack?: () => void
  icon?: 'cart' | 'wishlist'
  showSearch?: boolean
}) {
  const navigate = useNavigate()
  const handleBack = onBack ?? (() => navigate(-1))
  const Icon = icon === 'wishlist' ? Heart : ShoppingBag

  return (
    <div className="relative z-30 w-full">
      <header
        className="relative w-full px-4 pt-3 pb-12 text-white overflow-hidden"
        style={{
          background: 'linear-gradient(135deg,#6C3BFF 0%,#4B2ECC 100%)',
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
        }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={handleBack}
            aria-label="Back"
            className="w-9 h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center active:scale-90 transition flex-shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-[18px] font-bold leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-[11px] text-white/80 mt-0.5 truncate">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={() => navigate('/notifications')} aria-label="Notifications" className="relative w-9 h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center active:scale-90 transition">
              <Bell size={17} />
              <span className="absolute top-1.5 right-2 w-2 h-2 bg-[#22C55E] rounded-full ring-2 ring-[#4B2ECC]" />
            </button>
            <div className="w-9 h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center">
              <Icon size={17} fill="white" />
            </div>
          </div>
        </div>

        {/* Corner fills — cover rounded-bottom gaps so content never shows through */}
        <span className="absolute bottom-0 left-0 w-[30px] h-[30px]" style={{ background: 'linear-gradient(135deg,#6C3BFF 0%,#4B2ECC 100%)' }} />
        <span className="absolute bottom-0 right-0 w-[30px] h-[30px]" style={{ background: 'linear-gradient(135deg,#6C3BFF 0%,#4B2ECC 100%)' }} />
      </header>

      {showSearch && (
        <form
          onSubmit={(e) => { e.preventDefault(); navigate('/search') }}
          className="absolute left-4 right-4 -bottom-7 flex items-center gap-2 px-3 h-14 rounded-2xl bg-white/85 backdrop-blur-xl shadow-[0_12px_30px_rgba(108,59,255,0.20)] z-50"
        >
          <Search size={20} className="text-[#6C3BFF] shrink-0" />
          <input
            placeholder="Search mobiles, accessories..."
            aria-label="Search products"
            className="flex-1 bg-transparent text-sm text-[#1F2937] placeholder:text-gray-400 outline-none min-w-0"
          />
        </form>
      )}
    </div>
  )
}
