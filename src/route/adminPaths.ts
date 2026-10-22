// Pre-/admin URLs that still resolve to admin pages (redirected behind AdminGuard).
export const LEGACY_ADMIN_PATHS = [
  '/dashboard',
  '/categories',
  '/products',
  '/repair-dashboard',
  '/new-repair',
  '/user-bookings',
  '/technician-panel',
  '/device-tracking',
  '/customer-dashboard',
  '/customer-list',
  '/customer-profile',
  '/warranty-dashboard',
  '/warranty-tracking',
  '/warranty-claims',
  '/expiry-alerts',
  '/brand-warranty',
  '/online-orders',
  '/trade-in-management',
]

/** True for any admin-console URL, including legacy redirects. */
export function isAdminPath(pathname: string) {
  return (
    pathname === '/admin' ||
    pathname.startsWith('/admin/') ||
    LEGACY_ADMIN_PATHS.includes(pathname.replace(/\/+$/, ''))
  )
}
