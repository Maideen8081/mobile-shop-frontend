import { Routes, Route } from 'react-router-dom'
import LandingGate from '../pages/LandingGate'
import MobileSearch from '../components/mobile/MobileSearch'
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
import BookRepair from '../pages/BookRepair'
import LoginPage from '../pages/LoginPage'
import RegisterPage from '../pages/RegisterPage'
import AddressCreatePage from '../pages/AddressCreatePage'
import ProfilePage from '../pages/ProfilePage'
import MobileNotifications from '../components/mobile/MobileNotifications'
import AdminOrders from '../pages/AdminOrders'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingGate />} />
      <Route path="/search" element={<MobileSearch />} />
      <Route path="/cart" element={<CartGate />} />
      <Route path="/wishlist" element={<WishlistPage />} />
      <Route path="/profile/addresses" element={<AddressManagement />} />
      <Route path="/checkout/address" element={<CheckoutAddress />} />
      <Route path="/checkout/payment" element={<PaymentPage />} />
      <Route path="/checkout/success" element={<OrderSuccess />} />
      <Route path="/orders" element={<OrderTrackingGate />} />
      <Route path="/my-repairs" element={<CustomerRepairTracking />} />
      <Route path="/book-repair" element={<BookRepair />} />
      <Route path="/book-repair/:issue" element={<BookRepair />} />
      <Route path="/home" element={<LandingPage />} />
      <Route path="/collection/:category" element={<CollectionGate />} />
      <Route path="/product/:productId/variation/:variationId" element={<ProductDetailGate />} />
      <Route path="/product/:productId/:variantId" element={<ProductDetailGate />} />
      <Route path="/product/:id" element={<ProductDetailGate />} />
      <Route path="/repairs" element={<RepairsPage />} />
      <Route path="/phones" element={<PhonesPage />} />
      <Route path="/accessories" element={<AccessoriesPage />} />
      <Route path="/trade-in" element={<TradeInPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/categories" element={<CategoryManagement />} />
      <Route path="/products" element={<ProductManagement />} />
      <Route path="/repair-dashboard" element={<RepairDashboard />} />
      <Route path="/new-repair" element={<NewRepairTicket />} />
      <Route path="/user-bookings" element={<UserBookings />} />
      <Route path="/technician-panel" element={<TechnicianPanel />} />
      <Route path="/device-tracking" element={<DeviceTracking />} />
      <Route path="/customer-dashboard" element={<CustomerDashboard />} />
      <Route path="/customer-list" element={<CustomerList />} />
      <Route path="/customer-profile" element={<CustomerProfile />} />
      <Route path="/warranty-dashboard" element={<WarrantyDashboard />} />
      <Route path="/warranty-tracking" element={<WarrantyTracking />} />
      <Route path="/warranty-claims" element={<WarrantyClaims />} />
      <Route path="/expiry-alerts" element={<ExpiryAlerts />} />
      <Route path="/brand-warranty" element={<BrandWarrantyRecords />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<RegisterPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/notifications" element={<MobileNotifications />} />
      <Route path="/address/create" element={<AddressCreatePage />} />
      <Route path="/online-orders" element={<AdminOrders />} />
      <Route path="*" element={<LandingGate />} />
    </Routes>
  )
}