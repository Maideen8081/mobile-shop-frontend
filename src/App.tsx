import AppRoutes from './route'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider } from './context/AuthContext'
import SupportChatButton from './components/ecommerce/SupportChatButton'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRoutes />
        <SupportChatButton />
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
