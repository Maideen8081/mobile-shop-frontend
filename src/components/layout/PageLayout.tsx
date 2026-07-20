import { useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

interface PageLayoutProps {
  children: ReactNode
  title?: string
}

export default function PageLayout({ children, title }: PageLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const pageTitle = title
    || location.pathname
        .split('/')
        .filter(Boolean)
        .pop()
        ?.replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <div className="admin-theme min-h-screen bg-bg">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="lg:ml-64 min-h-screen transition-all duration-200">
        {/* Slim Admin Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-3 px-4 lg:px-8 h-16">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-text-secondary hover:bg-surface-hover transition-colors"
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold text-text-primary truncate">{pageTitle || 'Dashboard'}</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                A
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-8 pt-6 pb-10 max-w-[1600px] mx-auto animate-admin-in">
          {children}
        </main>
      </div>
    </div>
  )
}
