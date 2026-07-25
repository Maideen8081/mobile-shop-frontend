import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  Search,
  Heart,
  ShoppingBag,
  SlidersHorizontal,
} from 'lucide-react'
import { getImageUrl } from './helpers'
import { FALLBACK_IMG } from './fallback'

const CATEGORY_ICONS: Record<string, string> = {
  Smartphones: '📱', Phone: '📱', Phones: '📱',
  Earbuds: '🎧', Audio: '🎧', Headphones: '🎧',
  Watches: '⌚', Wearables: '⌚', Watch: '⌚',
  Laptops: '💻', Laptop: '💻', Computer: '💻',
  'Power Banks': '🔋', Powerbank: '🔋', Power: '🔋',
  Chargers: '🔌', Charger: '🔌',
  Gaming: '🎮',
  Cameras: '📷', Camera: '📷',
  Storage: '💾',
  Monitors: '🖥',
}

interface CategoryItem {
  name: string
  count?: number
  image?: string
}

interface PremiumMobileHeaderProps {
  title: string
  showBack?: boolean
  showFilter?: boolean
  filterCount?: number
  onFilterClick?: () => void
  showSearch?: boolean
  onSearchClick?: () => void
  cartCount?: number
  wishlistCount?: number
  categories?: CategoryItem[]
  activeCategory?: string
  onCategoryClick?: (name: string) => void
}

export default function PremiumMobileHeader({
  title,
  showBack = true,
  showFilter = true,
  filterCount = 0,
  onFilterClick,
  showSearch = true,
  onSearchClick,
  cartCount = 0,
  wishlistCount = 0,
  categories = [],
  activeCategory = 'all',
  onCategoryClick,
}: PremiumMobileHeaderProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <header className="sticky top-0 z-50 overflow-x-hidden">
      <style>{`
        .header-wrap {
          background: rgba(255, 255, 255, 0.94);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-bottom: 1px solid rgba(226, 232, 240, 0.6);
        }
        .icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          background: rgba(254, 226, 230, 0.9);
          border: 1px solid rgba(253, 221, 221, 0.8);
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .icon-btn:active {
          transform: scale(0.92);
          background: rgba(203, 32, 45, 0.12);
        }
        .icon-btn-red {
          width: 40px;
          height: 40px;
          border-radius: 14px;
          background: #CB202D;
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(203, 32, 45, 0.3);
        }
        .icon-btn-red:active {
          transform: scale(0.92);
          background: #A81D2A;
        }
        .filter-pill {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 40px;
          padding: 0 12px;
          border-radius: 14px;
          background: #CB202D;
          color: white;
          gap: 5px;
          transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
          position: relative;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(203, 32, 45, 0.3);
        }
        .filter-pill:active {
          transform: scale(0.92);
          background: #A81D2A;
        }
        .filter-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 9px;
          background: linear-gradient(135deg, #CB202D, #FF5A65);
          color: white;
          font-size: 10px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(203, 32, 45, 0.4);
        }
        .search-bar {
          width: 100%;
          height: 44px;
          border-radius: 14px;
          background: rgba(254, 226, 230, 0.5);
          border: 1px solid rgba(253, 221, 221, 0.8);
          display: flex;
          align-items: center;
          padding: 0 14px;
          gap: 10px;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .search-bar:focus-within {
          background: white;
          border-color: rgba(203, 32, 45, 0.3);
          box-shadow: 0 0 0 3px rgba(203, 32, 45, 0.08);
        }
        .badge {
          transform-origin: 100% 0%;
          animation: badgePop 0.3s cubic-bezier(0.22, 1, 0.36, 1);
        }
        @keyframes badgePop {
          0% { transform: scale(0) translate(50%, -50%); opacity: 0; }
          50% { transform: scale(1.2) translate(50%, -50%); }
          100% { transform: scale(1) translate(50%, -50%); opacity: 1; }
        }
        .title-text {
          background: linear-gradient(135deg, #0F172A 0%, #334155 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <div className="header-wrap">
        <div className="flex items-center justify-between px-4 h-[52px]">
          <div className="flex items-center gap-2 min-w-0">
            {showBack && (
              <button onClick={handleBack} aria-label="Back" className="icon-btn">
                <ChevronLeft size={20} className="text-slate-600" />
              </button>
            )}
            <h1 className="text-lg font-bold title-text tracking-tight truncate">
              {title}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/wishlist')} aria-label="Wishlist" className="icon-btn-red relative">
              <Heart size={18} className="text-white" />
              {wishlistCount > 0 && (
                <span className="badge absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1.5 rounded-full bg-white text-[#CB202D] text-[10px] font-bold flex items-center justify-center">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </button>

            <button onClick={() => navigate('/cart')} aria-label="Cart" className="icon-btn-red relative">
              <ShoppingBag size={18} className="text-white" />
              {cartCount > 0 && (
                <span className="badge absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1.5 rounded-full bg-white text-[#CB202D] text-[10px] font-bold flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>

            {showFilter && (
              <button onClick={onFilterClick} className="filter-pill" aria-label="Filters">
                <SlidersHorizontal size={16} className="text-white" />
                {filterCount > 0 && (
                  <span className="filter-badge">{filterCount}</span>
                )}
              </button>
            )}
          </div>
        </div>

        {showSearch && (
          <div className="px-4 pb-3">
            <div className="search-bar" onClick={() => { if (onSearchClick) onSearchClick(); }}>
              <Search size={18} className="text-slate-400 flex-shrink-0" />
              <span className="text-sm text-slate-400 font-medium select-none">Search phones, brands & more...</span>
            </div>
          </div>
        )}

        {categories.length > 0 && (
          <div
            className="flex gap-3.5 overflow-x-auto px-4 pb-3 snap-x snap-mandatory"
            style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
          >
            {categories.map((cat) => {
              const img = getImageUrl(cat.image)
              const active = activeCategory === cat.name
              return (
                <button
                  key={cat.name}
                  onClick={() => onCategoryClick?.(cat.name)}
                  className="snap-start flex-shrink-0 w-[76px] flex flex-col items-center gap-1.5 active:scale-95 transition"
                >
                  <div
                    className={`w-[64px] h-[64px] rounded-full flex items-center justify-center transition-all duration-300 ${active ? 'scale-105' : ''}`}
                    style={active
                      ? { background: 'linear-gradient(135deg,#CB202D,#A81D2A)', boxShadow: '0 8px 20px rgba(203,32,45,0.35)' }
                      : { background: '#FFFFFF', boxShadow: '0 4px 14px rgba(31,41,55,0.07)' }}
                  >
                    {img ? (
                      <img src={img} alt={cat.name} loading="lazy" className="w-full h-full object-cover rounded-full" onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMG }} />
                    ) : (
                      <span className="text-[24px] leading-none">{CATEGORY_ICONS[cat.name] || '🛍️'}</span>
                    )}
                  </div>
                  <span className={`text-[10px] text-center leading-tight max-w-[72px] truncate font-semibold ${active ? 'text-[#CB202D]' : 'text-[#1F2937]'}`}>
                    {cat.name}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </header>
  )
}
