import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Bell, ShoppingBag, Heart, Search, Mic, QrCode, Camera } from 'lucide-react'
import { authService } from '../../services/authService'
import { cartService } from '../../services/cartService'

export default function MobileHeader() {
  const navigate = useNavigate()
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [location] = useState('Chennai 600001')
  const [userName, setUserName] = useState('')
  const isLoggedIn = authService.isAuthenticated()

  useEffect(() => {
    const updateCart = () => setCartCount(cartService.getCachedCartCount())
    const updateWishlist = () => {
      try { setWishlistCount((JSON.parse(localStorage.getItem('wishlist') || '[]') as number[]).length) } catch { setWishlistCount(0) }
      try {
        const raw = localStorage.getItem('user_profile')
        if (raw) {
          const parsed = JSON.parse(raw)
          setUserName((parsed.fullName || parsed.name || parsed.email || '').split(' ')[0] || '')
        }
      } catch { /* ignore */ }
    }
    updateCart()
    updateWishlist()
    window.addEventListener('cart-updated', updateCart)
    window.addEventListener('wishlist-updated', updateWishlist)
    return () => {
      window.removeEventListener('cart-updated', updateCart)
      window.removeEventListener('wishlist-updated', updateWishlist)
    }
  }, [])

  const badge = (n: number) => (n > 99 ? '99+' : String(n))
  const iconBtn = 'relative w-10 h-10 rounded-full bg-white/15 backdrop-blur flex items-center justify-center active:scale-90 transition'
  const displayName = userName ? userName : (isLoggedIn ? 'Welcome!' : 'Guest')

  return (
    <div className="relative z-50 w-full">
      <header
        className="relative w-full px-4 pt-3 pb-14 text-white overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#CB202D 0%,#A81D2A 100%)', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
      >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <img
            src={isLoggedIn ? 'https://i.pravatar.cc/80?img=12' : 'https://i.pravatar.cc/80?img=5'}
            alt="User"
            className="w-11 h-11 rounded-full border-2 border-white/40 object-cover flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-white/75 leading-tight">Good morning 👋</p>
            <p className="text-[15px] font-bold leading-tight truncate">{displayName}</p>
            <button className="flex items-center gap-0.5 min-w-0 active:opacity-70 mt-1" aria-label="Delivery location">
              <MapPin size={12} className="text-[#4DA3FF] flex-shrink-0" />
              <span className="text-[11px] text-white/80 font-medium truncate max-w-[130px]">Deliver to {location}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => navigate('/notifications')} aria-label="Notifications" className={iconBtn}>
            <Bell size={18} />
            <span className="absolute top-1.5 right-2 w-2 h-2 bg-[#22C55E] rounded-full ring-2 ring-[#A81D2A]" />
          </button>
          <button onClick={() => navigate('/wishlist')} aria-label="Wishlist" className={iconBtn}>
            <Heart size={18} />
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#22C55E] text-white text-[9px] font-bold flex items-center justify-center">
                {badge(wishlistCount)}
              </span>
            )}
          </button>
          <button onClick={() => navigate('/cart')} aria-label="Cart" className={iconBtn}>
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-white text-[#CB202D] text-[9px] font-bold flex items-center justify-center">
                {badge(cartCount)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Corner fills — cover the rounded-bottom gaps so scrolling content never shows through */}
      <span className="absolute bottom-0 left-0 w-[30px] h-[30px]" style={{ background: 'linear-gradient(135deg,#CB202D 0%,#A81D2A 100%)' }} />
      <span className="absolute bottom-0 right-0 w-[30px] h-[30px]" style={{ background: 'linear-gradient(135deg,#CB202D 0%,#A81D2A 100%)' }} />
      </header>

      {/* Floating glassmorphism search bar overlapping header bottom (outside header so it isn't clipped) */}
      <form
        onSubmit={(e) => { e.preventDefault(); navigate('/search') }}
        className="absolute left-4 right-4 -bottom-7 flex items-center gap-2 px-3 h-14 rounded-2xl bg-white/85 backdrop-blur-xl shadow-[0_12px_30px_rgba(203,32,45,0.20)] z-50"
      >
        <Search size={20} className="text-[#CB202D] shrink-0" />
        <input
          readOnly
          onFocus={() => navigate('/search')}
          onClick={() => navigate('/search')}
          placeholder="Search mobiles, accessories..."
          aria-label="Search products"
          className="flex-1 bg-transparent text-sm text-[#1F2937] placeholder:text-gray-400 outline-none min-w-0 cursor-pointer"
        />
        <button type="button" aria-label="Voice search" onClick={() => navigate('/search')} className="w-9 h-9 rounded-full bg-[#FFFBFB] flex items-center justify-center text-[#CB202D] active:scale-90 transition"><Mic size={17} /></button>
        <button type="button" aria-label="Scan QR" onClick={() => navigate('/search')} className="w-9 h-9 rounded-full bg-[#FFFBFB] flex items-center justify-center text-[#CB202D] active:scale-90 transition"><QrCode size={17} /></button>
        <button type="button" aria-label="Camera search" onClick={() => navigate('/search')} className="w-9 h-9 rounded-full bg-[#FFFBFB] flex items-center justify-center text-[#CB202D] active:scale-90 transition"><Camera size={17} /></button>
      </form>
    </div>
  )
}
