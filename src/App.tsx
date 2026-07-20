import AppRoutes from './route'
import { ToastProvider } from './context/ToastContext'

function App() {
  return (
    <ToastProvider>
      <AppRoutes />
    </ToastProvider>
  )
}

export default App
