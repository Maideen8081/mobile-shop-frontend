import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import { FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi'
import './Toast.css'

type ToastType = 'success' | 'error'

interface Toast {
  message: string
  type: ToastType
  id: number
}

interface ToastContextType {
  show: (message: string, type: ToastType) => void
}

const ToastContext = createContext<ToastContextType>({ show: () => {} })

// Errors stay up a little longer so there is time to read them.
const DURATION: Record<ToastType, number> = { success: 3500, error: 5000 }
const MAX_VISIBLE = 3

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const show = useCallback((message: string, type: ToastType) => {
    const id = ++toastId.current
    setToasts((prev) => {
      // Don't stack the same message twice (e.g. a double-clicked button).
      const rest = prev.filter((t) => !(t.message === message && t.type === type))
      return [...rest, { message, type, id }].slice(-MAX_VISIBLE)
    })
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="app-toasts" aria-live="polite" aria-relevant="additions">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false)
  const remaining = useRef(DURATION[toast.type])
  const startedAt = useRef(0)

  // Auto-close, pausing while the pointer is over the toast.
  useEffect(() => {
    if (paused) return
    startedAt.current = Date.now()
    const t = window.setTimeout(() => onDismiss(toast.id), remaining.current)
    return () => {
      window.clearTimeout(t)
      remaining.current -= Date.now() - startedAt.current
    }
  }, [paused, toast.id, onDismiss])

  const isSuccess = toast.type === 'success'
  return (
    <div
      className={`app-toast app-toast--${toast.type}`}
      role={isSuccess ? 'status' : 'alert'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ ['--toast-duration' as string]: `${DURATION[toast.type]}ms` }}
    >
      <span className="app-toast__icon" aria-hidden="true">
        {isSuccess ? <FiCheckCircle size={20} /> : <FiAlertCircle size={20} />}
      </span>
      <div className="app-toast__body">
        <p className="app-toast__title">{isSuccess ? 'Success' : 'Error'}</p>
        <p className="app-toast__message">{toast.message}</p>
      </div>
      <button type="button" className="app-toast__close" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
        <FiX size={16} />
      </button>
      <span className={`app-toast__progress ${paused ? 'is-paused' : ''}`} aria-hidden="true" />
    </div>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
