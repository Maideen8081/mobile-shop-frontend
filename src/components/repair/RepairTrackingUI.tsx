import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { RepairTicket } from '../../services/repairService'
import type { RepairActions } from './useRepairActions'
import { STAGES, isClosed, resolveMediaUrl, stageIndex, statusMeta } from './repairStatus'

export function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`msi material-symbols-outlined ${className}`} aria-hidden="true">{name}</span>
}

export function StatusPill({ status }: { status: string }) {
  const meta = statusMeta(status)
  return (
    <span className={`rt-pill tone-${meta.tone}`}>
      <Icon name={meta.icon} />
      {meta.label}
    </span>
  )
}

export function StageTracker({ status, large = false }: { status: string; large?: boolean }) {
  const current = stageIndex(status)
  const closed = current < 0
  const complete = current === STAGES.length - 1
  const meta = statusMeta(status)
  return (
    <ol
      className={`rt-stages${large ? ' rt-stages-large' : ''}${closed ? ' is-closed' : ''}${complete ? ' is-complete' : ''}`}
      aria-label={closed ? `Repair ${meta.label.toLowerCase()}` : `Stage ${current + 1} of ${STAGES.length}: ${STAGES[current].label}`}
    >
      {STAGES.map((s, i) => {
        const state = closed ? '' : i < current ? 'is-done' : i === current ? 'is-current' : ''
        return (
          <li key={s.key} className={`rt-stage ${state}`} aria-current={i === current ? 'step' : undefined}>
            <span className="rt-stage-dot">{large && <Icon name={s.icon} />}</span>
            {s.label}
          </li>
        )
      })}
    </ol>
  )
}

export function DeviceThumb({ ticket }: { ticket: RepairTicket }) {
  const [failed, setFailed] = useState(false)
  const src = ticket.thumbnail || ticket.images[0]
  return (
    <div className="rt-thumb">
      {src && !failed
        ? <img src={resolveMediaUrl(src)} alt="" loading="lazy" onError={() => setFailed(true)} />
        : <Icon name="smartphone" />}
    </div>
  )
}

export function Dialog({ title, description, onClose, children }: {
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLElement>('input, textarea, button')?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current() }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      prev?.focus()
    }
  }, [])

  return (
    <div className="rt-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="rt-dialog" role="dialog" aria-modal="true" aria-labelledby="rt-dialog-title" ref={ref}>
        <h2 id="rt-dialog-title">{title}</h2>
        {description && <p>{description}</p>}
        {children}
      </div>
    </div>
  )
}

/** Primary next-step buttons for a ticket, shared by the list card and the detail page. */
export function TicketActions({ ticket, actions, compact = false }: {
  ticket: RepairTicket
  actions: RepairActions
  compact?: boolean
}) {
  const busy = actions.busyId === ticket.id
  const size = compact ? ' rt-btn-sm' : ''
  if (isClosed(ticket)) return null
  return (
    <>
      {ticket.status === 'Accepted' && !ticket.courier && (
        <button type="button" className={`rt-btn rt-btn-primary${size}`} disabled={busy} onClick={() => actions.ship(ticket)}>
          <Icon name="local_shipping" /> Add shipping details
        </button>
      )}
      {(ticket.status === 'Submitted' || ticket.status === 'Accepted') && (
        <button type="button" className={`rt-btn rt-btn-danger${size}`} disabled={busy} onClick={() => actions.cancel(ticket)}>
          Cancel request
        </button>
      )}
    </>
  )
}
