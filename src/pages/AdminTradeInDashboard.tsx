import { useCallback, useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiCheckCircle, FiClock, FiCreditCard, FiDollarSign, FiEye, FiMail, FiPhone, FiRefreshCw, FiRepeat,
  FiSmartphone, FiTrash2, FiX, FiXCircle,
} from 'react-icons/fi'
import PageLayout from '../components/layout/PageLayout'
import Portal from '../components/ui/Portal'
import {
  Btn, ConfirmDialog, EmptyState, ErrorBanner, ExportBtn, Field, FilterMenu, FilterSelect, KpiCard, PageHeader, Pagination, RowMenu,
  SearchBox, ShowingSelect, Skeleton, SortTh, StatusPill, Thumb, ToolbarBtn,
  apiErrorMessage, exportCsv, formatDate, formatINR, inputBase, textareaBase, timeAgo, useTable, type Tone,
} from '../components/admin/AdminUI'
import { tradeInService, type TradeInSubmission } from '../services/tradeInService'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { useToast } from '../context/ToastContext'
import { rules } from '../utils/adminValidation'

const STATUS: Record<string, { label: string; tone: Tone }> = {
  pending: { label: 'New', tone: 'warning' },
  reviewed: { label: 'Quoted', tone: 'info' },
  accepted: { label: 'Accepted', tone: 'violet' },
  paid: { label: 'Paid', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' },
}

const TABS = ['all', 'pending', 'reviewed', 'accepted', 'paid', 'rejected'] as const

const PAYMENT_METHODS = [
  { value: 'upi', label: 'UPI' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'store_credit', label: 'Store credit' },
]

const MAX_PAYOUT = 1000000
const amountRule = (label: string) => (v: string) =>
  rules.required(label)(v) || rules.amount(label, { max: MAX_PAYOUT })(v)

/* Stage-specific action panel inside the drawer. */
function WorkflowPanel({ trade, onUpdated }: { trade: TradeInSubmission; onUpdated: (t: TradeInSubmission) => void }) {
  const showToast = useToast().show
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [method, setMethod] = useState('')
  const [reason, setReason] = useState('')
  const [mode, setMode] = useState<'main' | 'reject'>('main')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    setAmount(
      trade.status === 'reviewed'
        ? String(trade.quotedPrice ?? '')
        : trade.status === 'pending'
          ? String(Math.round(trade.estimatedValue) || '')
          : String(trade.finalValue ?? ''),
    )
    setNotes('')
    setMethod('')
    setReason('')
    setMode('main')
    setErrors({})
    setServerError('')
  }, [trade.id, trade.status, trade.quotedPrice, trade.finalValue, trade.estimatedValue])

  const run = async (fn: () => Promise<TradeInSubmission>, success: string) => {
    setBusy(true)
    setServerError('')
    try {
      const updated = await fn()
      onUpdated(updated)
      showToast(success, 'success')
    } catch (e) {
      setServerError(apiErrorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const submitQuote = () => {
    const err = amountRule('Quoted price')(amount)
    setErrors({ amount: err })
    if (!err) run(() => tradeInService.quotePrice(trade.id, Number(amount), notes.trim() || undefined), 'Quote sent')
  }
  const submitAccept = () => {
    const err = amountRule('Final value')(amount)
    setErrors({ amount: err })
    if (!err) run(() => tradeInService.accept(trade.id, Number(amount), notes.trim() || undefined), 'Trade-in accepted')
  }
  const submitPay = () => {
    const err = method ? '' : 'Choose how the customer was paid'
    setErrors({ method: err })
    if (!err) run(() => tradeInService.markPaid(trade.id, method, notes.trim() || undefined), 'Payment recorded')
  }
  const submitReject = () => {
    const err = rules.required('Reason')(reason) || rules.minLength('Reason', 5)(reason) || rules.maxLength('Reason', 1000)(reason)
    setErrors({ reason: err })
    if (!err) run(() => tradeInService.reject(trade.id, reason.trim()), 'Trade-in rejected')
  }

  if (['paid', 'rejected', 'cancelled'].includes(trade.status)) {
    return (
      <div className={`rounded-xl p-4 text-sm ${trade.status === 'paid' ? 'bg-[#ecfdf3] text-[#067647]' : 'bg-[#fef3f2] text-[#b42318]'}`}>
        {trade.status === 'paid' ? (
          <>Paid {formatINR(trade.finalValue ?? 0)} via {PAYMENT_METHODS.find((m) => m.value === trade.paymentMethod)?.label ?? trade.paymentMethod}. This trade-in is closed.</>
        ) : (
          <>Rejected{trade.rejectionReason ? `: ${trade.rejectionReason}` : '.'} This trade-in is closed.</>
        )}
      </div>
    )
  }

  if (mode === 'reject') {
    return (
      <div className="space-y-3">
        <Field label="Reason for rejection" required error={errors.reason} hint="Shared with the customer — be specific and polite" counter={{ value: reason.trim().length, max: 1000 }}>
          {(a) => <textarea {...a} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. The device is iCloud-locked and cannot be resold." className={textareaBase} />}
        </Field>
        {serverError && <ErrorBanner message={serverError} />}
        <div className="flex gap-2 justify-end">
          <Btn onClick={() => setMode('main')} disabled={busy}>Back</Btn>
          <Btn variant="danger" loading={busy} onClick={submitReject} icon={<FiXCircle size={15} />}>Reject trade-in</Btn>
        </div>
      </div>
    )
  }

  const step = trade.status as 'pending' | 'reviewed' | 'accepted'
  return (
    <div className="space-y-3">
      {step !== 'accepted' ? (
        <Field
          label={step === 'pending' ? 'Quoted price (₹)' : 'Final value (₹)'}
          required
          error={errors.amount}
          hint={step === 'pending' ? `Online estimate was ${formatINR(trade.estimatedValue)}` : `Quoted ${formatINR(trade.quotedPrice ?? 0)} — adjust after inspection if needed`}
        >
          {(a) => <input {...a} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} className={`${inputBase} tabular`} />}
        </Field>
      ) : (
        <Field label="Payment method" required error={errors.method} hint={`Pay the customer ${formatINR(trade.finalValue ?? 0)}`}>
          {(a) => (
            <select {...a} value={method} onChange={(e) => setMethod(e.target.value)} className={inputBase}>
              <option value="">Select a method</option>
              {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          )}
        </Field>
      )}
      <Field label="Note" hint="Optional — added to the internal notes">
        {(a) => <input {...a} value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} placeholder={step === 'accepted' ? 'e.g. UPI ref 4321…' : 'e.g. Minor scratch on frame'} className={inputBase} />}
      </Field>
      {serverError && <ErrorBanner message={serverError} />}
      <div className="flex flex-wrap gap-2 justify-end">
        <Btn onClick={() => setMode('reject')} disabled={busy} className="!text-danger">Reject</Btn>
        {step === 'reviewed' && (
          <Btn onClick={submitQuote} disabled={busy}>Update quote</Btn>
        )}
        {step === 'pending' && <Btn variant="primary" loading={busy} onClick={submitQuote} icon={<FiDollarSign size={15} />}>Send quote</Btn>}
        {step === 'reviewed' && <Btn variant="primary" loading={busy} onClick={submitAccept} icon={<FiCheckCircle size={15} />}>Accept</Btn>}
        {step === 'accepted' && <Btn variant="primary" loading={busy} onClick={submitPay} icon={<FiCreditCard size={15} />}>Mark as paid</Btn>}
      </div>
    </div>
  )
}

function TradeDrawer({
  trade,
  onClose,
  onUpdated,
  onDeleted,
}: {
  trade: TradeInSubmission | null
  onClose: () => void
  onUpdated: (t: TradeInSubmission) => void
  onDeleted: (id: number) => void
}) {
  useLockBodyScroll(!!trade)
  const showToast = useToast().show
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => setNotes(trade?.adminNotes ?? ''), [trade?.id, trade?.adminNotes])

  useEffect(() => {
    if (!trade) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !confirmDelete && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [trade, confirmDelete, onClose])

  const closed = trade ? ['paid', 'rejected', 'cancelled'].includes(trade.status) : true
  const steps = ['pending', 'reviewed', 'accepted', 'paid']
  const stepIndex = trade ? steps.indexOf(trade.status) : -1

  const saveNotes = async () => {
    if (!trade) return
    if (notes.trim().length > 2000) return showToast('Notes must be at most 2000 characters', 'error')
    setSavingNotes(true)
    try {
      onUpdated(await tradeInService.update(trade.id, { admin_notes: notes.trim() }))
      showToast('Notes saved', 'success')
    } catch (e) {
      showToast(apiErrorMessage(e), 'error')
    } finally {
      setSavingNotes(false)
    }
  }

  const doDelete = async () => {
    if (!trade) return
    setDeleting(true)
    try {
      await tradeInService.delete(trade.id)
      onDeleted(trade.id)
      showToast('Trade-in deleted', 'success')
      setConfirmDelete(false)
    } catch (e) {
      showToast(apiErrorMessage(e), 'error')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Portal>
      <AnimatePresence>
        {trade && (
          <motion.div className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-[#0c111d]/40" onClick={onClose} />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label={`Trade-in ${trade.tradeId}`}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 32, stiffness: 320 }}
              className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-[var(--shadow-pop)] flex flex-col"
            >
              <div className="flex items-center justify-between gap-3 px-6 h-16 border-b border-border-light shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <p className="text-sm font-semibold text-text-primary">{trade.tradeId}</p>
                  <StatusPill tone={STATUS[trade.status]?.tone ?? 'neutral'}>{STATUS[trade.status]?.label ?? trade.status}</StatusPill>
                </div>
                <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-lg flex items-center justify-center text-text-label hover:bg-surface-hover">
                  <FiX size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {trade.status !== 'rejected' && trade.status !== 'cancelled' && (
                  <ol className="flex items-center px-6 pt-5" aria-label="Progress">
                    {['Submitted', 'Quoted', 'Accepted', 'Paid'].map((label, i) => (
                      <li key={label} className="flex-1 flex items-center last:flex-none">
                        <span className="flex flex-col items-center gap-1.5">
                          <span className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${
                            i <= stepIndex ? 'bg-[#101828] text-white' : 'bg-surface-lighter text-text-muted ring-1 ring-inset ring-border'
                          }`}>{i < stepIndex || trade.status === 'paid' ? '✓' : i + 1}</span>
                          <span className={`text-[11px] ${i <= stepIndex ? 'text-text-primary font-medium' : 'text-text-muted'}`}>{label}</span>
                        </span>
                        {i < 3 && <span className={`flex-1 h-px mx-2 mb-5 ${i < stepIndex ? 'bg-[#101828]' : 'bg-border'}`} />}
                      </li>
                    ))}
                  </ol>
                )}

                <section className="p-6 border-b border-border-light">
                  <div className="flex items-start gap-3">
                    <span className="w-11 h-11 rounded-xl bg-surface-lighter ring-1 ring-inset ring-border flex items-center justify-center text-text-secondary shrink-0">
                      <FiSmartphone size={18} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-base font-semibold text-text-primary">{trade.deviceBrand} {trade.deviceModel}</p>
                      <p className="text-sm text-text-label">{[trade.deviceStorage, trade.deviceCondition].filter(Boolean).join(' · ')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {[
                      ['Estimate', formatINR(trade.estimatedValue)],
                      ['Quoted', trade.quotedPrice ? formatINR(trade.quotedPrice) : '—'],
                      ['Final', trade.finalValue ? formatINR(trade.finalValue) : '—'],
                    ].map(([k, v]) => (
                      <div key={k} className="rounded-xl bg-surface-lighter px-3 py-2.5">
                        <p className="text-[11px] text-text-label">{k}</p>
                        <p className="text-sm font-bold text-text-primary tabular">{v}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="p-6 border-b border-border-light">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-label mb-3">Customer</h4>
                  <p className="text-sm font-medium text-text-primary">{trade.customerName}</p>
                  <div className="mt-2 space-y-1.5 text-sm text-text-secondary">
                    <p className="flex items-center gap-2.5"><FiPhone className="text-text-muted" size={14} /><a className="hover:text-primary" href={`tel:${trade.customerMobile}`}>{trade.customerMobile}</a></p>
                    {trade.customerEmail && <p className="flex items-center gap-2.5"><FiMail className="text-text-muted" size={14} /><a className="hover:text-primary truncate" href={`mailto:${trade.customerEmail}`}>{trade.customerEmail}</a></p>}
                    <p className="flex items-center gap-2.5"><FiClock className="text-text-muted" size={14} />Submitted {formatDate(trade.createdAt, true)}</p>
                  </div>
                </section>

                <section className="p-6 border-b border-border-light">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-text-label mb-3">
                    {closed ? 'Outcome' : 'Next step'}
                  </h4>
                  <WorkflowPanel trade={trade} onUpdated={onUpdated} />
                </section>

                <section className="p-6">
                  <Field label="Internal notes" hint="Only visible to admins" counter={{ value: notes.length, max: 2000 }}>
                    {(a) => <textarea {...a} rows={4} value={notes} disabled={closed} onChange={(e) => setNotes(e.target.value)} className={textareaBase} />}
                  </Field>
                  {!closed && notes !== (trade.adminNotes ?? '') && (
                    <div className="flex justify-end gap-2 mt-2">
                      <Btn size="sm" onClick={() => setNotes(trade.adminNotes ?? '')}>Discard</Btn>
                      <Btn size="sm" variant="dark" loading={savingNotes} onClick={saveNotes}>Save notes</Btn>
                    </div>
                  )}
                </section>
              </div>

              {trade.status !== 'paid' && (
                <div className="p-4 border-t border-border-light bg-[#fcfcfd] shrink-0">
                  <button type="button" onClick={() => setConfirmDelete(true)}
                    className="w-full h-9 rounded-[10px] text-sm font-medium text-text-label hover:text-danger hover:bg-[#fef3f2] inline-flex items-center justify-center gap-2 transition">
                    <FiTrash2 size={14} /> Delete trade-in
                  </button>
                </div>
              )}
            </motion.aside>

            <ConfirmDialog
              open={confirmDelete}
              title="Delete this trade-in?"
              description={`${trade.tradeId} from ${trade.customerName} will be permanently removed. This can't be undone.`}
              confirmLabel="Delete"
              loading={deleting}
              onConfirm={doDelete}
              onClose={() => setConfirmDelete(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </Portal>
  )
}

const STAGE_ORDER = ['pending', 'reviewed', 'accepted', 'paid', 'rejected', 'cancelled']
const tradeSorters: Record<string, (t: TradeInSubmission) => string | number> = {
  id: (t) => t.id,
  customer: (t) => t.customerName,
  device: (t) => `${t.deviceBrand} ${t.deviceModel}`,
  estimate: (t) => t.estimatedValue,
  offer: (t) => t.finalValue ?? t.quotedPrice ?? 0,
  status: (t) => STAGE_ORDER.indexOf(t.status),
}

export default function AdminTradeInDashboard() {
  const showToast = useToast().show
  const [trades, setTrades] = useState<TradeInSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<(typeof TABS)[number]>('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<TradeInSubmission | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setTrades(await tradeInService.list())
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not load trade-ins.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: trades.length }
    for (const t of trades) c[t.status] = (c[t.status] ?? 0) + 1
    return c
  }, [trades])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return trades.filter((t) => {
      if (tab !== 'all' && t.status !== tab) return false
      if (!q) return true
      return [t.tradeId, t.customerName, t.customerMobile, t.customerEmail, t.deviceBrand, t.deviceModel].some((v) => v?.toLowerCase().includes(q))
    })
  }, [trades, tab, search])

  const table = useTable(filtered, { sorters: tradeSorters, initialSort: { key: 'id', dir: 'desc' }, resetKey: `${search}|${tab}` })

  const payout = trades.filter((t) => t.status === 'paid').reduce((s, t) => s + (t.finalValue ?? 0), 0)
  const owed = trades.filter((t) => t.status === 'accepted').reduce((s, t) => s + (t.finalValue ?? 0), 0)
  const selected = trades.find((t) => t.id === selectedId) ?? null

  const onUpdated = (u: TradeInSubmission) => setTrades((ts) => ts.map((t) => (t.id === u.id ? u : t)))
  const onDeleted = (id: number) => {
    setTrades((ts) => ts.filter((t) => t.id !== id))
    setSelectedId(null)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await tradeInService.delete(deleting.id)
      onDeleted(deleting.id)
      showToast('Trade-in deleted', 'success')
      setDeleting(null)
    } catch (e) {
      showToast(apiErrorMessage(e), 'error')
    } finally {
      setDeleteBusy(false)
    }
  }

  const exportTrades = () =>
    exportCsv(
      `trade-ins-${new Date().toISOString().slice(0, 10)}`,
      ['Trade-in', 'Submitted', 'Customer', 'Mobile', 'Email', 'Device', 'Storage', 'Condition', 'Estimate', 'Quoted', 'Final', 'Status', 'Payment method'],
      table.sorted.map((t) => [
        t.tradeId, t.createdAt ? new Date(t.createdAt).toLocaleString('en-IN') : '', t.customerName, t.customerMobile, t.customerEmail,
        `${t.deviceBrand} ${t.deviceModel}`, t.deviceStorage, t.deviceCondition, t.estimatedValue, t.quotedPrice ?? '', t.finalValue ?? '',
        STATUS[t.status]?.label ?? t.status, t.paymentMethod,
      ]),
    )

  const th = { sort: table.sort, onSort: table.toggleSort }

  return (
    <PageLayout title="Trade-in">
      <PageHeader
        title="Trade-in"
        actions={
          <>
            <SearchBox value={search} onChange={setSearch} placeholder="Search trade-ins" />
            <ShowingSelect value={table.pageSize} onChange={table.setPageSize} />
            <FilterMenu activeCount={tab !== 'all' ? 1 : 0} onReset={() => setTab('all')}>
              <FilterSelect label="Stage" value={tab} onChange={(v) => setTab(v as (typeof TABS)[number])}
                options={TABS.map((t) => ({ value: t, label: `${t === 'all' ? 'All stages' : STATUS[t].label} (${counts[t] ?? 0})` }))} />
            </FilterMenu>
            <ExportBtn onClick={exportTrades} disabled={filtered.length === 0} />
            <ToolbarBtn onClick={load} aria-label="Refresh" title="Refresh" className="!px-3" icon={<FiRefreshCw size={15} className={loading ? 'animate-spin' : ''} />} />
          </>
        }
      />

      <div className="space-y-5">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard loading={loading && !trades.length} label="Awaiting review" tone="warning" icon={<FiClock size={16} />}
            value={(counts.pending ?? 0) + (counts.reviewed ?? 0)} hint={`${counts.pending ?? 0} new · ${counts.reviewed ?? 0} quoted`} onClick={() => setTab('pending')} />
          <KpiCard loading={loading && !trades.length} label="Accepted, to pay" tone="violet" icon={<FiCheckCircle size={16} />}
            value={counts.accepted ?? 0} hint={owed ? `${formatINR(owed)} owed` : 'nothing owed'} onClick={() => setTab('accepted')} />
          <KpiCard loading={loading && !trades.length} label="Total paid out" tone="success" icon={<FiCreditCard size={16} />}
            value={formatINR(payout, true)} hint={`${counts.paid ?? 0} completed`} onClick={() => setTab('paid')} />
          <KpiCard loading={loading && !trades.length} label="All submissions" tone="neutral" icon={<FiRepeat size={16} />}
            value={counts.all ?? 0} hint={`${counts.rejected ?? 0} rejected`} onClick={() => setTab('all')} />
        </div>

        {error ? (
          <ErrorBanner message={error} onRetry={load} />
        ) : loading && !trades.length ? (
          <div className="table-wrap p-4 space-y-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="table-wrap">
            <EmptyState
              icon={<FiRepeat size={20} />}
              title={trades.length ? 'Nothing matches' : 'No trade-in requests yet'}
              description={trades.length ? 'Try another search or stage.' : 'Requests submitted from the storefront Trade-In page appear here.'}
            />
          </div>
        ) : (
          <div className="table-wrap">
            <div className="table-scroll">
              <table className="min-w-[900px]">
                <thead>
                  <tr>
                    <SortTh label="Trade-in" sortKey="id" {...th} />
                    <SortTh label="Customer" sortKey="customer" {...th} />
                    <SortTh label="Device" sortKey="device" {...th} />
                    <SortTh label="Estimate" sortKey="estimate" align="right" {...th} />
                    <SortTh label="Offer" sortKey="offer" align="right" {...th} />
                    <SortTh label="Status" sortKey="status" {...th} />
                    <SortTh label="Action" align="center" />
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((t) => (
                    <tr key={t.id} className="cursor-pointer" onClick={() => setSelectedId(t.id)}>
                      <td>
                        <span className="block font-semibold text-text-primary text-[13px]">{t.tradeId}</span>
                        <span className="block text-xs text-text-muted">{timeAgo(t.createdAt)}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-3 min-w-[170px]">
                          <Thumb name={t.customerName} />
                          <div className="min-w-0">
                            <span className="block font-medium text-text-primary truncate">{t.customerName}</span>
                            <span className="block text-xs text-text-label">{t.customerMobile}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="block text-text-primary">{t.deviceBrand} {t.deviceModel}</span>
                        <span className="block text-xs text-text-label">{[t.deviceStorage, t.deviceCondition.split(' - ')[0]].filter(Boolean).join(' · ')}</span>
                      </td>
                      <td className="text-right text-text-label">{formatINR(t.estimatedValue)}</td>
                      <td className="text-right font-semibold text-text-primary">
                        {t.finalValue ? formatINR(t.finalValue) : t.quotedPrice ? formatINR(t.quotedPrice) : <span className="text-text-muted font-normal">—</span>}
                      </td>
                      <td><StatusPill tone={STATUS[t.status]?.tone ?? 'neutral'}>{STATUS[t.status]?.label ?? t.status}</StatusPill></td>
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        <RowMenu
                          label={`Actions for ${t.tradeId}`}
                          items={[
                            { label: t.status === 'pending' ? 'Review & quote' : t.status === 'reviewed' ? 'Accept or revise' : t.status === 'accepted' ? 'Record payment' : 'View details', icon: <FiEye size={15} />, onClick: () => setSelectedId(t.id) },
                            ...(t.status !== 'paid' ? [{ label: 'Delete', icon: <FiTrash2 size={15} />, danger: true, onClick: () => setDeleting(t) }] : []),
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={table.page} totalPages={table.totalPages} onPage={table.setPage} summary={`${table.total} of ${trades.length} trade-ins`} />
          </div>
        )}
      </div>

      <TradeDrawer trade={selected} onClose={() => setSelectedId(null)} onUpdated={onUpdated} onDeleted={onDeleted} />
      <ConfirmDialog
        open={!!deleting}
        title="Delete this trade-in?"
        description={deleting ? `${deleting.tradeId} from ${deleting.customerName} will be permanently removed. This can't be undone.` : ''}
        confirmLabel="Delete"
        loading={deleteBusy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </PageLayout>
  )
}
