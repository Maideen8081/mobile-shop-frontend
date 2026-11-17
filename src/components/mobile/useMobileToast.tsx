import { useState, useCallback, useRef } from 'react'

export interface MobileToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
  action?: { label: string; onClick: () => void }
}

export function useMobileToast() {
  const [toasts, setToasts] = useState<MobileToastItem[]>([])
  const idRef = useRef(0)

  const show = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success', action?: MobileToastItem['action']) => {
    const id = ++idRef.current
    setToasts(prev => [...prev, { id, message, type, action }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, action ? 6000 : 3000)
  }, [])

  const Toast = (
    <div className="fixed bottom-[calc(96px+env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[300] flex flex-col items-center gap-2 w-[calc(100%-32px)] max-w-[420px] pointer-events-none">
      {toasts.map(t => {
        const theme = t.type === 'success'
          ? { icon: '✓', bg: '#22C55E' }
          : t.type === 'error'
            ? { icon: '!', bg: '#EF4444' }
            : { icon: 'i', bg: '#0f3b2c' }
        return (
          <div
            key={t.id}
            className="flex items-center gap-3 pl-3 pr-4 py-3 rounded-2xl bg-white shadow-[0_8px_24px_rgba(17,24,39,0.14)] border border-[#ece9e2] pointer-events-auto w-full animate-[toastUp_0.32s_cubic-bezier(0.22,1,0.36,1)]"
          >
            <span
              className="flex-shrink-0 w-7 h-7 rounded-[8px] flex items-center justify-center text-white text-body-sm font-bold"
              style={{ background: theme.bg, boxShadow: `0 4px 10px ${theme.bg}40` }}
            >
              {theme.icon}
            </span>
            <span className="text-label font-semibold text-[#1d2522] leading-snug flex-1">{t.message}</span>
            {t.action && (
              <button
                type="button"
                onClick={() => { setToasts(prev => prev.filter(x => x.id !== t.id)); t.action?.onClick() }}
                className="min-h-[44px] px-3 rounded-[8px] text-label font-bold text-[#0f3b2c]"
              >
                {t.action.label}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )

  return { show, Toast }
}
