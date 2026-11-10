import type { LucideIcon } from 'lucide-react'
import {
  ArrowLeftRight,
  BatteryCharging,
  Grid2x2,
  Headphones,
  Heart,
  LayoutGrid,
  LifeBuoy,
  LogIn,
  MapPin,
  Package,
  Percent,
  Smartphone,
  Sparkles,
  Tablet,
  TrendingUp,
  User,
  Watch,
  Wrench,
} from 'lucide-react'

export interface HeaderCategory {
  id: number | string
  name: string
}

export interface NavCategoryDef {
  label: string
  icon: LucideIcon
  /** Names the backend may use for this category. */
  keys: string[]
}

export interface NavLink {
  to: string
  label: string
  sub?: string
  icon: LucideIcon
}

/* ── Storefront contact details ─────────────────────────────────────── */
export const CONTACT_PHONE_DISPLAY = '+91 98765 43210'
export const CONTACT_PHONE_TEL = '+919876543210'
export const STORE_HOURS = 'Mon – Sat, 10 AM – 8 PM'

/* ── The six categories surfaced in the main navigation ─────────────── */
export const NAV_CATEGORIES: NavCategoryDef[] = [
  {
    label: 'Smartphones',
    icon: Smartphone,
    keys: ['smartphones', 'smartphone', 'phones', 'phone', 'mobiles', 'mobile'],
  },
  {
    label: 'Tablets',
    icon: Tablet,
    keys: ['tablets', 'tablet', 'ipads', 'ipad'],
  },
  {
    label: 'Smart Watches',
    icon: Watch,
    keys: ['smart watches', 'smart watch', 'watches', 'watch', 'wearables', 'wearable'],
  },
  {
    label: 'Earbuds',
    icon: Headphones,
    keys: ['earbuds', 'earbud', 'earbuds (tws)', 'tws', 'wireless earbuds'],
  },
  {
    label: 'Headphones',
    icon: Headphones,
    keys: ['headphones', 'headphone', 'headsets', 'headset', 'over ear headphones'],
  },
  {
    label: 'Power Banks',
    icon: BatteryCharging,
    keys: ['power banks', 'power bank', 'powerbanks', 'powerbank'],
  },
]

/** Used when the categories endpoint has not answered yet. */
export const DEFAULT_HEADER_CATEGORIES: HeaderCategory[] = NAV_CATEGORIES.map((c, index) => ({
  id: `default-${index}`,
  name: c.label,
}))

/* ── Other category shapes we may receive from the backend ──────────── */
const CATEGORY_ICON_MATCHERS: { icon: LucideIcon; keys: string[] }[] = [
  ...NAV_CATEGORIES.map(({ icon, keys }) => ({ icon, keys })),
  { icon: BatteryCharging, keys: ['chargers', 'charger', 'charging', 'adapters'] },
  { icon: Headphones, keys: ['audio', 'speakers', 'speaker'] },
  { icon: Package, keys: ['cases', 'covers', 'protectors', 'cables', 'accessories'] },
]

/* ── Shop / service / account links ─────────────────────────────────── */
export const SHOP_LINKS: NavLink[] = [
  { to: '/collection/all', label: 'All Products', sub: 'Browse the full range', icon: LayoutGrid },
  { to: '/phones', label: 'Phones', sub: 'Latest smartphones', icon: Smartphone },
  { to: '/accessories', label: 'Accessories', sub: 'Cases, chargers and more', icon: Package },
  { to: '/collection/all?tab=new', label: 'New Arrivals', sub: 'Fresh this week', icon: Sparkles },
  { to: '/collection/all?tab=popular', label: 'Popular', sub: 'Top sellers', icon: TrendingUp },
  { to: '/collection/all?tab=deals', label: 'Deals & Offers', sub: 'Best prices', icon: Percent },
]

export const SERVICE_LINKS: NavLink[] = [
  { to: '/book-repair', label: 'Book a Repair', sub: 'Fast, certified service', icon: Wrench },
  { to: '/repairs', label: 'Repair Services', sub: 'What we fix', icon: Wrench },
  { to: '/my-repairs', label: 'My Repairs', sub: 'Track your device', icon: Package },
  { to: '/trade-in', label: 'Trade-In', sub: 'Exchange and save', icon: ArrowLeftRight },
]

export const ACCOUNT_LINKS: NavLink[] = [
  { to: '/profile', label: 'My Profile', icon: User },
  { to: '/orders', label: 'My Orders', icon: Package },
  { to: '/my-repairs', label: 'My Repairs', icon: Wrench },
  { to: '/profile/addresses', label: 'My Addresses', icon: MapPin },
  { to: '/wishlist', label: 'Wishlist', icon: Heart },
]

export const HELP_LINKS: NavLink[] = [
  { to: '/about', label: 'About PhoneFix', icon: LifeBuoy },
  { to: '/support', label: 'Contact & Support', icon: LifeBuoy },
]

export const GUEST_LINKS: NavLink[] = [
  { to: '/login', label: 'Sign in', icon: LogIn },
  { to: '/signup', label: 'Create account', icon: User },
  { to: '/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/orders', label: 'Track an order', icon: Package },
]

export const SHOP_BY_CATEGORY_ICON = Grid2x2

/* ── Helpers ────────────────────────────────────────────────────────── */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function matchesWord(haystack: string, needle: string): boolean {
  return ` ${haystack} `.includes(` ${needle} `)
}

/**
 * Map one of our display labels on to the actual category name returned by
 * the API. Falls back to the display label so the link is always usable.
 */
export function resolveCategoryName(label: string, categories: HeaderCategory[]): string {
  const def = NAV_CATEGORIES.find((c) => c.label === label)
  const pool = categories.length > 0 ? categories : DEFAULT_HEADER_CATEGORIES
  const keys = [def?.label || label, ...(def?.keys || [])].map(normalize)

  for (const key of keys) {
    const exact = pool.find((c) => normalize(c.name) === key)
    if (exact) return exact.name
  }
  for (const key of keys) {
    const partial = pool.find((c) => matchesWord(normalize(c.name), key))
    if (partial) return partial.name
  }
  return def?.label || label
}

export function categoryHref(name: string): string {
  return `/collection/${encodeURIComponent(name)}`
}

/** Pick a sensible icon for any category name the API returns. */
export function iconForCategory(name: string): LucideIcon {
  const value = normalize(name)
  for (const matcher of CATEGORY_ICON_MATCHERS) {
    if (matcher.keys.some((key) => matchesWord(value, normalize(key)))) return matcher.icon
  }
  return Package
}

/** Decode the category segment of a collection URL. */
export function collectionCategoryFromPath(pathname: string): string {
  if (!pathname.startsWith('/collection/')) return ''
  const raw = pathname.slice('/collection/'.length)
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}
