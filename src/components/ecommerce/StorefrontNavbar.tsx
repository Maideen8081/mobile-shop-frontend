import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FiSearch, FiHeart, FiShoppingCart, FiMenu, FiX, FiUser, FiLogOut
} from 'react-icons/fi'
import { authService } from '../../services/authService'
import { cartService } from '../../services/cartService'
import { useToast } from '../../context/ToastContext'
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll'

export interface NavItem {
  label: string
  to: string
}

interface StorefrontNavbarProps {
  brand?: string
  navItems?: NavItem[]
  activeLabel?: string
  showSearch?: boolean
  showAuth?: boolean
  transparent?: boolean
  hideOnScroll?: boolean
  absolute?: boolean
  onMenuClick?: () => void
}

export default function StorefrontNavbar({
  brand = 'PhoneFix',
  navItems = [
    { label: 'Home', to: '/' },
    { label: 'Products', to: '/collection/all' },
    { label: 'Phones', to: '/phones' },
    { label: 'Repairs', to: '/repairs' },
    { label: 'Accessories', to: '/accessories' },
    { label: 'Contact', to: '/about' },
  ],
  activeLabel,
  showSearch = true,
  showAuth = true,
  hideOnScroll = false,
  absolute = false,
  onMenuClick,
}: StorefrontNavbarProps) {
  const navigate = useNavigate()
  const showToast = useToast().show
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [navVisible, setNavVisible] = useState(true)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(() => authService.isAuthenticated())
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useLockBodyScroll(showLogoutModal)

  const closeMenu = useCallback(() => setMobileMenuOpen(false), [])

  useEffect(() => {
    const update = () => setIsLoggedIn(authService.isAuthenticated())
    update()
    window.addEventListener('auth-changed', update)
    return () => window.removeEventListener('auth-changed', update)
  }, [])

  useEffect(() => {
    if (!mobileMenuOpen) return
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') closeMenu() }
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu()
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [mobileMenuOpen, closeMenu])

  useEffect(() => {
    const updateCart = () => setCartCount(cartService.getCachedCartCount())
    const updateWishlist = () => {
      try { const stored = JSON.parse(localStorage.getItem('wishlist') || '[]'); setWishlistCount(stored.length) } catch { setWishlistCount(0) }
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

  useEffect(() => {
    if (hideOnScroll) {
      const onScroll = () => setNavVisible(window.scrollY < 100)
      onScroll()
      window.addEventListener('scroll', onScroll, { passive: true })
      return () => window.removeEventListener('scroll', onScroll)
    }
    setNavVisible(true)
  }, [hideOnScroll])

  const baseStyles = `
    @keyframes glowPulse {
      0%, 100% { box-shadow: 0 0 30px rgba(203,32,45,0.4), 0 0 60px rgba(203,32,45,0.1); }
      50% { box-shadow: 0 0 60px rgba(203,32,45,0.7), 0 0 100px rgba(203,32,45,0.2), 0 0 140px rgba(203,32,45,0.1); }
    }
    @keyframes navShine {
      0% { transform: translateX(-100%) skewX(-15deg); }
      100% { transform: translateX(200%) skewX(-15deg); }
    }
    .nav-active-glow {
      animation: glowPulse 4s ease-in-out infinite;
    }
    .nav-icon-btn {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.1);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      color: rgba(255,255,255,0.8);
    }
    .nav-icon-btn:hover {
      background: rgba(203,32,45,0.15);
      transform: scale(1.1);
      color: #ffffff;
    }
    .nav-icon-btn .badge-count {
      position: absolute;
      top: -6px;
      right: -6px;
      min-width: 18px;
      height: 18px;
      border-radius: 999px;
      background: linear-gradient(135deg, #FF4D4D, #FF0000);
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      box-shadow: 0 2px 8px rgba(255,0,0,0.3);
      font-family: 'Inter', sans-serif;
    }
  `

  const sharedContent = (
    <>
      <div
        className="relative"
        style={{
          height: '68px',
          background: 'rgba(20,20,20,0.45)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
          padding: '0 24px',
        }}
      >
        {/* Glass reflection shine */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ borderRadius: '24px', overflow: 'hidden' }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)',
              animation: 'navShine 6s ease-in-out infinite',
            }}
          />
        </div>

        <div className="relative z-10 h-full flex items-center justify-between">
          {/* Left: Logo */}
          <Link
            to="/"
            className="text-2xl font-bold truncate max-w-[200px] bg-gradient-to-r from-[#CB202D] via-[#E53E4E] to-[#CB202D] bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient"
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 700,
              filter: 'drop-shadow(0 0 40px rgba(203,32,45,0.4))',
            }}
          >
            {brand}
          </Link>

          {/* Center: Menu */}
          <nav className="hidden md:flex items-center justify-center gap-8">
            {navItems.map((item) => {
              const isActive = activeLabel
                ? item.label.toLowerCase() === activeLabel.toLowerCase()
                : item.to === '/' ? window.location.pathname === '/' : window.location.pathname.startsWith(item.to)
              return isActive ? (
                <Link
                  key={item.label}
                  to={item.to}
                  className="nav-active-glow font-medium relative"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    fontSize: '15px',
                    background: 'linear-gradient(135deg, #CB202D, #A81D2A)',
                    borderRadius: '999px',
                    padding: '12px 28px',
                    color: '#000000',
                  }}
                >
                  {item.label}
                </Link>
              ) : (
                <Link
                  key={item.label}
                  to={item.to}
                  className="transition-all duration-300 hover:text-[#CB202D]"
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 500,
                    fontSize: '15px',
                    color: 'rgba(255,255,255,0.75)',
                  }}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Right: Icons & Auth */}
          <div className="flex items-center gap-3">
            {showSearch && (
              searchOpen ? (
                <form onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) { navigate(`/collection/all?search=${encodeURIComponent(searchQuery.trim())}`); setSearchOpen(false); setSearchQuery('') } }} className="items-center gap-1 rounded-full px-3 py-1.5 hidden sm:flex" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search..."
                    className="w-28 bg-transparent text-xs text-white/80 placeholder-white/40 outline-none"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                    autoFocus
                  />
                  <button type="submit" className="text-white/60 hover:text-white transition-colors cursor-pointer">
                    <FiSearch size={14} />
                  </button>
                </form>
              ) : (
                <button onClick={() => setSearchOpen(true)} className="nav-icon-btn cursor-pointer">
                  <FiSearch size={16} />
                </button>
              )
            )}
            <Link to="/cart" className="nav-icon-btn relative">
              <FiShoppingCart size={16} />
              {cartCount > 0 && <span className="badge-count">{cartCount > 99 ? '99+' : cartCount}</span>}
            </Link>
            <Link to="/wishlist" className="nav-icon-btn relative">
              <FiHeart size={16} />
              {wishlistCount > 0 && <span className="badge-count">{wishlistCount > 99 ? '99+' : wishlistCount}</span>}
            </Link>
            <Link to="/profile" className="nav-icon-btn hidden sm:flex">
              <FiUser size={16} />
            </Link>
            {showAuth && (
              <>
                {isLoggedIn ? (
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className="hidden sm:inline-flex items-center gap-2 px-7 py-3 text-sm font-semibold rounded-full transition-all duration-300 hover:scale-105 cursor-pointer"
                    style={{
                      background: 'linear-gradient(135deg, #CB202D, #A81D2A)',
                      borderRadius: '999px',
                      boxShadow: '0 0 30px rgba(203,32,45,0.35)',
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600,
                      color: '#ffffff',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.filter = 'none' }}
                  >
                    <FiLogOut size={14} /> Logout
                  </button>
                ) : (
                  <>
                    <Link
                      to="/signup"
                      className="hidden sm:inline-flex items-center px-7 py-3 text-sm font-semibold text-black rounded-full transition-all duration-300 hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, #CB202D, #A81D2A)',
                        borderRadius: '999px',
                        boxShadow: '0 0 40px rgba(203,32,45,0.35)',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      Sign Up
                    </Link>
                    <Link
                      to="/login"
                      className="hidden sm:inline-flex items-center px-7 py-3 text-sm font-medium rounded-full transition-all duration-300 hover:scale-105"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        borderRadius: '999px',
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 500,
                        color: '#ffffff',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    >
                      Login
                    </Link>
                  </>
                )}
              </>
            )}
            <button
              onClick={() => onMenuClick ? onMenuClick() : setMobileMenuOpen(!mobileMenuOpen)}
              className="nav-icon-btn cursor-pointer"
            >
              {mobileMenuOpen ? <FiX size={16} /> : <FiMenu size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Hamburger Dropdown — Orders only */}
      {!onMenuClick && (
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95, y: -8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -8 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="absolute right-0 top-full mt-2 z-50"
              style={{
                minWidth: '260px',
                background: 'rgba(20,20,20,0.85)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.35)',
              }}
            >
              {/* Mobile Search */}
              <form
                onSubmit={(e) => { e.preventDefault(); if (searchQuery.trim()) { navigate(`/collection/all?search=${encodeURIComponent(searchQuery.trim())}`); setSearchQuery(''); setMobileMenuOpen(false) } }}
                className="px-4 pt-3 pb-2"
              >
                <div className="flex items-center gap-2 rounded-full px-3 py-2" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="flex-1 bg-transparent text-xs text-white/80 placeholder-white/40 outline-none"
                    style={{ fontFamily: "'Inter', sans-serif" }}
                  />
                  <button type="submit" className="text-white/60 hover:text-white transition-colors cursor-pointer">
                    <FiSearch size={14} />
                  </button>
                </div>
              </form>
              <Link
                to="/orders"
                className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 transition-all rounded-2xl"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="material-symbols-outlined text-lg">inventory_2</span>
                Orders
              </Link>
              <Link
                to="/my-repairs"
                className="flex items-center gap-3 px-5 py-4 text-sm font-medium text-white/80 hover:text-white hover:bg-white/5 transition-all rounded-2xl"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span className="material-symbols-outlined text-lg">build</span>
                My Repairs
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      )}

    </>
  )

  const logoutModal = (
    <AnimatePresence>
      {showLogoutModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)' }}
          onClick={() => setShowLogoutModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28, mass: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[420px] outline-none"
            role="dialog"
            aria-modal="true"
            aria-label="Confirm logout"
            tabIndex={-1}
          >
            <div
              className="relative overflow-hidden rounded-[22px] p-8"
              style={{
                background: 'linear-gradient(145deg, rgba(25,25,25,0.98), rgba(18,18,18,0.95))',
                backdropFilter: 'blur(32px)',
                border: '1px solid rgba(255,255,255,0.06)',
                boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(203,32,45,0.06)',
              }}
            >
              {/* subtle gradient orbs */}
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-red-500/5 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />

              <div className="relative z-10 text-center">
                {/* Icon */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.7, rotate: -15 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 20, delay: 0.05 }}
                  className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center mx-auto mb-5"
                  style={{ boxShadow: '0 0 40px rgba(203,32,45,0.15)' }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  >
                    <FiLogOut size={26} className="text-red-400" />
                  </motion.div>
                </motion.div>

                {/* Title */}
                <motion.h3
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
                  className="text-xl font-bold text-white mb-2"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Confirm Logout
                </motion.h3>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut', delay: 0.18 }}
                  className="text-sm text-white/50 mb-7 leading-relaxed max-w-[300px] mx-auto"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  Are you sure you want to logout? You'll need to login again to access your account.
                </motion.p>

                {/* Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut', delay: 0.25 }}
                  className="flex gap-3"
                >
                  <motion.button
                    whileHover={{ y: -2, borderColor: 'rgba(255,255,255,0.2)' }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 px-5 py-3.5 rounded-xl text-sm font-semibold text-white/80 transition-all cursor-pointer"
                    style={{
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03, y: -2, boxShadow: '0 12px 40px rgba(203,32,45,0.35)' }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setShowLogoutModal(false); authService.logout(); showToast('Logged out successfully!', 'success'); navigate('/') }}
                    className="flex-1 px-5 py-3.5 rounded-xl text-sm font-semibold text-white cursor-pointer relative overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #CB202D, #A81D2A)',
                      fontFamily: "'Inter', sans-serif",
                      boxShadow: '0 4px 20px rgba(203,32,45,0.25)',
                    }}
                  >
                    <span className="relative z-10">Logout</span>
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  if (absolute) {
    return (
      <>
        <style>{`${baseStyles}
          @keyframes fadeIn {
            0% { opacity: 0; }
            100% { opacity: 1; }
          }
          .nav-absolute-fade {
            animation: fadeIn 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        `}</style>
        <header
          className="nav-absolute-fade absolute z-[9999] w-full top-0"
        >
          {sharedContent}
        </header>
        {logoutModal}
      </>
    )
  }

  return (
    <>
      <style>{baseStyles}</style>

      <motion.header
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed z-[9999] w-full top-0 transition-all duration-500 ${
          hideOnScroll ? (navVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none') : ''
        }`}
      >
        {sharedContent}
      </motion.header>
      {logoutModal}
    </>
  )
}
