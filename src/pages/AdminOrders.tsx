import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiCheck, FiClock, FiCreditCard, FiEye, FiMapPin, FiPackage, FiPhone, FiRefreshCw,
  FiShoppingBag, FiTruck, FiUser, FiX, FiXCircle,
} from 'react-icons/fi'
import PageLayout from '../components/layout/PageLayout'
import Portal from '../components/ui/Portal'
import {
  Btn, ConfirmDialog, EmptyState, ErrorBanner, ExportBtn, FilterMenu, FilterSelect, KpiCard, PageHeader, Pagination, RowMenu,
  SearchBox, ShowingSelect, Skeleton, SortTh, StatusPill, Thumb, ToolbarBtn,
  apiErrorMessage, exportCsv, formatINR, inputBase, toneForStatus, useTable,
} from '../components/admin/AdminUI'
import { orderService, type OrderResponse } from '../services/orderService'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import { useToast } from '../context/ToastContext'

const STATUS_LABELS: Record<string, string> = {
  order_placed: 'Placed',
  accepted: 'Accepted',
  processing: 'Packing',
  shipped: 'Shipped',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

const FLOW = ['order_placed', 'accepted', 'processing', 'shipped', 'out_for_delivery', 'delivered']
// Mirrors ORDER_STATUS_TRANSITIONS on the server: cancel only before shipping.
const CANCELLABLE = new Set(['order_placed', 'accepted', 'processing'])

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'To fulfil' },
  { key: 'transit', label: 'In transit' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
] as const
type TabKey = (typeof TABS)[number]['key']

const inTab = (status: string, tab: TabKey) =>
  tab === 'all' ||
  (tab === 'open' && ['order_placed', 'accepted', 'processing'].includes(status)) ||
  (tab === 'transit' && ['shipped', 'out_for_delivery'].includes(status)) ||
  (tab === 'delivered' && status === 'delivered') ||
  (tab === 'cancelled' && status === 'cancelled')

const statusOf = (o: OrderResponse) => o.order_status || o.delivery_status || 'order_placed'
function addressOf(o: OrderResponse) {
  const a = o.shipping_address
  if (a && typeof a === 'object') {
    const line = [a.full_name, a.house_number, a.street_address, a.landmark, a.city, a.state, a.pincode].filter(Boolean).join(', ')
    if (line) return line
  }
  return o.delivery_address_text && !o.delivery_address_text.trim().startsWith('{') ? o.delivery_address_text : ''
}
const paymentLabel = (o: OrderResponse) => o.payment_status_display || o.payment_status || 'Pending'

function OrderDrawer({
  order,
  onClose,
  onUpdated,
}: {
  order: OrderResponse | null
  onClose: () => void
  onUpdated: (o: OrderResponse) => void
}) {
  useLockBodyScroll(!!order)
  const showToast = useToast().show
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)

  useEffect(() => {
    setError('')
    setConfirmCancel(false)
  }, [order?.order_number])

  useEffect(() => {
    if (!order) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !confirmCancel && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [order, confirmCancel, onClose])

  if (!order) return <Portal><AnimatePresence /></Portal>

  const status = statusOf(order)
  const idx = FLOW.indexOf(status)
  const next = idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null
  const later = idx >= 0 ? FLOW.slice(idx + 2) : []

  const move = async (to: string) => {
    setBusy(to)
    setError('')
    try {
      const updated = await orderService.adminUpdateStatus(order.order_number, to)
      onUpdated(updated)
      showToast(`Order marked ${STATUS_LABELS[to].toLowerCase()}`, 'success')
      setConfirmCancel(false)
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not update the order.'))
    } finally {
      setBusy(null)
    }
  }

  const items = order.items ?? []
  return (
    <Portal>
      <AnimatePresence>
        <motion.div key={order.order_number} className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-[#0c111d]/40" onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label={`Order ${order.order_number}`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-[var(--shadow-pop)] flex flex-col"
          >
            <div className="flex items-center justify-between gap-3 px-6 h-16 border-b border-border-light shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{order.order_number}</p>
                <StatusPill tone={toneForStatus(status)}>{STATUS_LABELS[status] ?? status}</StatusPill>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-lg flex items-center justify-center text-text-label hover:bg-surface-hover">
                <FiX size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <section className="p-6 border-b border-border-light">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-label mb-4">Fulfilment</h4>
                {status === 'cancelled' ? (
                  <div className="rounded-xl bg-[#fef3f2] text-[#b42318] px-4 py-3 text-sm flex items-center gap-2"><FiXCircle /> This order was cancelled.</div>
                ) : (
                  <ol className="relative">
                    {FLOW.map((s, i) => {
                      const done = i <= idx
                      return (
                        <li key={s} className="flex gap-3 pb-4 last:pb-0 relative">
                          {i < FLOW.length - 1 && <span className={`absolute left-[11px] top-6 bottom-0 w-px ${i < idx ? 'bg-[#101828]' : 'bg-border'}`} />}
                          <span className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                            done ? 'bg-[#101828] text-white' : 'bg-white text-text-muted ring-1 ring-inset ring-border-dark'
                          }`}>{done ? <FiCheck size={12} /> : i + 1}</span>
                          <span className={`text-sm pt-0.5 ${i === idx ? 'font-semibold text-text-primary' : done ? 'text-text-secondary' : 'text-text-muted'}`}>
                            {STATUS_LABELS[s]}
                            {i === idx && <span className="ml-2 text-xs font-medium text-primary">Current</span>}
                          </span>
                        </li>
                      )
                    })}
                  </ol>
                )}

                {error && <div className="mt-4"><ErrorBanner message={error} /></div>}

                {next && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <Btn variant="primary" loading={busy === next} disabled={!!busy} onClick={() => move(next)} icon={next === 'delivered' ? <FiCheck size={15} /> : <FiTruck size={15} />}>
                      Mark as {STATUS_LABELS[next].toLowerCase()}
                    </Btn>
                    {later.length > 0 && (
                      <select
                        aria-label="Skip ahead to"
                        value=""
                        disabled={!!busy}
                        onChange={(e) => e.target.value && move(e.target.value)}
                        className={`${inputBase} !w-auto text-text-secondary`}
                      >
                        <option value="">Skip ahead…</option>
                        {later.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    )}
                    {CANCELLABLE.has(status) && (
                      <Btn onClick={() => setConfirmCancel(true)} disabled={!!busy} className="!text-danger">Cancel order</Btn>
                    )}
                  </div>
                )}
                {!CANCELLABLE.has(status) && status !== 'cancelled' && status !== 'delivered' && (
                  <p className="mt-3 text-xs text-text-label">Shipped orders can no longer be cancelled — arrange a return after delivery instead.</p>
                )}
              </section>

              <section className="p-6 border-b border-border-light">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-label mb-3">Customer</h4>
                <div className="space-y-2 text-sm text-text-secondary">
                  <p className="flex items-center gap-2.5"><FiUser size={14} className="text-text-muted" /><span className="text-text-primary font-medium">{order.customer_name || 'Customer'}</span></p>
                  {order.customer_mobile && <p className="flex items-center gap-2.5"><FiPhone size={14} className="text-text-muted" /><a className="hover:text-primary" href={`tel:${order.customer_mobile}`}>{order.customer_mobile}</a></p>}
                  {addressOf(order) && <p className="flex items-start gap-2.5"><FiMapPin size={14} className="text-text-muted mt-0.5 shrink-0" />{addressOf(order)}</p>}
                </div>
              </section>

              <section className="p-6 border-b border-border-light">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-label mb-3">Items ({items.length})</h4>
                <ul className="divide-y divide-border-light">
                  {items.map((it, i) => (
                    <li key={i} className="py-2.5 flex items-center gap-3">
                      <span className="w-9 h-9 rounded-lg bg-surface-lighter ring-1 ring-inset ring-border flex items-center justify-center text-text-muted shrink-0"><FiPackage size={15} /></span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-medium text-text-primary truncate">{it.product_name}</span>
                        <span className="block text-xs text-text-label">{formatINR(Number(it.price))} × {it.quantity}</span>
                      </span>
                      <span className="text-sm font-semibold text-text-primary tabular">{formatINR(Number(it.price) * it.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <dl className="mt-3 pt-3 border-t border-border-light space-y-1.5 text-sm">
                  <div className="flex justify-between"><dt className="text-text-label">Subtotal</dt><dd className="tabular">{formatINR(Number(order.subtotal) || 0)}</dd></div>
                  <div className="flex justify-between"><dt className="text-text-label">Shipping</dt><dd className="tabular">{Number(order.shipping_charge) ? formatINR(Number(order.shipping_charge)) : 'Free'}</dd></div>
                  {Number(order.tax) > 0 && <div className="flex justify-between"><dt className="text-text-label">Tax</dt><dd className="tabular">{formatINR(Number(order.tax))}</dd></div>}
                  {Number(order.discount) > 0 && <div className="flex justify-between"><dt className="text-text-label">Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</dt><dd className="tabular text-success">−{formatINR(Number(order.discount))}</dd></div>}
                  <div className="flex justify-between pt-1.5 font-semibold text-text-primary"><dt>Total</dt><dd className="tabular">{formatINR(Number(order.grand_total) || 0)}</dd></div>
                </dl>
              </section>

              <section className="p-6">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-text-label mb-3">Payment & delivery</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {[
                    ['Payment', <StatusPill key="p" tone={toneForStatus(order.payment_status)}>{paymentLabel(order)}</StatusPill>],
                    ['Method', order.payment_method || '—'],
                    ['Courier', order.delivery_partner || '—'],
                    ['Tracking', order.tracking_id || '—'],
                    ['Placed', order.created_at ? new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'],
                    ['Est. delivery', order.est_delivery || '—'],
                  ].map(([k, v]) => (
                    <div key={k as string} className="rounded-xl bg-surface-lighter px-3 py-2.5 min-w-0">
                      <p className="text-[11px] text-text-label">{k}</p>
                      <div className="font-medium text-text-primary truncate">{v}</div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </motion.aside>

          <ConfirmDialog
            open={confirmCancel}
            title="Cancel this order?"
            description={`${order.order_number} for ${formatINR(Number(order.grand_total) || 0)} will be cancelled and its payment marked failed. The customer will see the order as cancelled.`}
            confirmLabel="Cancel order"
            loading={busy === 'cancelled'}
            onConfirm={() => move('cancelled')}
            onClose={() => setConfirmCancel(false)}
          />
        </motion.div>
      </AnimatePresence>
    </Portal>
  )
}

const orderSorters: Record<string, (o: OrderResponse) => string | number> = {
  order: (o) => o.created_at || o.order_number,
  customer: (o) => o.customer_name,
  items: (o) => (o.items ?? []).length,
  total: (o) => Number(o.grand_total) || 0,
  payment: (o) => o.payment_status,
  status: (o) => FLOW.indexOf(statusOf(o)),
}

export default function AdminOrders() {
  const [params] = useSearchParams()
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<TabKey>('all')
  const [payment, setPayment] = useState('all')
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [selectedNo, setSelectedNo] = useState<string | null>(null)
  const showToast = useToast().show

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setOrders(await orderService.adminList())
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not load orders.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Deep link from the dashboard opens the order straight away.
  useEffect(() => {
    const q = params.get('q')
    if (q && orders.some((o) => o.order_number === q)) setSelectedNo(q)
  }, [params, orders])

  const counts = useMemo(() => Object.fromEntries(TABS.map((t) => [t.key, orders.filter((o) => inTab(statusOf(o), t.key)).length])), [orders])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((o) => {
      if (!inTab(statusOf(o), tab)) return false
      if (payment !== 'all' && (o.payment_status || '').toLowerCase() !== payment) return false
      if (!q) return true
      return [o.order_number, o.customer_name, o.customer_mobile, ...(o.items ?? []).map((i) => i.product_name)].some((v) => v?.toLowerCase().includes(q))
    })
  }, [orders, tab, payment, search])

  const table = useTable(filtered, { sorters: orderSorters, initialSort: { key: 'order', dir: 'desc' }, resetKey: `${search}|${tab}|${payment}` })

  const revenue = orders.filter((o) => statusOf(o) !== 'cancelled').reduce((s, o) => s + (Number(o.grand_total) || 0), 0)
  const selected = orders.find((o) => o.order_number === selectedNo) ?? null
  const activeFilters = (tab !== 'all' ? 1 : 0) + (payment !== 'all' ? 1 : 0)

  const quickMove = async (o: OrderResponse, to: string) => {
    try {
      const updated = await orderService.adminUpdateStatus(o.order_number, to)
      setOrders((os) => os.map((x) => (x.order_number === updated.order_number ? updated : x)))
      showToast(`${o.order_number} marked ${STATUS_LABELS[to].toLowerCase()}`, 'success')
    } catch (e) {
      showToast(apiErrorMessage(e, 'Could not update the order.'), 'error')
    }
  }

  const exportOrders = () =>
    exportCsv(
      `orders-${new Date().toISOString().slice(0, 10)}`,
      ['Order', 'Placed', 'Customer', 'Mobile', 'Items', 'Total (INR)', 'Payment', 'Status'],
      table.sorted.map((o) => [
        o.order_number,
        o.created_at ? new Date(o.created_at).toLocaleString('en-IN') : '',
        o.customer_name,
        o.customer_mobile,
        (o.items ?? []).map((i) => `${i.product_name} x${i.quantity}`).join('; '),
        Number(o.grand_total) || 0,
        paymentLabel(o),
        STATUS_LABELS[statusOf(o)] ?? statusOf(o),
      ]),
    )

  const th = { sort: table.sort, onSort: table.toggleSort }

  return (
    <PageLayout title="Order">
      <PageHeader
        title="Order"
        actions={
          <>
            <SearchBox value={search} onChange={setSearch} placeholder="Search orders" />
            <ShowingSelect value={table.pageSize} onChange={table.setPageSize} />
            <FilterMenu activeCount={activeFilters} onReset={() => { setTab('all'); setPayment('all') }}>
              <FilterSelect label="Status" value={tab} onChange={(v) => setTab(v as TabKey)}
                options={TABS.map((t) => ({ value: t.key, label: `${t.label} (${counts[t.key] ?? 0})` }))} />
              <FilterSelect label="Payment" value={payment} onChange={setPayment}
                options={[{ value: 'all', label: 'Any payment' }, { value: 'paid', label: 'Paid' }, { value: 'pending', label: 'Pending' }, { value: 'failed', label: 'Failed' }]} />
            </FilterMenu>
            <ExportBtn onClick={exportOrders} disabled={filtered.length === 0} />
            <ToolbarBtn onClick={load} aria-label="Refresh" title="Refresh" className="!px-3" icon={<FiRefreshCw size={15} className={loading ? 'animate-spin' : ''} />} />
          </>
        }
      />

      <div className="space-y-5">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard loading={loading && !orders.length} label="To fulfil" tone="warning" icon={<FiClock size={16} />} value={counts.open ?? 0} hint="placed, accepted or packing" onClick={() => setTab('open')} />
          <KpiCard loading={loading && !orders.length} label="In transit" tone="info" icon={<FiTruck size={16} />} value={counts.transit ?? 0} onClick={() => setTab('transit')} />
          <KpiCard loading={loading && !orders.length} label="Delivered" tone="success" icon={<FiCheck size={16} />} value={counts.delivered ?? 0} onClick={() => setTab('delivered')} />
          <KpiCard loading={loading && !orders.length} label="Order value" tone="brand" icon={<FiCreditCard size={16} />} value={formatINR(revenue, true)} hint="excluding cancelled" />
        </div>

        {error ? (
          <ErrorBanner message={error} onRetry={load} />
        ) : loading && !orders.length ? (
          <div className="table-wrap p-4 space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="table-wrap">
            <EmptyState icon={<FiShoppingBag size={20} />} title={orders.length ? 'No orders match' : 'No orders yet'}
              description={orders.length ? 'Try another search or clear the filters.' : 'Orders placed on the storefront appear here.'}
              action={orders.length && (activeFilters || search) ? (
                <button type="button" className="text-sm font-semibold text-primary" onClick={() => { setTab('all'); setPayment('all'); setSearch('') }}>Clear filters</button>
              ) : undefined} />
          </div>
        ) : (
          <div className="table-wrap">
            <div className="table-scroll">
              <table className="min-w-[920px]">
                <thead>
                  <tr>
                    <SortTh label="Order" sortKey="order" {...th} />
                    <SortTh label="Customer" sortKey="customer" {...th} />
                    <SortTh label="Items" sortKey="items" {...th} />
                    <SortTh label="Total" sortKey="total" align="right" {...th} />
                    <SortTh label="Payment" sortKey="payment" {...th} />
                    <SortTh label="Status" sortKey="status" {...th} />
                    <SortTh label="Action" align="center" />
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((o) => {
                    const st = statusOf(o)
                    const items = o.items ?? []
                    const next = FLOW[FLOW.indexOf(st) + 1]
                    return (
                      <tr key={o.order_number} className="cursor-pointer" onClick={() => setSelectedNo(o.order_number)}>
                        <td>
                          <span className="block font-semibold text-text-primary text-[13px]">{o.order_number}</span>
                          <span className="block text-xs text-text-muted">{o.created_at ? new Date(o.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</span>
                        </td>
                        <td>
                          <div className="flex items-center gap-3 min-w-[180px]">
                            <Thumb name={o.customer_name || 'C'} />
                            <div className="min-w-0">
                              <span className="block font-medium text-text-primary truncate max-w-[160px]">{o.customer_name || 'Customer'}</span>
                              <span className="block text-xs text-text-label">{o.customer_mobile}</span>
                            </div>
                          </div>
                        </td>
                        <td className="max-w-[220px]">
                          <span className="block truncate">{items[0]?.product_name ?? '—'}</span>
                          {items.length > 1 && <span className="block text-xs text-text-label">+{items.length - 1} more</span>}
                        </td>
                        <td className="text-right font-semibold text-text-primary">{formatINR(Number(o.grand_total) || 0)}</td>
                        <td><StatusPill tone={toneForStatus(o.payment_status)}>{paymentLabel(o)}</StatusPill></td>
                        <td><StatusPill tone={toneForStatus(st)}>{STATUS_LABELS[st] ?? st}</StatusPill></td>
                        <td className="text-center" onClick={(e) => e.stopPropagation()}>
                          <RowMenu
                            label={`Actions for ${o.order_number}`}
                            items={[
                              { label: 'View details', icon: <FiEye size={15} />, onClick: () => setSelectedNo(o.order_number) },
                              ...(next && st !== 'cancelled'
                                ? [{ label: `Mark ${STATUS_LABELS[next].toLowerCase()}`, icon: <FiTruck size={15} />, onClick: () => quickMove(o, next) }]
                                : []),
                              ...(CANCELLABLE.has(st)
                                ? [{ label: 'Cancel order', icon: <FiXCircle size={15} />, danger: true, onClick: () => setSelectedNo(o.order_number) }]
                                : []),
                            ]}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={table.page} totalPages={table.totalPages} onPage={table.setPage} summary={`${table.total} of ${orders.length} orders`} />
          </div>
        )}
      </div>

      <OrderDrawer order={selected} onClose={() => setSelectedNo(null)} onUpdated={(u) => setOrders((os) => os.map((o) => (o.order_number === u.order_number ? u : o)))} />
    </PageLayout>
  )
}
