import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy as reactLazy, Suspense, type ComponentType, type ReactNode } from 'react'
import { RouteLoader } from '../components/LoadingScreen/RouteLoader'
import { LEGACY_ADMIN_PATHS } from './adminPaths'
import WebsiteGate from '../pages/WebsiteGate'
import AuthGuard from '../components/AuthGuard'
import AdminGuard from '../components/AdminGuard'

// Only the home page ships in the main bundle; every other page downloads when first visited.
// After a deploy, an open tab may ask for a page file that no longer exists:
// reload once to pick up the new build instead of showing a blank screen.
function lazy<T extends ComponentType<object>>(load: () => Promise<{ default: T }>) {
  return reactLazy(() =>
    load().then(
      (mod) => {
        sessionStorage.removeItem('chunk_reloaded')
        return mod
      },
      (err) => {
        if (!sessionStorage.getItem('chunk_reloaded')) {
          sessionStorage.setItem('chunk_reloaded', '1')
          window.location.reload()
          return new Promise<never>(() => {})
        }
        throw err
      },
    ),
  )
}

const LandingGate = lazy(() => import('../pages/LandingGate'))
const SearchPageGate = lazy(() => import('../pages/SearchPageGate'))
const Dashboard = lazy(() => import('../pages/Dashboard'))
const CategoryManagement = lazy(() => import('../pages/CategoryManagement'))
const ProductManagement = lazy(() => import('../pages/ProductManagement'))
const RepairDashboard = lazy(() => import('../pages/RepairDashboard'))
const NewRepairTicket = lazy(() => import('../pages/NewRepairTicket'))
const UserBookings = lazy(() => import('../pages/UserBookings'))
const TechnicianPanel = lazy(() => import('../pages/TechnicianPanel'))
const DeviceTracking = lazy(() => import('../pages/DeviceTracking'))
const CustomerDashboard = lazy(() => import('../pages/CustomerDashboard'))
const CustomerList = lazy(() => import('../pages/CustomerList'))
const CustomerProfile = lazy(() => import('../pages/CustomerProfile'))
const WarrantyDashboard = lazy(() => import('../pages/WarrantyDashboard'))
const WarrantyTracking = lazy(() => import('../pages/WarrantyTracking'))
const WarrantyClaims = lazy(() => import('../pages/WarrantyClaims'))
const ExpiryAlerts = lazy(() => import('../pages/ExpiryAlerts'))
const BrandWarrantyRecords = lazy(() => import('../pages/BrandWarrantyRecords'))
const CollectionGate = lazy(() => import('../pages/CollectionGate'))
const ProductDetailGate = lazy(() => import('../pages/ProductDetailGate'))
const CartGate = lazy(() => import('../pages/CartGate'))
const WishlistGate = lazy(() => import('../pages/WishlistGate'))
const RepairsPage = lazy(() => import('../pages/RepairsPage'))
const PhonesPage = lazy(() => import('../pages/PhonesPage'))
const AccessoriesPage = lazy(() => import('../pages/AccessoriesPage'))
const TradeInPage = lazy(() => import('../pages/TradeInPage'))
const AboutPage = lazy(() => import('../pages/AboutPage'))
const AddressManagement = lazy(() => import('../pages/AddressManagement'))
const CheckoutAddress = lazy(() => import('../pages/CheckoutAddress'))
const PaymentPage = lazy(() => import('../pages/PaymentPage'))
const OrderSuccess = lazy(() => import('../pages/OrderSuccess'))
const OrderTrackingGate = lazy(() => import('../pages/OrderTrackingGate'))
const CustomerRepairTracking = lazy(() => import('../pages/CustomerRepairTracking'))
const RepairDetailPage = lazy(() => import('../pages/RepairDetailPage'))
const BookRepair = lazy(() => import('../pages/BookRepair'))
const LoginPage = lazy(() => import('../pages/LoginPage'))
const RegisterPage = lazy(() => import('../pages/RegisterPage'))
const AddressCreatePage = lazy(() => import('../pages/AddressCreatePage'))
const ProfilePage = lazy(() => import('../pages/ProfilePage'))
const SupportChatGate = lazy(() => import('../pages/SupportChatGate'))
const MobileNotifications = lazy(() => import('../components/mobile/MobileNotifications'))
const AdminOrders = lazy(() => import('../pages/AdminOrders'))
const AdminTradeInDashboard = lazy(() => import('../pages/AdminTradeInDashboard'))
const AdminLoginPage = lazy(() => import('../pages/AdminLoginPage'))
const ProductEditorPage = lazy(() => import('../pages/ProductEditorPage'))
const CategoryEditorPage = lazy(() => import('../pages/CategoryEditorPage'))

// Admin-only pages. Routed under /admin/* and protected by AdminGuard, which
// itself is enforced server-side by IsAdminUser on every API call.
const adminPages: { path: string; element: ReactNode }[] = [
  { path: '/admin/dashboard', element: <Dashboard /> },
  { path: '/admin/categories', element: <CategoryManagement /> },
  { path: '/admin/categories/new', element: <CategoryEditorPage /> },
  { path: '/admin/products', element: <ProductManagement /> },
  { path: '/admin/products/new', element: <ProductEditorPage /> },
  { path: '/admin/products/:id/edit', element: <ProductEditorPage /> },
  { path: '/admin/repair-dashboard', element: <RepairDashboard /> },
  { path: '/admin/new-repair', element: <NewRepairTicket /> },
  { path: '/admin/user-bookings', element: <UserBookings /> },
  { path: '/admin/technician-panel', element: <TechnicianPanel /> },
  { path: '/admin/device-tracking', element: <DeviceTracking /> },
  { path: '/admin/customer-dashboard', element: <CustomerDashboard /> },
  { path: '/admin/customer-list', element: <CustomerList /> },
  { path: '/admin/customer-profile', element: <CustomerProfile /> },
  { path: '/admin/warranty-dashboard', element: <WarrantyDashboard /> },
  { path: '/admin/warranty-tracking', element: <WarrantyTracking /> },
  { path: '/admin/warranty-claims', element: <WarrantyClaims /> },
  { path: '/admin/expiry-alerts', element: <ExpiryAlerts /> },
  { path: '/admin/brand-warranty', element: <BrandWarrantyRecords /> },
  { path: '/admin/online-orders', element: <AdminOrders /> },
  { path: '/admin/trade-in-management', element: <AdminTradeInDashboard /> },
]

// Legacy admin URLs redirect behind the admin guard so stale links cannot open
// admin pages outside the /admin/* namespace.
const legacyAdminRedirects: { from: string; to: string }[] = LEGACY_ADMIN_PATHS.map((from) => ({
  from,
  to: `/admin${from}`,
}))

export default function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoader />}>
    <Routes>
      {/* Admin area */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      {adminPages.map(({ path, element }) => (
        <Route key={path} path={path} element={<AdminGuard>{element}</AdminGuard>} />
      ))}
      {legacyAdminRedirects.map(({ from, to }) => (
        <Route key={from} path={from} element={<AdminGuard><Navigate to={to} replace /></AdminGuard>} />
      ))}

      {/* Public storefront */}
      <Route path="/" element={<WebsiteGate />} />
      <Route path="/search" element={<SearchPageGate />} />
      <Route path="/home" element={<LandingGate />} />
      <Route path="/collection/:category" element={<CollectionGate />} />
      <Route path="/product/:productId/variation/:variationId" element={<ProductDetailGate />} />
      <Route path="/product/:productId/:variantId" element={<ProductDetailGate />} />
      <Route path="/product/:id" element={<ProductDetailGate />} />
      <Route path="/repairs" element={<RepairsPage />} />
      <Route path="/phones" element={<PhonesPage />} />
      <Route path="/accessories" element={<AccessoriesPage />} />
      <Route path="/trade-in" element={<TradeInPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/support" element={<SupportChatGate />} />
      <Route path="/book-repair" element={<BookRepair />} />
      <Route path="/book-repair/:issue" element={<BookRepair />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<RegisterPage />} />
      <Route path="/notifications" element={<MobileNotifications />} />

      {/* Customer-only (authenticated) */}
      <Route path="/cart" element={<AuthGuard><CartGate /></AuthGuard>} />
      <Route path="/wishlist" element={<AuthGuard><WishlistGate /></AuthGuard>} />
      <Route path="/profile/addresses" element={<AuthGuard><AddressManagement /></AuthGuard>} />
      <Route path="/address/create" element={<AuthGuard><AddressCreatePage /></AuthGuard>} />
      <Route path="/checkout/address" element={<AuthGuard><CheckoutAddress /></AuthGuard>} />
      <Route path="/checkout/payment" element={<AuthGuard><PaymentPage /></AuthGuard>} />
      <Route path="/checkout/success" element={<AuthGuard><OrderSuccess /></AuthGuard>} />
      <Route path="/orders" element={<AuthGuard><OrderTrackingGate /></AuthGuard>} />
      <Route path="/my-repairs" element={<AuthGuard><CustomerRepairTracking /></AuthGuard>} />
      <Route path="/my-repairs/:id" element={<AuthGuard><RepairDetailPage /></AuthGuard>} />
      <Route path="/profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />

      <Route path="*" element={<WebsiteGate />} />
    </Routes>
    </Suspense>
  )
}