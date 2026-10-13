import AppRoutes from './route'
import ScrollToTop from './components/ScrollToTop'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import SupportChatButton from './components/ecommerce/SupportChatButton'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ScrollToTop />
        <AppRoutes />
        <SupportChatButton />
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
