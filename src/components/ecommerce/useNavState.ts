import { useCallback, useEffect, useState } from 'react'
import { categoryService } from '../../services/categoryService'
import { authService } from '../../services/authService'
import { cartService } from '../../services/cartService'
import { getWishlistCount } from '../../utils/wishlist'
import type { HeaderCategory } from './navConfig'

let cachedHeaderCategories: HeaderCategory[] | null = null

export interface NavUser {
  name: string
  email: string
}

function readStoredUser(): NavUser {
  try {
    const raw = localStorage.getItem('user_profile')
    if (!raw) return { name: '', email: '' }
    const parsed = JSON.parse(raw)
    return {
      name: parsed.fullName || parsed.name || '',
      email: parsed.email || '',
    }
  } catch {
    return { name: '', email: '' }
  }
}

function titleCase(value: string): string {
  return value.trim().toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Live wishlist / cart counts plus the signed-in profile. */
export function useNavState() {
  const [wishlistCount, setWishlistCount] = useState(() => getWishlistCount())
  const [cartCount, setCartCount] = useState(() => cartService.getCachedCartCount())
  const [user, setUser] = useState<NavUser>(readStoredUser)
  const [isAuth, setIsAuth] = useState(() => authService.isAuthenticated())

  useEffect(() => {
    const updateWishlist = () => setWishlistCount(getWishlistCount())
    const updateCart = () => setCartCount(cartService.getCachedCartCount())
    const updateAuth = () => {
      setUser(readStoredUser())
      setIsAuth(authService.isAuthenticated())
    }

    updateWishlist()
    updateCart()
    updateAuth()

    cartService
      .getCartCount()
      .then((count) => setCartCount(count))
      .catch(() => {})

    window.addEventListener('wishlist-updated', updateWishlist)
    window.addEventListener('cart-updated', updateCart)
    window.addEventListener('auth-changed', updateAuth)
    return () => {
      window.removeEventListener('wishlist-updated', updateWishlist)
      window.removeEventListener('cart-updated', updateCart)
      window.removeEventListener('auth-changed', updateAuth)
    }
  }, [])

  const displayName = user.name ? titleCase(user.name) : ''
  const initials = user.name
    ? user.name
        .trim()
        .split(/\s+/)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : ''

  const logout = useCallback(async () => {
    await authService.logout()
    setUser({ name: '', email: '' })
    setIsAuth(false)
  }, [])

  return {
    wishlistCount,
    cartCount,
    user,
    isAuth,
    displayName,
    initials,
    logout,
  }
}

/** Categories fetched once and shared by every navigation surface. */
export function useHeaderCategories(): HeaderCategory[] {
  const [categories, setCategories] = useState<HeaderCategory[]>(() => cachedHeaderCategories ?? [])

  useEffect(() => {
    if (cachedHeaderCategories) {
      setCategories(cachedHeaderCategories)
      return
    }

    let alive = true
    categoryService
      .list()
      .then((cats) => {
        const mapped = cats
          .filter((c) => c.status === 'active')
          .map((c) => ({ id: c.id, name: c.name }))
        cachedHeaderCategories = mapped
        if (alive) setCategories(mapped)
      })
      .catch(() => {})

    return () => {
      alive = false
    }
  }, [])

  return categories
}
