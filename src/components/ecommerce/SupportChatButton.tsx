import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import ChatAssistantIcon from './ChatAssistantIcon'
import { useIsMobile } from '../mobile/helpers'
import { isAdminPath } from '../../route/adminPaths'
import './SupportChatButton.css'

const STORAGE_KEY = 'support-chat-btn-pos'

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

// Mobile gets a smaller button that sits above the bottom navigation bar.
const DESKTOP_SIZE = 80
const MOBILE_SIZE = 52
const MOBILE_NAV_CLEARANCE = 100

/** Chat bubble with an AI sparkle, used for the compact mobile button. */
function ChatSparkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
      <path
        d="M20 11.5a8 8 0 0 1-11.6 7.1L4 20l1.4-4.2A8 8 0 1 1 20 11.5Z"
        stroke="#fff"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 7.5l1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z" fill="#fff" />
    </svg>
  )
}

function getSavedPos(btnSize: number, bottomGap = 28): { x: number; y: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
        return {
          x: clamp(parsed.x, 0, window.innerWidth - btnSize),
          y: clamp(parsed.y, 0, window.innerHeight - btnSize),
        }
      }
    }
  } catch {}
  return {
    x: window.innerWidth - btnSize - (bottomGap > 28 ? 16 : 24),
    y: window.innerHeight - btnSize - bottomGap,
  }
}

export default function SupportChatButton() {
  const { pathname } = useLocation()
  const isMobile = useIsMobile()
  const navigate = useNavigate()
  const btnSize = isMobile ? MOBILE_SIZE : DESKTOP_SIZE
  // Lowest the button may sit: on mobile, keep it clear of the bottom nav.
  const bottomGap = isMobile ? MOBILE_NAV_CLEARANCE : 0

  const [pos, setPos] = useState<{ x: number; y: number }>(() => {
    const p = getSavedPos(btnSize, isMobile ? MOBILE_NAV_CLEARANCE : 28)
    return { x: p.x, y: clamp(p.y, 0, window.innerHeight - btnSize - bottomGap) }
  })
  const [hovered, setHovered] = useState(false)
  const dragging = useRef(false)
  const didDrag = useRef(false)
  const startPointer = useRef({ x: 0, y: 0 })
  const startPos = useRef({ x: 0, y: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  /* Snap into viewport on resize */
  useEffect(() => {
    const onResize = () => {
      setPos((prev) => ({
        x: clamp(prev.x, 0, window.innerWidth - btnSize),
        y: clamp(prev.y, 0, window.innerHeight - btnSize - bottomGap),
      }))
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [btnSize, bottomGap])

  function startDrag(clientX: number, clientY: number) {
    dragging.current = true
    didDrag.current = false
    startPointer.current = { x: clientX, y: clientY }
    startPos.current = { ...pos }
    setHovered(false)
    document.body.style.userSelect = 'none'
  }

  function onDragMove(clientX: number, clientY: number) {
    if (!dragging.current) return
    const dx = clientX - startPointer.current.x
    const dy = clientY - startPointer.current.y
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      didDrag.current = true
    }
    const nextX = clamp(startPos.current.x + dx, 0, window.innerWidth - btnSize)
    const nextY = clamp(startPos.current.y + dy, 0, window.innerHeight - btnSize - bottomGap)
    setPos({ x: nextX, y: nextY })
  }

  function endDrag() {
    if (!dragging.current) return
    dragging.current = false
    document.body.style.userSelect = ''
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pos))
    } catch {}
  }

  /* Mouse */
  useEffect(() => {
    const onMove = (e: MouseEvent) => onDragMove(e.clientX, e.clientY)
    const onUp = () => endDrag()
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  })

  /* Touch */
  useEffect(() => {
    const onMove = (e: TouchEvent) => {
      const t = e.touches[0]
      onDragMove(t.clientX, t.clientY)
    }
    const onEnd = () => endDrag()
    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
    return () => {
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
    }
  })

  function handleClick() {
    if (didDrag.current) return
    navigate('/support')
  }

  /* Decide popup position: left or right of button */
  const popupOnLeft = pos.x > window.innerWidth / 2

  // The mobile website has its own chat link in the top bar.
  // Shopper-facing assistant: hidden in the admin console, where it covers table actions.
  if (pathname === '/support' || isAdminPath(pathname) || (isMobile && pathname === '/')) return null

  const showPopup = hovered && !dragging.current

  /* Popup position: appear to the left when button is on right half */
  const popupWidth = 234
  const popupLeft = popupOnLeft
    ? pos.x - popupWidth + btnSize          // right-align with button
    : pos.x                                  // left-align with button

  const content = (
    <div
      className={`support-chat-wrapper${isMobile ? ' support-chat-wrapper--compact' : ''}`}
      style={{ left: pos.x, top: pos.y }}
      onMouseEnter={() => { if (!didDrag.current) setHovered(true) }}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Popup card – rendered as sibling via portal parent, positioned absolutely */}
      <div
        style={{
          position: 'fixed',
          left: popupLeft,
          top: pos.y - 14 - 178, // 178px = approx popup height
          width: popupWidth,
          background: '#ffffff',
          borderRadius: 16,
          padding: '14px 16px 12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10), 0 0 0 1px rgba(56,189,248,0.14)',
          opacity: showPopup ? 1 : 0,
          transform: showPopup ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.96)',
          transformOrigin: popupOnLeft ? 'bottom right' : 'bottom left',
          transition: 'opacity 0.22s ease, transform 0.22s ease',
          pointerEvents: showPopup ? 'auto' : 'none',
          zIndex: 9999,
          fontFamily: 'var(--font-ui)',
        }}
        aria-hidden={!showPopup}
      >
        {/* Tail arrow */}
        <div style={{
          position: 'absolute',
          bottom: -7,
          ...(popupOnLeft ? { right: 20 } : { left: 20 }),
          width: 14,
          height: 14,
          background: '#ffffff',
          borderRight: '1px solid rgba(56,189,248,0.18)',
          borderBottom: '1px solid rgba(56,189,248,0.18)',
          transform: 'rotate(45deg)',
          borderRadius: 2,
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{
            fontSize: 'var(--text-micro)', fontWeight: 700, letterSpacing: '0.08em',
            color: '#0ea5e9', background: 'rgba(14,165,233,0.1)',
            padding: '2px 7px', borderRadius: 20, textTransform: 'uppercase',
          }}>AI COMPANION</span>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#22c55e',
            boxShadow: '0 0 6px rgba(34,197,94,0.7)', flexShrink: 0, display: 'inline-block',
          }} />
          <span style={{ fontSize: 'var(--text-micro)', fontWeight: 500, color: '#22c55e' }}>Online</span>
        </div>

        <p style={{ margin: '0 0 4px', fontSize: 'var(--text-body-sm)', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
          Hey there! 👋
        </p>
        <p style={{ margin: '0 0 12px', fontSize: 'var(--text-caption)', color: '#64748b', lineHeight: 1.5 }}>
          I'm your PhoneFix AI assistant. Ask me anything about repairs, orders, or devices.
        </p>
        <button
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            width: '100%', padding: '8px 14px',
            background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
            color: '#ffffff', fontSize: 'var(--text-caption)', fontWeight: 600,
            border: 'none', borderRadius: 10, cursor: 'pointer',
            fontFamily: 'inherit', letterSpacing: '0.02em',
            transition: 'opacity 0.15s ease',
          }}
          onClick={(e) => { e.stopPropagation(); navigate('/support') }}
          tabIndex={showPopup ? 0 : -1}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          💬 Chat Now
        </button>
      </div>

      {/* Floating button */}
      <button
        ref={btnRef}
        aria-label="Open the PhoneFix AI assistant"
        className="support-chat-button"
        onMouseDown={(e) => { e.preventDefault(); startDrag(e.clientX, e.clientY) }}
        onTouchStart={(e) => { const t = e.touches[0]; startDrag(t.clientX, t.clientY) }}
        onClick={handleClick}
      >
        <span className="support-chat-button-inner">
          <span className="support-chat-button-ring" aria-hidden="true" />
          {isMobile ? <ChatSparkIcon /> : <ChatAssistantIcon size={54} />}
        </span>
      </button>
    </div>
  )

  return createPortal(content, document.body)
}
