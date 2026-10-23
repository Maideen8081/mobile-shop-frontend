import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import '../components/repair/repairTracking.css'
import { repairService, type RepairTicket } from '../services/repairService'
import {
  FILTERS,
  type FilterKey,
  formatDate,
  formatPrice,
  isClosed,
  isCompleted,
  lastActivity,
  matchesFilter,
  needsAction,
  statusMeta,
  ticketAmount,
  timeAgo,
} from '../components/repair/repairStatus'
import {
  DeviceThumb,
  Icon,
  StageTracker,
  StatusPill,
  TicketActions,
} from '../components/repair/RepairTrackingUI'
import { useRepairActions, type RepairActions } from '../components/repair/useRepairActions'

const REFRESH_MS = 60_000

type SortKey = 'updated' | 'newest' | 'oldest'

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'updated', label: 'Recently updated' },
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
]

function isFilterKey(v: string | null): v is FilterKey {
  return FILTERS.some(f => f.key === v)
}

function isSortKey(v: string | null): v is SortKey {
  return SORTS.some(s => s.key === v)
}

export default function CustomerRepairTracking() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const [tickets, setTickets] = useState<RepairTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(false)
  const [syncedAt, setSyncedAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const inFlight = useRef(false)

  const filter: FilterKey = isFilterKey(params.get('status')) ? params.get('status') as FilterKey : 'all'
  const sort: SortKey = isSortKey(params.get('sort')) ? params.get('sort') as SortKey : 'updated'
  const query = params.get('q') ?? ''

  const setParam = (key: string, value: string, fallback: string) => {
    setParams(prev => {
      const next = new URLSearchParams(prev)
      if (!value || value === fallback) next.delete(key)
      else next.set(key, value)
      return next
    }, { replace: true })
  }

  const load = useCallback(async (mode: 'manual' | 'silent') => {
    if (inFlight.current) return
    inFlight.current = true
    try {
      const data = await repairService.myTickets()
      setTickets(data)
      setError(false)
      setSyncedAt(Date.now())
    } catch {
      // Keep showing the last good data on a background refresh failure.
      if (mode !== 'silent') setError(true)
    } finally {
      inFlight.current = false
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    inFlight.current = true
    repairService.myTickets()
      .then(data => { setTickets(data); setSyncedAt(Date.now()) })
      .catch(() => setError(true))
      .finally(() => { inFlight.current = false; setLoading(false) })
    const tick = () => {
      setNow(Date.now())
      if (document.visibilityState === 'visible') load('silent')
    }
    const id = window.setInterval(tick, REFRESH_MS)
    const onFocus = () => load('silent')
    window.addEventListener('focus', onFocus)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('focus', onFocus)
    }
  }, [load])

  const refresh = () => {
    setRefreshing(true)
    load('manual')
  }

  const replaceTicket = useCallback((updated: RepairTicket) => {
    setTickets(prev => prev.map(t => (t.id === updated.id
      ? { ...t, ...updated, thumbnail: t.thumbnail ?? updated.thumbnail, lastUpdate: updated.lastUpdate ?? t.lastUpdate }
      : t)))
    // The detail payload has no last_update; fetch the list again so the row stays accurate.
    load('silent')
  }, [load])

  const actions = useRepairActions(replaceTicket)

  const counts = useMemo(() => {
    const c = {} as Record<FilterKey, number>
    for (const f of FILTERS) c[f.key] = tickets.filter(t => matchesFilter(t, f.key)).length
    return c
  }, [tickets])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const rows = tickets.filter(t => {
      if (!matchesFilter(t, filter)) return false
      if (!q) return true
      return [t.repairId, t.deviceBrand, t.deviceModel, `${t.deviceBrand} ${t.deviceModel}`, t.imei, t.issueCategory]
        .some(v => v?.toLowerCase().includes(q))
    })
    const time = (s: string) => new Date(s).getTime() || 0
    return rows.sort((a, b) => {
      if (sort === 'oldest') return time(a.createdAt) - time(b.createdAt)
      if (sort === 'newest') return time(b.createdAt) - time(a.createdAt)
      // Things that need the customer float to the top of "recently updated".
      const pa = needsAction(a) ? 1 : 0
      const pb = needsAction(b) ? 1 : 0
      return pb - pa || time(lastActivity(b)) - time(lastActivity(a))
    })
  }, [tickets, filter, query, sort])

  const activeCount = counts.active
  const hasFilters = filter !== 'all' || query.trim() !== ''

  return (
    <div className="rt">
      {/* Desktop nav */}
      <div className="hidden lg:block"><SiteTopNav /></div>

      {/* Mobile header */}
      <header className="rt-mhead lg:hidden">
        <div className="rt-mhead-row">
          <button type="button" className="rt-mhead-btn" onClick={() => navigate(-1)} aria-label="Go back">
            <Icon name="arrow_back" />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1>My Repairs</h1>
            <p>{loading ? 'Loading…' : `${activeCount} in progress · ${counts.completed} completed`}</p>
          </div>
          <button type="button" className="rt-mhead-btn" onClick={refresh} aria-label="Refresh" disabled={refreshing}>
            <Icon name="refresh" className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Desktop hero */}
      <section className="rt-hero hidden lg:block">
        <div className="rt-shell rt-hero-inner">
          <div>
            <div className="rt-eyebrow"><Icon name="build_circle" /> Repair center</div>
            <h1 className="rt-title">My Repairs</h1>
            <p className="rt-sub">Follow each device from booking to delivery, approve estimates, and message our technicians — all in one place.</p>
          </div>
          <div className="rt-hero-side">
            <div className="rt-kpis" aria-label="Repair summary">
              <div className="rt-kpi">
                <div className="rt-kpi-num">{loading ? '–' : activeCount}</div>
                <div className="rt-kpi-label">In progress</div>
              </div>
              <div className={`rt-kpi${counts.action ? ' is-action' : ''}`}>
                <div className="rt-kpi-num">{loading ? '–' : counts.action}</div>
                <div className="rt-kpi-label">Needs your action</div>
              </div>
              <div className="rt-kpi is-done">
                <div className="rt-kpi-num">{loading ? '–' : counts.completed}</div>
                <div className="rt-kpi-label">Completed</div>
              </div>
            </div>
            <Link to="/repairs" className="rt-btn rt-btn-primary"><Icon name="add" /> Book a repair</Link>
          </div>
        </div>
      </section>

      <main className="rt-shell" aria-label="My repairs">
        {/* Search / sort / refresh */}
        <div className="rt-toolbar">
          <label className="rt-search">
            <Icon name="search" />
            <input
              type="search"
              value={query}
              onChange={(e) => setParam('q', e.target.value, '')}
              placeholder="Search by ticket ID, device or IMEI"
              aria-label="Search repairs"
            />
            {query && (
              <button type="button" className="rt-btn rt-btn-ghost rt-btn-sm rt-icon-btn" onClick={() => setParam('q', '', '')} aria-label="Clear search">
                <Icon name="close" />
              </button>
            )}
          </label>
          <select className="rt-select" value={sort} onChange={(e) => setParam('sort', e.target.value, 'updated')} aria-label="Sort repairs">
            {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
          <div className="hidden lg:flex" style={{ alignItems: 'center', gap: 10 }}>
            {syncedAt && <span className="rt-refresh-meta" aria-live="polite">Updated {timeAgo(new Date(syncedAt).toISOString(), now)}</span>}
            <button type="button" className="rt-btn rt-icon-btn" onClick={refresh} disabled={refreshing} aria-label="Refresh repairs" title="Refresh">
              <Icon name="refresh" className={refreshing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Status tabs */}
        <div className="rt-tabs" role="tablist" aria-label="Filter by status">
          {FILTERS.map(f => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              className={`rt-tab${filter === f.key ? ' is-active' : ''}${f.key === 'action' && counts.action ? ' is-alert' : ''}`}
              onClick={() => setParam('status', f.key, 'all')}
            >
              {f.label}
              <span className="rt-tab-count">{loading ? '·' : counts[f.key]}</span>
            </button>
          ))}
        </div>

        {/* Nudge toward pending customer actions */}
        {!loading && counts.action > 0 && filter !== 'action' && (
          <div className="rt-callout" role="status">
            <div className="rt-callout-icon"><Icon name="notifications_active" /></div>
            <div className="rt-callout-text">
              <strong>{counts.action === 1 ? '1 repair needs' : `${counts.action} repairs need`} your attention.</strong>{' '}
              Approve an estimate or share shipping details to keep things moving.
            </div>
            <button type="button" className="rt-btn rt-btn-sm" onClick={() => setParam('status', 'action', 'all')}>Review</button>
          </div>
        )}

        {loading ? (
          <div className="rt-list" aria-busy="true">
            {[0, 1, 2].map(i => (
              <div key={i} className="rt-card" style={{ padding: 20, display: 'flex', gap: 18 }}>
                <div className="rt-skel" style={{ width: 76, height: 76, borderRadius: 14, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="rt-skel" style={{ height: 18, width: '40%', marginBottom: 10 }} />
                  <div className="rt-skel" style={{ height: 12, width: '60%', marginBottom: 18 }} />
                  <div className="rt-skel" style={{ height: 10, width: '100%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : error && tickets.length === 0 ? (
          <div className="rt-empty" role="alert">
            <div className="rt-empty-icon"><Icon name="wifi_off" /></div>
            <h3>We couldn't load your repairs</h3>
            <p>Check your connection and try again. Your repair requests are safe.</p>
            <button type="button" className="rt-btn rt-btn-primary" onClick={() => { setLoading(true); load('manual') }}>
              <Icon name="refresh" /> Try again
            </button>
          </div>
        ) : visible.length === 0 ? (
          <div className="rt-empty">
            <div className="rt-empty-icon"><Icon name={hasFilters ? 'search_off' : 'build'} /></div>
            {tickets.length === 0 ? (
              <>
                <h3>No repairs yet</h3>
                <p>Cracked screen, weak battery or something else? Book a repair and track it here from pickup to delivery.</p>
                <Link to="/repairs" className="rt-btn rt-btn-primary"><Icon name="add" /> Book your first repair</Link>
              </>
            ) : (
              <>
                <h3>No matching repairs</h3>
                <p>{query ? `Nothing matches "${query}"` : 'There are no repairs in this view'}. Try another filter or search term.</p>
                <button type="button" className="rt-btn" onClick={() => setParams(new URLSearchParams(), { replace: true })}>Clear filters</button>
              </>
            )}
          </div>
        ) : (
          <section className="rt-list" aria-label={`${visible.length} repair${visible.length === 1 ? '' : 's'}`}>
            {visible.map(t => <RepairCard key={t.id} ticket={t} actions={actions} now={now} />)}
          </section>
        )}

        <aside className="rt-help">
          <div className="rt-help-text">
            <strong>Questions about a repair?</strong>
            Open any repair to message the technician working on it, or chat with our support team.
          </div>
          <Link to="/support" className="rt-btn"><Icon name="support_agent" /> Contact support</Link>
        </aside>
      </main>

      {actions.dialog}


      {/* Mobile CTA */}
      <div className="rt-mbar lg:hidden">
        <Link to="/repairs" className="rt-btn rt-btn-primary"><Icon name="add_circle" /> Book a repair</Link>
      </div>
    </div>
  )
}

function RepairCard({ ticket, actions, now }: {
  ticket: RepairTicket
  actions: RepairActions
  now: number
}) {
  const navigate = useNavigate()
  const meta = statusMeta(ticket.status)
  const amount = ticketAmount(ticket)
  const awaiting = ticket.status === 'Awaiting Approval'
  const busy = actions.busyId === ticket.id
  const open = () => navigate(`/my-repairs/${ticket.id}`)
  const active = !isClosed(ticket) && !isCompleted(ticket)

  const amountLabel = ticket.repairCharge ? (ticket.customerApproved ? 'Approved charge' : 'Quoted charge') : 'Estimate'
  const update = ticket.lastUpdate
  const updateText = update
    ? (update.notes && update.notes !== 'Ticket created.' ? update.notes : `${statusMeta(update.status).label}`)
    : `Booked on ${formatDate(ticket.createdAt)}`

  return (
    <article className={`rt-card${needsAction(ticket) ? ' is-action' : ''}`}>
      <button type="button" className="rt-card-main" onClick={open} aria-label={`Open repair ${ticket.repairId}, ${ticket.deviceBrand} ${ticket.deviceModel}, ${meta.label}`}>
        <DeviceThumb ticket={ticket} />
        <div className="rt-card-body">
          <h3 className="rt-card-title">{ticket.deviceBrand} {ticket.deviceModel}</h3>
          <div className="rt-meta">
            <span className="rt-ticket-id">{ticket.repairId}</span>
            {ticket.issueCategory && <><span className="rt-meta-dot" />{ticket.issueCategory}</>}
            <span className="rt-meta-dot" />Booked {formatDate(ticket.createdAt)}
          </div>
          <StageTracker status={ticket.status} />
          {meta.hint && <p className="rt-hint">{meta.hint}</p>}
        </div>
        <div className="rt-card-side">
          <StatusPill status={ticket.status} />
          <div className="rt-amount">
            {amount !== null ? (
              <>
                <div className="rt-amount-num">{formatPrice(amount)}</div>
                <div className="rt-amount-label">{amountLabel}</div>
              </>
            ) : (
              <div className="rt-amount-label">Quote pending</div>
            )}
            {active && ticket.estimatedDays > 0 && (
              <div className="rt-amount-label">~{ticket.estimatedDays} day{ticket.estimatedDays > 1 ? 's' : ''} to complete</div>
            )}
          </div>
        </div>
      </button>

      {awaiting && (
        <div className="rt-estimate">
          <div>
            <div className="rt-estimate-label">Estimate awaiting your approval</div>
            <div className="rt-estimate-reason">{ticket.repairReason || 'Our technician has diagnosed the issue. Open the repair for full details.'}</div>
          </div>
          <div className="rt-estimate-price">{ticket.repairCharge ? formatPrice(ticket.repairCharge) : '—'}</div>
          <div className="rt-estimate-actions">
            <button type="button" className="rt-btn rt-btn-primary rt-btn-sm" disabled={busy} onClick={() => actions.approve(ticket)}>
              <Icon name="check" /> {busy ? 'Approving…' : 'Approve & start repair'}
            </button>
            <button type="button" className="rt-btn rt-btn-sm" disabled={busy} onClick={() => actions.decline(ticket)}>Decline</button>
          </div>
        </div>
      )}

      <div className="rt-card-foot">
        <div className="rt-update" title={update?.created_at ? new Date(update.created_at).toLocaleString('en-IN') : undefined}>
          <Icon name="history" />
          <span className="text">{updateText}</span>
          {update?.created_at && <span style={{ whiteSpace: 'nowrap' }}>· {timeAgo(update.created_at, now)}</span>}
        </div>
        <div className="rt-actions">
          <TicketActions ticket={ticket} actions={actions} compact />
          <button type="button" className="rt-btn rt-btn-sm" onClick={open}>
            Details <Icon name="chevron_right" />
          </button>
        </div>
      </div>
    </article>
  )
}
