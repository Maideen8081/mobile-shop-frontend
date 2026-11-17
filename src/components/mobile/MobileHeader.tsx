import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Bell, ShoppingBag, Heart, Search, Mic, QrCode, Camera, UserRound } from 'lucide-react'
import { authService } from '../../services/authService'
import { getWishlistCount } from '../../utils/wishlist'
import { cartService } from '../../services/cartService'

function greeting(): string {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

/** City from the shopper's saved default address, if any. */
function savedCity(): string {
  try {
    const list = JSON.parse(localStorage.getItem('phonehub_addresses') || '[]')
    if (!Array.isArray(list) || !list.length) return ''
    const a = list.find((x: any) => x?.isDefault || x?.is_default) || list[0]
    return [a?.city, a?.zipCode || a?.pincode].filter(Boolean).join(' ')
  } catch {
    return ''
  }
}

export default function MobileHeader() {
  const navigate = useNavigate()
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [location] = useState(savedCity)
  const [userName, setUserName] = useState('')
  const isLoggedIn = authService.isAuthenticated()

  useEffect(() => {
    const updateCart = () => setCartCount(cartService.getCachedCartCount())
    const updateWishlist = () => {
      setWishlistCount(getWishlistCount())
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
        style={{ background: 'linear-gradient(135deg,#0f3b2c 0%,#18503c 100%)', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
      >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="w-11 h-11 rounded-full border-2 border-white/40 bg-white/10 flex items-center justify-center flex-shrink-0" aria-hidden="true">
            <UserRound size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-micro text-white/75 leading-tight">{greeting()} 👋</p>
            <p className="text-body font-bold leading-tight truncate">{displayName}</p>
            <button
              onClick={() => navigate(isLoggedIn ? '/profile/addresses' : '/login')}
              className="flex items-center gap-0.5 min-w-0 min-h-[24px] active:opacity-70 mt-1"
              aria-label={location ? `Delivery location: ${location}. Change` : 'Set delivery location'}
            >
              <MapPin size={12} className="text-[#dfe8b4] flex-shrink-0" />
              <span className="text-micro text-white/80 font-medium truncate max-w-[130px]">{location ? `Deliver to ${location}` : 'Set location'}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button onClick={() => navigate('/notifications')} aria-label="Notifications" className={iconBtn}>
            <Bell size={18} />
          </button>
          <button onClick={() => navigate('/wishlist')} aria-label="Wishlist" className={iconBtn}>
            <Heart size={18} />
            {wishlistCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#0f3b2c] text-white text-micro font-bold flex items-center justify-center">
                {badge(wishlistCount)}
              </span>
            )}
          </button>
          <button onClick={() => navigate('/cart')} aria-label="Cart" className={iconBtn}>
            <ShoppingBag size={18} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-white text-[#0f3b2c] text-micro font-bold flex items-center justify-center">
                {badge(cartCount)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Corner fills — cover the rounded-bottom gaps so scrolling content never shows through */}
      <span className="absolute bottom-0 left-0 w-[30px] h-[30px]" style={{ background: 'linear-gradient(135deg,#0f3b2c 0%,#18503c 100%)' }} />
      <span className="absolute bottom-0 right-0 w-[30px] h-[30px]" style={{ background: 'linear-gradient(135deg,#0f3b2c 0%,#18503c 100%)' }} />
      </header>

      {/* Floating search bar overlapping header bottom (outside header so it isn't clipped) */}
      <form
        onSubmit={(e) => { e.preventDefault(); navigate('/search') }}
        className="absolute left-4 right-4 -bottom-6 flex items-center gap-2 px-4 h-12 rounded-full bg-white z-50"
      >
        <Search size={20} className="text-[#0f3b2c] shrink-0" />
        <input
          readOnly
          onFocus={() => navigate('/search')}
          onClick={() => navigate('/search')}
          placeholder="Search mobiles, accessories..."
          aria-label="Search products"
          className="flex-1 bg-transparent text-sm text-[#0f3b2c] placeholder:text-[#5d6762] outline-none min-w-0 cursor-pointer"
        />
        <button type="button" aria-label="Voice search" onClick={() => navigate('/search')} className="w-9 h-9 flex items-center justify-center text-[#0f3b2c] active:scale-90 transition"><Mic size={17} /></button>
        <button type="button" aria-label="Scan QR" onClick={() => navigate('/search')} className="w-9 h-9 flex items-center justify-center text-[#0f3b2c] active:scale-90 transition"><QrCode size={17} /></button>
        <button type="button" aria-label="Camera search" onClick={() => navigate('/search')} className="w-9 h-9 flex items-center justify-center text-[#0f3b2c] active:scale-90 transition"><Camera size={17} /></button>
      </form>
    </div>
  )
}
