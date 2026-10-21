import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import EcommerceFooter from '../components/ecommerce/Footer'
import '../components/ecommerce/SiteTopNav.css'
import '../components/repair/repairTracking.css'
import '../components/repair/repairDetail.css'
import { repairService, type RepairTicket } from '../services/repairService'
import { useToast } from '../context/ToastContext'
import {
  canCancel,
  formatDate,
  formatDateTime,
  formatPrice,
  isClosed,
  isCompleted,
  resolveMediaUrl,
  statusMeta,
  ticketAmount,
} from '../components/repair/repairStatus'
import {
  DeviceThumb,
  Icon,
  StageTracker,
  StatusPill,
  TicketActions,
} from '../components/repair/RepairTrackingUI'
import { useRepairActions } from '../components/repair/useRepairActions'

const MESSAGE_POLL_MS = 30_000

export default function RepairDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const [ticket, setTicket] = useState<RepairTicket | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!id) return
    try {
      const data = await repairService.getTicketById(Number(id))
      setTicket(data)
      setNotFound(false)
    } catch {
      if (!silent) setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    repairService.getTicketById(Number(id))
      .then(data => { if (!cancelled) setTicket(data) })
      .catch(() => { if (!cancelled) setNotFound(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    // Pick up technician replies and status changes while the page is open.
    const poll = window.setInterval(() => { if (document.visibilityState === 'visible') load(true) }, MESSAGE_POLL_MS)
    const onFocus = () => load(true)
    window.addEventListener('focus', onFocus)
    return () => {
      cancelled = true
      window.clearInterval(poll)
      window.removeEventListener('focus', onFocus)
    }
  }, [id, load])

  const actions = useRepairActions(setTicket)

  const copyId = async () => {
    if (!ticket) return
    try {
      await navigator.clipboard.writeText(ticket.repairId)
      toast.show('Ticket ID copied', 'success')
    } catch {
      toast.show('Could not copy ticket ID', 'error')
    }
  }

  const shell = (children: React.ReactNode) => (
    <div className="rt">
      <div className="hidden lg:block"><SiteTopNav /></div>
      <header className="rt-mhead lg:hidden">
        <div className="rt-mhead-row">
          <button type="button" className="rt-mhead-btn" onClick={() => navigate('/my-repairs')} aria-label="Back to my repairs">
            <Icon name="arrow_back" />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="truncate">{ticket ? `${ticket.deviceBrand} ${ticket.deviceModel}` : 'Repair details'}</h1>
            {ticket && <p>{ticket.repairId}</p>}
          </div>
        </div>
      </header>
      <main className="rt-shell rd-main">
        <Link to="/my-repairs" className="rd-back hidden lg:inline-flex"><Icon name="arrow_back" /> My repairs</Link>
        {children}
      </main>
      {actions.dialog}
      <div className="hidden lg:block"><EcommerceFooter compact /></div>
    </div>
  )

  if (loading) {
    return shell(
      <div aria-busy="true">
        <div className="rt-card" style={{ padding: 24, marginBottom: 20 }}>
          <div className="rt-skel" style={{ height: 22, width: '35%', marginBottom: 12 }} />
          <div className="rt-skel" style={{ height: 14, width: '50%', marginBottom: 28 }} />
          <div className="rt-skel" style={{ height: 30, width: '100%' }} />
        </div>
        <div className="rt-skel" style={{ height: 240, borderRadius: 18 }} />
      </div>,
    )
  }

  if (notFound || !ticket) {
    return shell(
      <div className="rt-empty" style={{ marginTop: 24 }}>
        <div className="rt-empty-icon"><Icon name="search_off" /></div>
        <h3>Repair not found</h3>
        <p>This repair doesn't exist or isn't linked to your account.</p>
        <Link to="/my-repairs" className="rt-btn rt-btn-primary">Back to my repairs</Link>
      </div>,
    )
  }

  const meta = statusMeta(ticket.status)
  const amount = ticketAmount(ticket)
  const awaiting = ticket.status === 'Awaiting Approval'
  const busy = actions.busyId === ticket.id
  const active = !isClosed(ticket) && !isCompleted(ticket)

  return shell(
    <>
      {/* Overview */}
      <section className="rt-card rd-overview">
        <div className="rd-overview-top">
          <DeviceThumb ticket={ticket} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="rd-title">{ticket.deviceBrand} {ticket.deviceModel}</h1>
            <div className="rt-meta">
              <button type="button" className="rd-copy" onClick={copyId} title="Copy ticket ID">
                <span className="rt-ticket-id">{ticket.repairId}</span>
                <Icon name="content_copy" />
              </button>
              <span className="rt-meta-dot" />Booked {formatDate(ticket.createdAt)}
              {ticket.issueCategory && <><span className="rt-meta-dot" />{ticket.issueCategory}</>}
            </div>
          </div>
          <StatusPill status={ticket.status} />
        </div>
        <StageTracker status={ticket.status} large />
        <div className={`rd-now tone-${meta.tone}`}>
          <Icon name={meta.icon} />
          <div>
            <strong>{meta.label}</strong>
            {meta.hint && <span> — {meta.hint}</span>}
          </div>
        </div>
        {!awaiting && <div className="rd-overview-actions"><TicketActions ticket={ticket} actions={actions} /></div>}
      </section>

      {awaiting && (
        <section className="rt-card rd-section" aria-labelledby="rd-estimate">
          <div className="rt-estimate" style={{ margin: 0 }}>
            <div>
              <div className="rt-estimate-label" id="rd-estimate">Estimate awaiting your approval</div>
              <div className="rt-estimate-reason">{ticket.repairReason || 'Our technician has diagnosed the issue.'}</div>
            </div>
            <div className="rt-estimate-price">{ticket.repairCharge ? formatPrice(ticket.repairCharge) : '—'}</div>
            <div className="rt-estimate-actions">
              <button type="button" className="rt-btn rt-btn-primary" disabled={busy} onClick={() => actions.approve(ticket)}>
                <Icon name="check" /> {busy ? 'Approving…' : 'Approve & start repair'}
              </button>
              <button type="button" className="rt-btn" disabled={busy} onClick={() => actions.decline(ticket)}>Decline</button>
            </div>
          </div>
          <p className="rd-fine">Have a question about the estimate? Send the technician a message below before deciding.</p>
        </section>
      )}

      <div className="rd-grid">
        <div className="rd-col">
          <Messages ticket={ticket} onUpdated={setTicket} />
          <Timeline ticket={ticket} />
        </div>

        <div className="rd-col">
          <section className="rt-card rd-section">
            <h2 className="rd-h2"><Icon name="receipt_long" /> Repair summary</h2>
            <dl className="rd-dl">
              <Row label={ticket.repairCharge ? (ticket.customerApproved ? 'Approved charge' : 'Quoted charge') : 'Estimate'}
                value={amount !== null ? formatPrice(amount) : 'Quote pending'} strong />
              {active && <Row label="Expected time" value={ticket.estimatedDays > 0 ? `~${ticket.estimatedDays} day${ticket.estimatedDays > 1 ? 's' : ''}` : 'Shared after diagnosis'} />}
              <Row label="Technician" value={ticket.technicianName || (ticket.technicianId ? String(ticket.technicianId) : 'Assigned after intake')} />
              {ticket.repairReason && !awaiting && <Row label="Diagnosis" value={ticket.repairReason} />}
              <Row label="Last updated" value={formatDateTime(ticket.updatedAt) || '—'} />
            </dl>
          </section>

          {ticket.courier && (
            <section className="rt-card rd-section">
              <h2 className="rd-h2"><Icon name="local_shipping" /> Shipping</h2>
              <dl className="rd-dl">
                <Row label="Courier" value={ticket.courier.courier_name} />
                <Row label="Tracking no." value={ticket.courier.tracking_number} mono />
                {ticket.courier.courier_date && <Row label="Shipped on" value={formatDate(ticket.courier.courier_date)} />}
              </dl>
            </section>
          )}

          <section className="rt-card rd-section">
            <h2 className="rd-h2"><Icon name="smartphone" /> Device & issue</h2>
            <dl className="rd-dl">
              <Row label="Device" value={`${ticket.deviceBrand} ${ticket.deviceModel}`} />
              {ticket.deviceColor && <Row label="Colour" value={ticket.deviceColor} />}
              {ticket.imei && <Row label="IMEI" value={ticket.imei.replace(/(\d{4})(?=\d)/g, '$1 ')} mono />}
              {ticket.serialNumber && <Row label="Serial no." value={ticket.serialNumber} mono />}
              {ticket.warranty && ticket.warranty !== 'unknown' && <Row label="Warranty" value={ticket.warranty.replace(/_/g, ' ')} />}
              {ticket.accessories && <Row label="Accessories" value={ticket.accessories} />}
            </dl>
            {ticket.description && <ProblemDescription text={ticket.description} />}
            {ticket.images.length > 0 && <Photos images={ticket.images} />}
          </section>

          <section className="rt-card rd-section">
            <h2 className="rd-h2"><Icon name="person" /> Contact on file</h2>
            <dl className="rd-dl">
              <Row label="Name" value={ticket.customerName} />
              <Row label="Mobile" value={ticket.customerMobile} />
              {ticket.customerEmail && <Row label="Email" value={ticket.customerEmail} />}
              {ticket.customerAddress && <Row label="Address" value={ticket.customerAddress} />}
            </dl>
          </section>

          {canCancel(ticket) && (
            <p className="rd-fine" style={{ textAlign: 'center' }}>
              Changed your mind? You can cancel until your device reaches us.
            </p>
          )}
        </div>
      </div>
    </>,
  )
}

function Row({ label, value, strong, mono }: { label: string; value: string; strong?: boolean; mono?: boolean }) {
  return (
    <div className="rd-row">
      <dt>{label}</dt>
      <dd className={`${strong ? 'is-strong' : ''}${mono ? ' is-mono' : ''}`}>{value || '—'}</dd>
    </div>
  )
}

/** Booking form stores the guided questionnaire as "Q: …\nA: …" blocks. */
function ProblemDescription({ text }: { text: string }) {
  const blocks = text.split(/\n(?=Q:)/)
  return (
    <div className="rd-desc">
      <div className="rd-desc-label">Problem described</div>
      {blocks.map((block, i) => {
        const [q, a] = block.split(/\nA:\s*/)
        if (a !== undefined) {
          return (
            <div key={i} className="rd-qa">
              <div className="rd-q">{q.replace(/^Q:\s*/, '')}</div>
              <div className="rd-a">{a}</div>
            </div>
          )
        }
        return <p key={i} className="rd-a" style={{ whiteSpace: 'pre-wrap', margin: '0 0 8px' }}>{block}</p>
      })}
    </div>
  )
}

function Photos({ images }: { images: string[] }) {
  const urls = useMemo(() => images.map(resolveMediaUrl), [images])
  const [open, setOpen] = useState<number | null>(null)

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
      if (e.key === 'ArrowRight') setOpen(i => (i === null ? 0 : (i + 1) % urls.length))
      if (e.key === 'ArrowLeft') setOpen(i => (i === null ? 0 : (i - 1 + urls.length) % urls.length))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, urls.length])

  return (
    <>
      <div className="rd-desc-label" style={{ marginTop: 16 }}>Photos</div>
      <div className="rd-photos">
        {urls.map((u, i) => (
          <button key={u + i} type="button" className="rd-photo" onClick={() => setOpen(i)} aria-label={`View photo ${i + 1}`}>
            <img src={u} alt="" loading="lazy" />
          </button>
        ))}
      </div>
      {open !== null && (
        <div className="rt-overlay rd-lightbox" onClick={() => setOpen(null)} role="dialog" aria-modal="true" aria-label="Photo viewer">
          <img src={urls[open]} alt={`Device photo ${open + 1}`} onClick={(e) => e.stopPropagation()} />
          <span className="rd-lightbox-count">{open + 1} / {urls.length}</span>
          <button type="button" className="rt-mhead-btn rd-lightbox-close" onClick={() => setOpen(null)} aria-label="Close"><Icon name="close" /></button>
        </div>
      )}
    </>
  )
}

function Timeline({ ticket }: { ticket: RepairTicket }) {
  const items = ticket.statusHistory
  return (
    <section className="rt-card rd-section">
      <h2 className="rd-h2"><Icon name="timeline" /> Activity</h2>
      {items.length === 0 ? (
        <p className="rd-fine">No updates yet.</p>
      ) : (
        <ol className="rd-timeline">
          {items.map((h, i) => {
            const m = statusMeta(h.status)
            return (
              <li key={h.id ?? i} className={`rd-tl-item tone-${m.tone}${i === 0 ? ' is-latest' : ''}`}>
                <span className="rd-tl-dot" />
                <div className="rd-tl-head">
                  <strong>{m.label}</strong>
                  <time dateTime={h.created_at}>{formatDateTime(h.created_at)}</time>
                </div>
                {h.notes && <p>{h.notes}</p>}
                {h.updated_by && <span className="rd-tl-by">by {h.updated_by === 'Customer' ? 'you' : h.updated_by}</span>}
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}

function Messages({ ticket, onUpdated }: { ticket: RepairTicket; onUpdated: (t: RepairTicket) => void }) {
  const toast = useToast()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const count = ticket.notes.length

  useEffect(() => {
    const el = listRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [count])

  const send = async () => {
    const message = text.trim()
    if (!message || sending) return
    setSending(true)
    try {
      onUpdated(await repairService.sendMyNote(ticket.id, message))
      setText('')
    } catch {
      toast.show('Message not sent. Please try again.', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="rt-card rd-section">
      <h2 className="rd-h2"><Icon name="forum" /> Messages</h2>
      <div className="rd-chat" ref={listRef} aria-live="polite">
        {count === 0 ? (
          <p className="rd-fine" style={{ textAlign: 'center', padding: '24px 0' }}>
            No messages yet. Ask our technicians anything about this repair.
          </p>
        ) : ticket.notes.map(n => (
          <div key={n.id} className={`rd-msg ${n.is_admin ? 'from-shop' : 'from-me'}`}>
            <div className="rd-bubble">
              <div className="rd-msg-who">{n.is_admin ? (n.author_name || 'PhoneFix team') : 'You'}</div>
              <div style={{ whiteSpace: 'pre-wrap' }}>{n.message}</div>
              <time className="rd-msg-time">{formatDateTime(n.created_at)}</time>
            </div>
          </div>
        ))}
      </div>
      <form className="rd-compose" onSubmit={(e) => { e.preventDefault(); send() }}>
        <textarea
          className="rt-input"
          rows={1}
          maxLength={2000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
          placeholder="Write a message…"
          aria-label="Message"
        />
        <button type="submit" className="rt-btn rt-btn-primary rt-icon-btn" disabled={sending || !text.trim()} aria-label="Send message">
          <Icon name={sending ? 'progress_activity' : 'send'} className={sending ? 'animate-spin' : ''} />
        </button>
      </form>
    </section>
  )
}
