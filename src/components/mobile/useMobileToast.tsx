import { useState, useCallback, useRef } from 'react'

export interface MobileToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

export function useMobileToast() {
  const [toasts, setToasts] = useState<MobileToastItem[]>([])
  const idRef = useRef(0)

  const show = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = ++idRef.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3000)
  }, [])

  const Toast = (
    <div className="fixed bottom-[calc(96px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center gap-2 w-[calc(100%-32px)] max-w-[420px] pointer-events-none">
      {toasts.map(t => {
        const theme = t.type === 'success'
          ? { icon: '✓', bg: '#22C55E' }
          : t.type === 'error'
            ? { icon: '!', bg: '#EF4444' }
            : { icon: 'i', bg: '#6C3BFF' }
        return (
          <div
            key={t.id}
            className="flex items-center gap-3 pl-3 pr-4 py-3 rounded-2xl bg-white shadow-[0_8px_24px_rgba(17,24,39,0.14)] border border-[#EEF0F6] pointer-events-auto w-full animate-[toastUp_0.32s_cubic-bezier(0.22,1,0.36,1)]"
          >
            <span
              className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-[14px] font-bold"
              style={{ background: theme.bg, boxShadow: `0 4px 10px ${theme.bg}40` }}
            >
              {theme.icon}
            </span>
            <span className="text-[13px] font-semibold text-[#1F2937] leading-snug flex-1">{t.message}</span>
          </div>
        )
      })}
    </div>
  )

  return { show, Toast }
}
