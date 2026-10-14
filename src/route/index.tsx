import { Routes, Route, Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import WebsiteExperience from '../pages/WebsiteExperience'
import LandingGate from '../pages/LandingGate'
import SearchPageGate from '../pages/SearchPageGate'
import AuthGuard from '../components/AuthGuard'
import AdminGuard from '../components/AdminGuard'
import Dashboard from '../pages/Dashboard'
import CategoryManagement from '../pages/CategoryManagement'
import ProductManagement from '../pages/ProductManagement'
import RepairDashboard from '../pages/RepairDashboard'
import NewRepairTicket from '../pages/NewRepairTicket'
import UserBookings from '../pages/UserBookings'
import TechnicianPanel from '../pages/TechnicianPanel'
import DeviceTracking from '../pages/DeviceTracking'
import CustomerDashboard from '../pages/CustomerDashboard'
import CustomerList from '../pages/CustomerList'
import CustomerProfile from '../pages/CustomerProfile'
import WarrantyDashboard from '../pages/WarrantyDashboard'
import WarrantyTracking from '../pages/WarrantyTracking'
import WarrantyClaims from '../pages/WarrantyClaims'
import ExpiryAlerts from '../pages/ExpiryAlerts'
import BrandWarrantyRecords from '../pages/BrandWarrantyRecords'
import LandingPage from '../pages/LandingPage'
import CollectionGate from '../pages/CollectionGate'
import ProductDetailGate from '../pages/ProductDetailGate'
import CartGate from '../pages/CartGate'
import WishlistPage from '../pages/WishlistPage'
import RepairsPage from '../pages/RepairsPage'
import PhonesPage from '../pages/PhonesPage'
import AccessoriesPage from '../pages/AccessoriesPage'
import TradeInPage from '../pages/TradeInPage'
import AboutPage from '../pages/AboutPage'
import AddressManagement from '../pages/AddressManagement'
import CheckoutAddress from '../pages/CheckoutAddress'
import PaymentPage from '../pages/PaymentPage'
import OrderSuccess from '../pages/OrderSuccess'
import OrderTrackingGate from '../pages/OrderTrackingGate'
import CustomerRepairTracking from '../pages/CustomerRepairTracking'
import RepairDetailPage from '../pages/RepairDetailPage'
import BookRepair from '../pages/BookRepair'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import AddressCreatePage from '../pages/AddressCreatePage'
import ProfilePage from '../pages/ProfilePage'
import SupportChatPage from '../pages/SupportChatPage'
import MobileNotifications from '../components/mobile/MobileNotifications'
import AdminOrders from '../pages/AdminOrders'
import AdminTradeInDashboard from '../pages/AdminTradeInDashboard'
import AdminLoginPage from '../pages/AdminLoginPage'

// Admin-only pages. Routed under /admin/* and protected by AdminGuard, which
// itself is enforced server-side by IsAdminUser on every API call.
const adminPages: { path: string; element: ReactNode }[] = [
  { path: '/admin/dashboard', element: <Dashboard /> },
  { path: '/admin/categories', element: <CategoryManagement /> },
  { path: '/admin/products', element: <ProductManagement /> },
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
const legacyAdminRedirects: { from: string; to: string }[] = [
  { from: '/dashboard', to: '/admin/dashboard' },
  { from: '/categories', to: '/admin/categories' },
  { from: '/products', to: '/admin/products' },
  { from: '/repair-dashboard', to: '/admin/repair-dashboard' },
  { from: '/new-repair', to: '/admin/new-repair' },
  { from: '/user-bookings', to: '/admin/user-bookings' },
  { from: '/technician-panel', to: '/admin/technician-panel' },
  { from: '/device-tracking', to: '/admin/device-tracking' },
  { from: '/customer-dashboard', to: '/admin/customer-dashboard' },
  { from: '/customer-list', to: '/admin/customer-list' },
  { from: '/customer-profile', to: '/admin/customer-profile' },
  { from: '/warranty-dashboard', to: '/admin/warranty-dashboard' },
  { from: '/warranty-tracking', to: '/admin/warranty-tracking' },
  { from: '/warranty-claims', to: '/admin/warranty-claims' },
  { from: '/expiry-alerts', to: '/admin/expiry-alerts' },
  { from: '/brand-warranty', to: '/admin/brand-warranty' },
  { from: '/online-orders', to: '/admin/online-orders' },
  { from: '/trade-in-management', to: '/admin/trade-in-management' },
]

export default function AppRoutes() {
  return (
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
      <Route path="/" element={<WebsiteExperience />} />
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
      <Route path="/support" element={<SupportChatPage />} />
      <Route path="/book-repair" element={<BookRepair />} />
      <Route path="/book-repair/:issue" element={<BookRepair />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<RegisterPage />} />
      <Route path="/notifications" element={<MobileNotifications />} />

      {/* Customer-only (authenticated) */}
      <Route path="/cart" element={<AuthGuard><CartGate /></AuthGuard>} />
      <Route path="/wishlist" element={<AuthGuard><WishlistPage /></AuthGuard>} />
      <Route path="/profile/addresses" element={<AuthGuard><AddressManagement /></AuthGuard>} />
      <Route path="/address/create" element={<AuthGuard><AddressCreatePage /></AuthGuard>} />
      <Route path="/checkout/address" element={<AuthGuard><CheckoutAddress /></AuthGuard>} />
      <Route path="/checkout/payment" element={<AuthGuard><PaymentPage /></AuthGuard>} />
      <Route path="/checkout/success" element={<AuthGuard><OrderSuccess /></AuthGuard>} />
      <Route path="/orders" element={<AuthGuard><OrderTrackingGate /></AuthGuard>} />
      <Route path="/my-repairs" element={<AuthGuard><CustomerRepairTracking /></AuthGuard>} />
      <Route path="/my-repairs/:id" element={<AuthGuard><RepairDetailPage /></AuthGuard>} />
      <Route path="/profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />

      <Route path="*" element={<WebsiteExperience />} />
    </Routes>
  )
}