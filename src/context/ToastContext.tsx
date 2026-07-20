import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'

interface Toast {
  message: string
  type: 'success' | 'error'
  id: number
}

interface ToastContextType {
  show: (message: string, type: 'success' | 'error') => void
}

const ToastContext = createContext<ToastContextType>({ show: () => {} })

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const toastId = useRef(0)

  const show = useCallback((message: string, type: 'success' | 'error') => {
    const id = ++toastId.current
    setToast({ message, type, id })
    setTimeout(() => setToast(prev => prev?.id === id ? null : prev), 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast && (
        <div
          key={toast.id}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2.5 px-5 py-3 rounded-2xl shadow-2xl"
          style={{
            background: toast.type === 'success'
              ? 'linear-gradient(135deg, #4FE3C1, #006b58)'
              : 'linear-gradient(135deg, #FF4D4D, #ba1a1a)',
            color: 'white',
            animation: 'toastIn 0.3s ease-out',
          }}
        >
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            {toast.type === 'success' ? 'check_circle' : 'warning'}
          </span>
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}
      <style>{`
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(20px) translateX(-50%); }
          to { opacity: 1; transform: translateY(0) translateX(-50%); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
