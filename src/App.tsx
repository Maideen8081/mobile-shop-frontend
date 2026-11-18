import AppRoutes from './route'
import ScrollToTop from './components/ScrollToTop'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import SupportChatButton from './components/ecommerce/SupportChatButton'
import AppBootLoader from './components/LoadingScreen/AppBootLoader'
import PendingCartResumer from './components/PendingCartResumer'
import './styles/storefront-motion.css'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ScrollToTop />
        <PendingCartResumer />
        <AppBootLoader />
        <AppRoutes />
        <SupportChatButton />
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
