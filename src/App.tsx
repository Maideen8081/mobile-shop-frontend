import AppRoutes from './route'
import ScrollToTop from './components/ScrollToTop'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import SupportChatButton from './components/ecommerce/SupportChatButton'
import AppBootLoader from './components/LoadingScreen/AppBootLoader'
import { RouteProgressBar } from './components/LoadingScreen/RouteLoader'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ScrollToTop />
        <AppBootLoader />
        <RouteProgressBar />
        <AppRoutes />
        <SupportChatButton />
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
