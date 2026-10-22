import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FiCheck, FiX, FiAlertTriangle, FiDollarSign, FiUser, FiPackage, FiRefreshCw, FiPlus, FiInbox, FiTool, FiEye } from 'react-icons/fi'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts'
import PageLayout from '../components/layout/PageLayout'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { RepairStatusBadge } from '../components/repair/WorkflowTracker'
import { repairStatuses, type RepairStatus } from '../data/repairData'
import { repairService, type RepairTicket } from '../services/repairService'
import { Btn, EmptyState, ErrorBanner, Field, KpiCard, Modal, PageHeader, Pagination, Panel, RowMenu, SearchBox, ShowingSelect, Skeleton, SortTh, StatusPill, Thumb, ToolbarBtn, apiErrorMessage, formatDate, textareaBase, timeAgo, useTable } from '../components/admin/AdminUI'

const priorityColors: Record<string, string> = { Low: 'text-text-muted', Medium: 'text-primary', High: 'text-primary', Urgent: 'text-danger' }

const STATUS_TRANSITIONS: Record<string, string[]> = {
  Submitted: ['Accepted', 'Rejected'],
  Accepted: ['Received'],
  Received: ['Diagnosing'],
  Diagnosing: ['Repair In Progress'],
  'Waiting for Parts': ['Repair In Progress'],
  'Repair In Progress': ['Quality Check'],
  'Quality Check': ['Ready for Delivery'],
  'Ready for Delivery': ['Delivered'],
}

const STATUS_TO_BACKEND: Record<string, string> = {
  Submitted: 'pending',
  Accepted: 'accepted',
  Rejected: 'rejected',
  Received: 'device_received',
  Diagnosing: 'inspection',
  'Waiting for Parts': 'waiting_parts',
  'Repair In Progress': 'repair_in_progress',
  'Quality Check': 'quality_check',
  'Ready for Delivery': 'ready_for_pickup',
  Delivered: 'completed',
  Cancelled: 'cancelled',
}

function parseQAPairs(text: string): { question: string; answer: string }[] {
  if (!text) return []
  const qaRegex = /Q:\s*(.+?)\s*A:\s*(.+?)(?=\s*Q:|$)/gs
  const matches = text.match(qaRegex)
  if (!matches) return []
  return matches.map((m) => {
    const q = m.replace(/^Q:\s*/, '').replace(/\s*A:[\s\S]*$/, '').trim()
    const a = m.replace(/^Q:[\s\S]*?A:\s*/, '').trim()
    return { question: q, answer: a }
  })
}

export default function RepairDashboard() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<RepairTicket | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const navigate = useNavigate()
  useLockBodyScroll(selectedTicket !== null)

  const [loadError, setLoadError] = useState('')
  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setLoadError('')
    try {
      setTickets((await repairService.list()) as any[])
    } catch (err) {
      setLoadError(apiErrorMessage(err, 'Could not load repair tickets.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const analytics = useMemo(() => {
    const by = (statuses: string[]) => tickets.filter((t: any) => statuses.includes(t.status)).length
    const workshop = ['Accepted', 'Received', 'Awaiting Approval', 'Diagnosing', 'Waiting for Parts', 'Repair In Progress', 'Quality Check']

    // Last 6 calendar months: tickets received vs finished in each.
    const now = new Date()
    const months = Array.from({ length: 6 }, (_, i) => new Date(now.getFullYear(), now.getMonth() - 5 + i, 1))
    const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}`
    const monthly = months.map((m) => ({ month: m.toLocaleString('en-IN', { month: 'short' }), received: 0, completed: 0, k: key(m) }))
    for (const t of tickets as any[]) {
      const c = new Date(t.createdAt)
      const row = monthly.find((r) => r.k === key(c))
      if (row) row.received++
      if (t.status === 'Delivered') {
        const u = monthly.find((r) => r.k === key(new Date(t.updatedAt || t.createdAt)))
        if (u) u.completed++
      }
    }

    const palette = ['#cb202d', '#f79009', '#2e90fa', '#17b26a', '#7a5af8', '#98a2b3']
    const issueCounts: Record<string, number> = {}
    for (const t of tickets as any[]) issueCounts[t.issueCategory || 'Other'] = (issueCounts[t.issueCategory || 'Other'] ?? 0) + 1
    const sortedIssues = Object.entries(issueCounts).sort((a, b) => b[1] - a[1])
    const issues = [...sortedIssues.slice(0, 5), ...(sortedIssues.length > 5 ? [['Other', sortedIssues.slice(5).reduce((s2, [, n]) => s2 + n, 0)] as [string, number]] : [])]
      .map(([name, value], i) => ({ name, value, color: palette[i % palette.length] }))

    const techLoad: Record<string, { open: number; done: number }> = {}
    for (const t of tickets as any[]) {
      const name = (t.technicianName || '').trim() || 'Unassigned'
      techLoad[name] ??= { open: 0, done: 0 }
      if (t.status === 'Delivered') techLoad[name].done++
      else if (!['Rejected', 'Cancelled'].includes(t.status)) techLoad[name].open++
    }

    return {
      total: tickets.length,
      pending: by(['Submitted']),
      workshop: by(workshop),
      ready: by(['Ready for Delivery']),
      done: by(['Delivered']),
      urgent: (tickets as any[]).filter((t) => ['high', 'urgent'].includes(String(t.priority).toLowerCase()) && !['Delivered', 'Rejected', 'Cancelled'].includes(t.status)).length,
      monthly,
      issues,
      tech: Object.entries(techLoad).sort((a, b) => b[1].open - a[1].open).slice(0, 5),
      recent: [...(tickets as any[])].sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()).slice(0, 6),
      stageCounts: Object.fromEntries(repairStatuses.map((st) => [st, by([st])])),
    }
  }, [tickets])

  const [search, setSearch] = useState('')
  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tickets.filter((t: any) =>
      (filterStatus === 'all' || t.status === filterStatus) &&
      (!q || [t.repairId, t.customerName, t.customerMobile, t.deviceBrand, t.deviceModel, t.issueCategory].some((v) => String(v ?? '').toLowerCase().includes(q))),
    )
  }, [tickets, filterStatus, search])
  const PRIORITY_RANK: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 }
  const table = useTable(filteredTickets, {
    sorters: {
      id: (t: any) => t.id,
      customer: (t: any) => t.customerName,
      device: (t: any) => `${t.deviceBrand} ${t.deviceModel}`,
      priority: (t: any) => PRIORITY_RANK[String(t.priority).toLowerCase()] ?? 0,
      status: (t: any) => t.status,
      cost: (t: any) => Number(t.estimatedCost || 0),
      date: (t: any) => new Date(t.createdAt).getTime() || 0,
    },
    initialSort: { key: 'date', dir: 'desc' },
    resetKey: `${filterStatus}|${search}`,
  })

  const handleAccept = async (ticket: RepairTicket) => {
    setActionLoading(ticket.repairId)
    try {
      await repairService.acceptTicket(ticket.id, 'Ticket accepted by admin')
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, status: 'Accepted' as const } : t)))
      setToast({ message: `Ticket ${ticket.repairId} accepted`, type: 'success' })
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to accept ticket'
      setToast({ message: msg, type: 'error' })
    }
    setActionLoading(null)
  }

  // Rejection needs a reason the customer will see; a dialog (not window.prompt)
  // so closing it really cancels instead of rejecting with a placeholder.
  const [rejectTarget, setRejectTarget] = useState<RepairTicket | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectError, setRejectError] = useState('')
  const [rejecting, setRejecting] = useState(false)

  const handleReject = (ticket: RepairTicket) => {
    setRejectTarget(ticket)
    setRejectReason('')
    setRejectError('')
  }

  const confirmReject = async () => {
    if (!rejectTarget) return
    const reason = rejectReason.trim()
    if (reason.length < 5) {
      setRejectError(reason ? 'Reason must be at least 5 characters' : 'Reason is required')
      return
    }
    if (reason.length > 1000) {
      setRejectError('Reason must be at most 1000 characters')
      return
    }
    setRejecting(true)
    setActionLoading(rejectTarget.repairId)
    try {
      await repairService.rejectTicket(rejectTarget.id, reason)
      setTickets((prev) => prev.map((t) => (t.id === rejectTarget.id ? { ...t, status: 'Rejected' as const } : t)))
      setToast({ message: `Ticket ${rejectTarget.repairId} rejected`, type: 'success' })
      setSelectedTicket((cur) => (cur?.id === rejectTarget.id ? null : cur))
      setRejectTarget(null)
    } catch (err: any) {
      setRejectError(err?.response?.data?.notes?.[0] || err?.response?.data?.message || err?.message || 'Failed to reject ticket')
    } finally {
      setRejecting(false)
      setActionLoading(null)
    }
  }

  return (
    <PageLayout title="Repair Service Dashboard">
      {toast !== null && (
        <div className="fixed top-4 right-4 z-[9999] bg-white border border-border rounded-xl shadow-xl p-4 flex items-center gap-3 animate-admin-in">
          <span className={`text-sm font-medium ${toast.type === 'success' ? 'text-success' : 'text-danger'}`}>{toast.message}</span>
        </div>
      )}
      <PageHeader
        title="Repairs"
        actions={
          <>
            <ToolbarBtn onClick={fetchTickets} aria-label="Refresh" title="Refresh" className="!px-3" icon={<FiRefreshCw size={15} className={loading ? 'animate-spin' : ''} />} />
            <Btn variant="primary" className="h-11 px-5" icon={<FiPlus size={16} />} onClick={() => navigate('/admin/new-repair')}>New Repair Ticket</Btn>
          </>
        }
      />

      <div className="space-y-5">
      {loadError && <ErrorBanner message={loadError} onRetry={fetchTickets} />}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard loading={loading && !tickets.length} label="Awaiting review" tone="warning" icon={<FiInbox size={16} />} value={analytics.pending}
          hint="new online bookings" onClick={() => navigate('/admin/user-bookings')} />
        <KpiCard loading={loading && !tickets.length} label="In the workshop" tone="info" icon={<FiTool size={16} />} value={analytics.workshop}
          hint={`${analytics.urgent} high priority`} onClick={() => setFilterStatus('all')} />
        <KpiCard loading={loading && !tickets.length} label="Ready for pickup" tone="success" icon={<FiCheck size={16} />} value={analytics.ready}
          hint="call the customer" onClick={() => setFilterStatus('Ready for Delivery')} />
        <KpiCard loading={loading && !tickets.length} label="Completed" tone="neutral" icon={<FiPackage size={16} />} value={analytics.done}
          hint={`${analytics.total} tickets all time`} />
      </div>

      <Panel title="Workshop pipeline" subtitle="Open tickets at each stage — click a stage to filter the list below">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {repairStatuses.map((st) => {
            const n = analytics.stageCounts[st] ?? 0
            const active = filterStatus === st
            return (
              <button key={st} type="button" onClick={() => setFilterStatus(active ? 'all' : st)}
                className={`rounded-xl px-3 py-3 text-left transition ring-1 ring-inset ${active ? 'bg-primary text-white ring-primary' : 'bg-surface-lighter ring-border hover:ring-border-dark'}`}>
                <span className={`block text-xl font-bold tabular ${active ? 'text-white' : 'text-text-primary'}`}>{n}</span>
                <span className={`block text-[11px] leading-tight mt-0.5 ${active ? 'text-white/85' : 'text-text-label'}`}>{st === 'Delivered' ? 'Completed' : st}</span>
              </button>
            )
          })}
        </div>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel title="Monthly repairs" subtitle="Received vs completed, last 6 months" className="xl:col-span-2">
          <div className="h-60 -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="rp-recv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#cb202d" stopOpacity={0.16} /><stop offset="100%" stopColor="#cb202d" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eef0f3" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#98a2b3' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#98a2b3' }} axisLine={false} tickLine={false} width={32} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e4e7ec', fontSize: 12 }} />
                <Area type="monotone" dataKey="received" name="Received" stroke="#cb202d" strokeWidth={2.25} fill="url(#rp-recv)" />
                <Area type="monotone" dataKey="completed" name="Completed" stroke="#17b26a" strokeWidth={2.25} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Issue mix" subtitle="All tickets by issue category">
          {analytics.issues.length === 0 ? (
            <p className="text-sm text-text-label py-10 text-center">No tickets yet.</p>
          ) : (
            <ul className="space-y-3">
              {analytics.issues.map((it) => (
                <li key={it.name}>
                  <div className="flex justify-between text-[13px] mb-1.5">
                    <span className="text-text-secondary truncate pr-2">{it.name}</span>
                    <span className="font-semibold text-text-primary tabular">{it.value}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-lighter overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(it.value / Math.max(1, analytics.total)) * 100}%`, background: it.color }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel title="Recently updated" subtitle="Latest changes across all tickets" className="xl:col-span-2" bodyClassName="px-5 pb-3 pt-2">
          {analytics.recent.length === 0 ? (
            <p className="text-sm text-text-label py-8 text-center">No activity yet.</p>
          ) : (
            <ul className="divide-y divide-border-light">
              {analytics.recent.map((t: any) => (
                <li key={t.id}>
                  <button type="button" onClick={() => setSelectedTicket(t)} className="w-full flex items-center gap-3 py-3 text-left hover:bg-[#f9fafb] -mx-2 px-2 rounded-lg">
                    <span className="w-9 h-9 rounded-lg bg-surface-lighter ring-1 ring-inset ring-border flex items-center justify-center text-text-muted shrink-0"><FiTool size={15} /></span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-text-primary truncate">{t.deviceBrand} {t.deviceModel} · {t.issueCategory}</span>
                      <span className="block text-xs text-text-label truncate">{t.repairId} · {t.customerName} · {timeAgo(t.updatedAt || t.createdAt)}</span>
                    </span>
                    <RepairStatusBadge status={t.status} size="sm" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Technician workload" subtitle="Open vs completed tickets">
          {analytics.tech.length === 0 ? (
            <p className="text-sm text-text-label py-8 text-center">No assignments yet.</p>
          ) : (
            <ul className="space-y-3">
              {analytics.tech.map(([name, load]) => (
                <li key={name} className="flex items-center gap-3">
                  <Thumb name={name} />
                  <span className="flex-1 min-w-0">
                    <span className={`block text-sm font-medium truncate ${name === 'Unassigned' ? 'text-warning' : 'text-text-primary'}`}>{name}</span>
                    <span className="block text-xs text-text-label">{load.done} completed</span>
                  </span>
                  <span className="text-sm font-semibold text-text-primary tabular">{load.open}<span className="text-xs font-normal text-text-label"> open</span></span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {filterStatus !== 'all' && (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          Showing <StatusPill tone="info">{filterStatus}</StatusPill> tickets
          <button type="button" className="text-primary font-semibold hover:underline" onClick={() => setFilterStatus('all')}>Show all</button>
        </div>
      )}
      </div>

      <div className="table-wrap mt-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 pt-5 pb-4">
          <div>
            <h3 className="text-[15px] font-semibold text-text-primary">All repair tickets</h3>
            <p className="text-xs text-text-label mt-0.5">
              {filteredTickets.length} shown · <span className="text-warning font-semibold">{analytics.pending} awaiting review</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <SearchBox value={search} onChange={setSearch} placeholder="Search tickets" />
            <ShowingSelect value={table.pageSize} onChange={table.setPageSize} />
          </div>
        </div>
        {loading && !tickets.length ? (
          <div className="p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : table.total === 0 ? (
          <EmptyState icon={<FiTool size={20} />} title={tickets.length ? 'No tickets match' : 'No repair tickets yet'}
            description={tickets.length ? 'Try another stage or search.' : 'Walk-in tickets and online bookings appear here.'}
            action={!tickets.length ? <Btn variant="primary" size="sm" onClick={() => navigate('/admin/new-repair')}>Create ticket</Btn> : undefined} />
        ) : (
          <>
            <div className="table-scroll">
              <table className="min-w-[960px]">
                <thead>
                  <tr>
                    <SortTh label="Ticket" sortKey="id" sort={table.sort} onSort={table.toggleSort} />
                    <SortTh label="Customer" sortKey="customer" sort={table.sort} onSort={table.toggleSort} />
                    <SortTh label="Device & issue" sortKey="device" sort={table.sort} onSort={table.toggleSort} />
                    <SortTh label="Priority" sortKey="priority" sort={table.sort} onSort={table.toggleSort} />
                    <SortTh label="Status" sortKey="status" sort={table.sort} onSort={table.toggleSort} />
                    <SortTh label="Estimate" sortKey="cost" align="right" sort={table.sort} onSort={table.toggleSort} />
                    <SortTh label="Booked" sortKey="date" sort={table.sort} onSort={table.toggleSort} />
                    <SortTh label="Action" align="center" />
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((ticket: any) => (
                    <tr key={ticket.id} className="cursor-pointer" onClick={() => setSelectedTicket(ticket)}>
                      <td className="whitespace-nowrap font-semibold text-text-primary text-[13px]">{ticket.repairId}</td>
                      <td>
                        <div className="flex items-center gap-3 min-w-[160px]">
                          <Thumb name={ticket.customerName || '?'} />
                          <div className="min-w-0">
                            <span className="block font-medium text-text-primary truncate">{ticket.customerName}</span>
                            <span className="block text-xs text-text-label">{ticket.customerMobile}</span>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-[220px]">
                        <span className="block text-text-primary truncate">{[ticket.deviceBrand, ticket.deviceModel].filter(Boolean).join(' ')}</span>
                        <span className="block text-xs text-text-label truncate">{ticket.issueCategory}</span>
                      </td>
                      <td>
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium capitalize ${['high', 'urgent'].includes(String(ticket.priority).toLowerCase()) ? 'text-danger' : 'text-text-secondary'}`}>
                          {['high', 'urgent'].includes(String(ticket.priority).toLowerCase()) && <FiAlertTriangle size={12} />}
                          {String(ticket.priority || 'medium').toLowerCase()}
                        </span>
                      </td>
                      <td><RepairStatusBadge status={ticket.status} size="sm" /></td>
                      <td className="text-right font-semibold text-text-primary">₹{Number(ticket.estimatedCost || ticket.actualCost || 0).toLocaleString('en-IN')}</td>
                      <td className="whitespace-nowrap text-text-label">{formatDate(ticket.createdAt)}</td>
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        <RowMenu
                          label={`Actions for ${ticket.repairId}`}
                          items={[
                            { label: 'Open ticket', icon: <FiEye size={15} />, onClick: () => setSelectedTicket(ticket) },
                            ...(ticket.status === 'Submitted'
                              ? [
                                  { label: 'Accept', icon: <FiCheck size={15} />, disabled: actionLoading === ticket.repairId, onClick: () => handleAccept(ticket) },
                                  { label: 'Reject', icon: <FiX size={15} />, danger: true, disabled: actionLoading === ticket.repairId, onClick: () => handleReject(ticket) },
                                ]
                              : []),
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={table.page} totalPages={table.totalPages} onPage={table.setPage} summary={`${table.total} of ${tickets.length} tickets`} />
          </>
        )}
      </div>

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center bg-black/20 backdrop-blur-sm" onClick={() => setSelectedTicket(null)}>
          <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full lg:max-w-2xl bg-bg-card rounded-t-3xl lg:rounded-3xl border border-border shadow-xl overflow-y-auto max-h-[85vh]"
          >
            <div className="p-6 border-b border-primary/20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl">
                    {selectedTicket.deviceBrand === 'Apple' ? '🍎' : '📱'}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">{selectedTicket.repairId}</h3>
                    <p className="text-xs text-text-muted">{selectedTicket.deviceBrand} {selectedTicket.deviceModel}</p>
                  </div>
                </div>
                <RepairStatusBadge status={selectedTicket.status as RepairStatus} />
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-[10px] font-semibold text-text-muted uppercase">Customer</p><p className="font-medium text-text-primary text-sm">{selectedTicket.customerName}</p></div>
                  <div><p className="text-[10px] font-semibold text-text-muted uppercase">Mobile</p><p className="text-text-secondary text-sm">{selectedTicket.customerMobile}</p></div>
                  {selectedTicket.customerEmail && <div><p className="text-[10px] font-semibold text-text-muted uppercase">Email</p><p className="text-text-secondary text-xs truncate">{selectedTicket.customerEmail}</p></div>}
                  <div><p className="text-[10px] font-semibold text-text-muted uppercase">IMEI</p><p className="font-mono text-xs text-text-secondary">{selectedTicket.imei}</p></div>
                </div>

                {(((selectedTicket as any).customerAlt) || ((selectedTicket as any).customerAddress)) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border">
                    {(selectedTicket as any).customerAlt && <div><p className="text-[10px] font-semibold text-text-muted uppercase">Alt. Mobile</p><p className="text-xs text-text-primary">{(selectedTicket as any).customerAlt}</p></div>}
                    {(selectedTicket as any).customerAddress && <div className="sm:col-span-2"><p className="text-[10px] font-semibold text-text-muted uppercase">Address</p><p className="text-xs text-text-primary">{(selectedTicket as any).customerAddress}</p></div>}
                  </div>
                )}
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl bg-gray-50/60 border border-border p-3">
                  <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5"><FiAlertTriangle size={10} /> Issue</h4>
                  <p className="text-sm font-semibold text-text-primary">{selectedTicket.issueCategory}</p>
                  {parseQAPairs(selectedTicket.description).length > 0 ? (
                    <div className="mt-2 space-y-1.5">
                      {parseQAPairs(selectedTicket.description).map((qa, i) => (
                        <div key={i} className="space-y-0.5">
                          <p className="text-[10px] font-semibold text-text-muted">Q: {qa.question}</p>
                          <p className="text-[10px] text-text-secondary pl-2 border-l-2 border-primary/20">A: {qa.answer}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted leading-relaxed mt-1">{selectedTicket.description}</p>
                  )}
                  <p className={`text-[10px] font-semibold mt-1.5 ${priorityColors[selectedTicket.priority] || 'text-slate-400'}`}>Priority: {selectedTicket.priority}</p>
                </div>
                <div className="rounded-xl bg-gray-50/60 border border-border p-3">
                  <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5"><FiDollarSign size={10} /> Repair</h4>
                  <p className="text-lg font-bold text-primary">₹{selectedTicket.estimatedCost.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">Est. Completion: {selectedTicket.estimatedDays} day{selectedTicket.estimatedDays > 1 ? 's' : ''}</p>
                      <p className="text-[10px] text-text-muted flex items-center gap-1.5 mt-0.5"><FiUser size={10} />Technician: {(selectedTicket as any).technicianName || 'Auto Assign'}</p>
                   <div className="mt-2"><RepairStatusBadge status={selectedTicket.status as RepairStatus} /></div>
                 </div>
               </div>

               {((selectedTicket as any).deviceCondition || (selectedTicket as any).warranty || (selectedTicket as any).password) && (
                 <div className="mt-4 pt-3 border-t border-border">
                   <h4 className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2 flex items-center gap-1.5"><FiPackage size={10} /> Other Details</h4>
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                     {(selectedTicket as any).deviceCondition && <div><p className="text-[10px] font-semibold text-text-muted">Device Condition</p><p className="text-xs text-text-primary">{(selectedTicket as any).deviceCondition}</p></div>}
                     {(selectedTicket as any).warranty && <div><p className="text-[10px] font-semibold text-text-muted">Warranty</p><p className="text-xs text-text-primary">{(selectedTicket as any).warranty}</p></div>}
                     {(selectedTicket as any).password && <div><p className="text-[10px] font-semibold text-text-muted">Password</p><p className="text-xs text-text-primary">{(selectedTicket as any).password}</p></div>}
                   </div>
                 </div>
               )}

              {(() => {
                const s = selectedTicket.status as string
                const next = STATUS_TRANSITIONS[s]
                if (!next || next.length === 0) return null
                return (
                  <div className="mt-4 flex gap-2 flex-wrap">
                    {next.map((ns) => (
                      <button key={ns}
                        onClick={async () => {
                          if (ns === 'Rejected') {
                            handleReject(selectedTicket)
                            return
                          }
                          setActionLoading(selectedTicket.repairId)
                          try {
                            const backendStatus = STATUS_TO_BACKEND[ns]
                            await repairService.updateStatus(selectedTicket.id, backendStatus, `Status updated to ${ns}`)
                            setTickets((prev) => prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: ns as any } : t)))
                            setToast({ message: `Status updated to "${ns}"`, type: 'success' })
                            setSelectedTicket(null)
                          } catch (err: any) {
                            const msg = err?.response?.data?.message || err?.message || 'Failed to update status'
                            setToast({ message: msg, type: 'error' })
                          }
                          setActionLoading(null)
                        }}
                        disabled={actionLoading === selectedTicket.repairId}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all disabled:opacity-50 ${
                          ns === 'Rejected'
                            ? 'bg-danger text-white hover:bg-danger/90'
                            : 'bg-primary text-white hover:bg-primary/90'
                        }`}
                      >
                        {actionLoading === selectedTicket.repairId ? 'Updating...' : ns === 'Accepted' ? 'Accept Booking' : `Mark ${ns}`}
                      </button>
                    ))}
                  </div>
                )
              })()}
            </div>
          </motion.div>
        </div>
      )}
      <Modal
        open={!!rejectTarget}
        onClose={() => !rejecting && setRejectTarget(null)}
        title={`Reject ${rejectTarget?.repairId ?? 'ticket'}?`}
        description="The customer is notified with this reason. This can't be undone."
        size="sm"
        footer={
          <>
            <Btn onClick={() => setRejectTarget(null)} disabled={rejecting}>Keep ticket</Btn>
            <Btn variant="danger" loading={rejecting} onClick={confirmReject}>Reject ticket</Btn>
          </>
        }
      >
        <Field label="Reason" required error={rejectError} counter={{ value: rejectReason.trim().length, max: 1000 }}>
          {(a) => (
            <textarea {...a} rows={3} value={rejectReason} onChange={(e) => { setRejectReason(e.target.value); setRejectError('') }}
              placeholder="e.g. Board is water-damaged beyond economical repair." className={textareaBase} />
          )}
        </Field>
      </Modal>
    </PageLayout>
  )
}
