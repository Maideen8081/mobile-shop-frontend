import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  FiEye, FiLogIn, FiMail, FiMapPin, FiPhone, FiRefreshCw, FiShoppingBag,
  FiTool, FiUserCheck, FiUserPlus, FiUsers, FiUserX, FiX,
} from 'react-icons/fi'
import PageLayout from '../components/layout/PageLayout'
import {
  ConfirmDialog, EmptyState, ErrorBanner, ExportBtn, FilterMenu, FilterSelect, KpiCard, PageHeader, Pagination, RowMenu,
  SearchBox, ShowingSelect, Skeleton, SortTh, StatusPill, ToolbarBtn,
  apiErrorMessage, exportCsv, formatDate, formatINR, timeAgo, toneForStatus, type SortState,
} from '../components/admin/AdminUI'
import { adminService, type AdminCustomer, type AdminCustomerDetail, type CustomerPage, type CustomerQuery, type SignInMethod } from '../services/adminService'
import { GoogleSvg } from '../components/icons'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'
import Portal from '../components/ui/Portal'
import { useToast } from '../context/ToastContext'

function Avatar({ name, email, src, size = 'md' }: { name: string; email: string; src?: string | null; size?: 'md' | 'lg' }) {
  const [broken, setBroken] = useState(false)
  const label = (name || email).trim()
  const initials = label.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
  const hue = [...label].reduce((h, c) => h + c.charCodeAt(0), 0) % 360
  const dims = size === 'lg' ? 'w-14 h-14 text-lg' : 'w-9 h-9 text-xs'
  if (src && !broken) {
    return (
      // Google photo URLs reject requests that send a Referer, hence no-referrer.
      <img src={src} alt="" referrerPolicy="no-referrer" loading="lazy" onError={() => setBroken(true)}
        className={`${dims} rounded-full object-cover shrink-0 ring-1 ring-inset ring-black/5`} />
    )
  }
  return (
    <span
      className={`${dims} rounded-full flex items-center justify-center font-semibold shrink-0 ring-1 ring-inset ring-black/5`}
      style={{ background: `hsl(${hue} 70% 95%)`, color: `hsl(${hue} 45% 35%)` }}
    >
      {initials || '?'}
    </span>
  )
}

const SIGN_IN_LABEL: Record<SignInMethod, string> = { google: 'Google', password: 'Email', both: 'Google + Email' }

/** How the customer signs in: a Google account, an email + password, or both linked. */
function SignInBadge({ method }: { method: SignInMethod }) {
  const google = method !== 'password'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
        google ? 'bg-white text-text-primary ring-1 ring-inset ring-[#dadce0]' : 'bg-[#f2f4f7] text-[#475467]'
      }`}
      title={method === 'both' ? 'Signs in with Google or with email and password' : undefined}
    >
      {google ? <GoogleSvg size={13} /> : <FiMail size={12} />}
      {SIGN_IN_LABEL[method]}
    </span>
  )
}

function CustomerDrawer({
  customerId,
  onClose,
  onChanged,
}: {
  customerId: number | null
  onClose: () => void
  onChanged: (c: AdminCustomer) => void
}) {
  useLockBodyScroll(customerId != null)
  const showToast = useToast().show
  const [detail, setDetail] = useState<AdminCustomerDetail | null>(null)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (customerId == null) return
    setDetail(null)
    setError('')
    adminService.customer(customerId).then(setDetail).catch((e) => setError(apiErrorMessage(e, 'Could not load this customer.')))
  }, [customerId])

  useEffect(() => {
    if (customerId == null) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !confirming && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [customerId, confirming, onClose])

  const toggleActive = async () => {
    if (!detail) return
    setSaving(true)
    try {
      const updated = await adminService.setCustomerActive(detail.id, !detail.isActive)
      setDetail({ ...detail, isActive: updated.isActive })
      onChanged(updated)
      showToast(updated.isActive ? 'Customer re-activated' : 'Customer deactivated — they can no longer sign in', 'success')
      setConfirming(false)
    } catch (e) {
      showToast(apiErrorMessage(e), 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Portal>
    <AnimatePresence>
      {customerId != null && (
        <motion.div className="fixed inset-0 z-[70]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-[#0c111d]/40" onClick={onClose} />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Customer details"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-[var(--shadow-pop)] flex flex-col"
          >
            <div className="flex items-center justify-between px-6 h-16 border-b border-border-light shrink-0">
              <p className="text-sm font-semibold text-text-primary">Customer</p>
              <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-lg flex items-center justify-center text-text-label hover:bg-surface-hover">
                <FiX size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {error && <div className="p-6"><ErrorBanner message={error} /></div>}
              {!detail && !error && (
                <div className="p-6 space-y-4">
                  <div className="flex items-center gap-4"><Skeleton className="w-14 h-14 !rounded-full" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-56" /></div></div>
                  <Skeleton className="h-20" /><Skeleton className="h-32" /><Skeleton className="h-32" />
                </div>
              )}
              {detail && (
                <>
                  <div className="p-6 border-b border-border-light">
                    <div className="flex items-center gap-4">
                      <Avatar name={detail.name} email={detail.email} src={detail.avatarUrl} size="lg" />
                      <div className="min-w-0">
                        <p className="text-lg font-semibold text-text-primary truncate">{detail.name || 'Unnamed customer'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusPill tone={detail.isActive ? 'success' : 'danger'}>{detail.isActive ? 'Active' : 'Deactivated'}</StatusPill>
                          {detail.isVerified && <StatusPill tone="info" dot={false}>Verified</StatusPill>}
                          <SignInBadge method={detail.signInMethod} />
                        </div>
                      </div>
                    </div>
                    <dl className="mt-5 space-y-2.5 text-sm">
                      <div className="flex items-center gap-3 text-text-secondary"><FiMail className="text-text-muted shrink-0" /><a className="hover:text-primary truncate" href={`mailto:${detail.email}`}>{detail.email}</a></div>
                      <div className="flex items-center gap-3 text-text-secondary"><FiPhone className="text-text-muted shrink-0" />{detail.mobile ? <a className="hover:text-primary" href={`tel:${detail.mobile}`}>{detail.mobile}</a> : <span className="text-text-muted">No mobile number</span>}</div>
                      <div className="flex items-center gap-3 text-text-secondary"><FiUserPlus className="text-text-muted shrink-0" />Joined {formatDate(detail.dateJoined)}</div>
                      <div className="flex items-center gap-3 text-text-secondary"><FiLogIn className="text-text-muted shrink-0" />{detail.lastLogin ? <>Last login {timeAgo(detail.lastLogin)} <span className="text-text-muted">· {formatDate(detail.lastLogin, true)}</span></> : <span className="text-text-muted">Never logged in</span>}</div>
                      <div className="flex items-center gap-3 text-text-secondary">{detail.googleLinked ? <GoogleSvg size={15} className="shrink-0" /> : <FiMail className="text-text-muted shrink-0" />}{
                        detail.signInMethod === 'google' ? 'Signs in with Google (no password set)'
                        : detail.signInMethod === 'both' ? 'Signs in with Google or email + password'
                        : 'Signs in with email + password'}</div>
                    </dl>
                    <div className="grid grid-cols-3 gap-2 mt-5">
                      {[
                        { label: 'Orders', value: detail.ordersCount },
                        { label: 'Spent', value: formatINR(detail.totalSpent, true) },
                        { label: 'Repairs', value: detail.repairsCount },
                      ].map((s) => (
                        <div key={s.label} className="rounded-xl bg-surface-lighter px-3 py-2.5 text-center">
                          <p className="text-base font-bold text-text-primary tabular">{s.value}</p>
                          <p className="text-[11px] text-text-label">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <section className="p-6 border-b border-border-light">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-text-label mb-3">Recent orders</h4>
                    {detail.orders.length === 0 ? (
                      <p className="text-sm text-text-muted">No orders yet.</p>
                    ) : (
                      <ul className="divide-y divide-border-light">
                        {detail.orders.map((o) => (
                          <li key={o.orderNumber} className="py-2.5 flex items-center gap-3">
                            <FiShoppingBag className="text-text-muted shrink-0" />
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm font-medium text-text-primary">{o.orderNumber}</span>
                              <span className="block text-xs text-text-label">{o.items} item{o.items === 1 ? '' : 's'} · {formatDate(o.createdAt)}</span>
                            </span>
                            <span className="text-right">
                              <span className="block text-sm font-semibold text-text-primary tabular">{formatINR(o.total)}</span>
                              <StatusPill tone={toneForStatus(o.status)} dot={false}>{o.statusLabel}</StatusPill>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section className="p-6 border-b border-border-light">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-text-label mb-3">Repairs</h4>
                    {detail.repairs.length === 0 ? (
                      <p className="text-sm text-text-muted">No repair tickets.</p>
                    ) : (
                      <ul className="divide-y divide-border-light">
                        {detail.repairs.map((r) => (
                          <li key={r.id} className="py-2.5 flex items-center gap-3">
                            <FiTool className="text-text-muted shrink-0" />
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm font-medium text-text-primary truncate">{r.device}</span>
                              <span className="block text-xs text-text-label">{r.ticketNumber} · {formatDate(r.createdAt)}</span>
                            </span>
                            <StatusPill tone={toneForStatus(r.status)}>{r.statusLabel}</StatusPill>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  <section className="p-6">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-text-label mb-3">Saved addresses</h4>
                    {detail.addresses.length === 0 ? (
                      <p className="text-sm text-text-muted">No saved addresses.</p>
                    ) : (
                      <ul className="space-y-2.5">
                        {detail.addresses.map((a) => (
                          <li key={a.id} className="rounded-xl ring-1 ring-inset ring-border p-3 text-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <FiMapPin size={13} className="text-text-muted" />
                              <span className="font-medium text-text-primary">{a.fullName}</span>
                              <span className="text-xs text-text-label">· {a.type}</span>
                              {a.isDefault && <StatusPill tone="neutral" dot={false}>Default</StatusPill>}
                            </div>
                            <p className="text-text-secondary">{a.line}, {a.city}, {a.state} {a.pincode}</p>
                            <p className="text-xs text-text-label mt-0.5">{a.mobile}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>
                </>
              )}
            </div>

            {detail && (
              <div className="p-4 border-t border-border-light bg-[#fcfcfd] shrink-0">
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  className={`w-full h-10 rounded-[10px] text-sm font-semibold inline-flex items-center justify-center gap-2 transition ${
                    detail.isActive
                      ? 'bg-white text-danger ring-1 ring-inset ring-[#fecdca] hover:bg-[#fef3f2]'
                      : 'bg-[#101828] text-white hover:bg-[#1d2939]'
                  }`}
                >
                  {detail.isActive ? <><FiUserX /> Deactivate account</> : <><FiUserCheck /> Re-activate account</>}
                </button>
              </div>
            )}
          </motion.aside>

          <ConfirmDialog
            open={confirming}
            tone={detail?.isActive ? 'danger' : 'primary'}
            title={detail?.isActive ? 'Deactivate this customer?' : 'Re-activate this customer?'}
            description={
              detail?.isActive
                ? `${detail?.name || detail?.email} will be signed out and unable to sign in or place orders. Their order history is kept.`
                : `${detail?.name || detail?.email} will be able to sign in and place orders again.`
            }
            confirmLabel={detail?.isActive ? 'Deactivate' : 'Re-activate'}
            loading={saving}
            onConfirm={toggleActive}
            onClose={() => setConfirming(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
    </Portal>
  )
}

// Column → server sort. Columns without a server sort aren't sortable.
const SORT_FOR: Record<string, { asc: CustomerQuery['sort']; desc: CustomerQuery['sort'] }> = {
  name: { asc: 'name', desc: 'name' },
  orders: { asc: 'orders', desc: 'orders' },
  spent: { asc: 'spent', desc: 'spent' },
  joined: { asc: 'oldest', desc: 'newest' },
}

export default function CustomerList() {
  const [searchInput, setSearchInput] = useState('')
  const [query, setQuery] = useState<CustomerQuery>({ search: '', status: '', sort: 'newest', page: 1, page_size: 10 })
  const [data, setData] = useState<CustomerPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [openId, setOpenId] = useState<number | null>(null)

  // Debounce typing so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = window.setTimeout(() => setQuery((q) => (q.search === searchInput.trim() ? q : { ...q, search: searchInput.trim(), page: 1 })), 300)
    return () => window.clearTimeout(t)
  }, [searchInput])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await adminService.customers(query))
    } catch (e) {
      setError(apiErrorMessage(e, 'Could not load customers.'))
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    load()
  }, [load])

  const pageSize = query.page_size ?? 10
  const totalPages = data ? Math.max(1, Math.ceil(data.count / pageSize)) : 1
  const page = query.page ?? 1
  const filtered = !!(query.search || query.status || query.provider)

  // Present the server sort as a SortTh state.
  const sortState: SortState = (() => {
    switch (query.sort) {
      case 'name': return { key: 'name', dir: 'asc' }
      case 'orders': return { key: 'orders', dir: 'desc' }
      case 'spent': return { key: 'spent', dir: 'desc' }
      case 'oldest': return { key: 'joined', dir: 'asc' }
      default: return { key: 'joined', dir: 'desc' }
    }
  })()
  const onSort = (key: string) => {
    const map = SORT_FOR[key]
    if (!map) return
    const nextDir = sortState?.key === key && sortState.dir === 'desc' ? 'asc' : 'desc'
    setQuery((q) => ({ ...q, sort: map[nextDir], page: 1 }))
  }

  const onChanged = (c: AdminCustomer) =>
    setData((d) => (d ? { ...d, results: d.results.map((r) => (r.id === c.id ? { ...r, isActive: c.isActive } : r)) } : d))

  const exportPage = () =>
    exportCsv(
      `customers-${new Date().toISOString().slice(0, 10)}`,
      ['Name', 'Email', 'Sign-in method', 'Mobile', 'Orders', 'Total spent (INR)', 'Repairs', 'Last order', 'Joined', 'Last login', 'Status'],
      (data?.results ?? []).map((c) => [
        c.name, c.email, SIGN_IN_LABEL[c.signInMethod] ?? '', c.mobile, c.ordersCount, c.totalSpent, c.repairsCount,
        c.lastOrderAt ? new Date(c.lastOrderAt).toLocaleDateString('en-IN') : '', new Date(c.dateJoined).toLocaleDateString('en-IN'),
        c.lastLogin ? new Date(c.lastLogin).toLocaleString('en-IN') : '',
        c.isActive ? 'Active' : 'Deactivated',
      ]),
    )

  const th = { sort: sortState, onSort }

  return (
    <PageLayout title="Customer">
      <PageHeader
        title="Customer"
        actions={
          <>
            <SearchBox value={searchInput} onChange={setSearchInput} placeholder="Search customers" />
            <ShowingSelect value={pageSize} onChange={(n) => setQuery((q) => ({ ...q, page_size: n, page: 1 }))} />
            <FilterMenu activeCount={(query.status ? 1 : 0) + (query.provider ? 1 : 0)} onReset={() => setQuery((q) => ({ ...q, status: '', provider: '', page: 1 }))}>
              <FilterSelect label="Account status" value={query.status ?? ''}
                onChange={(v) => setQuery((q) => ({ ...q, status: v as CustomerQuery['status'], page: 1 }))}
                options={[{ value: '', label: 'All accounts' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Deactivated' }]} />
              <FilterSelect label="Sign-in method" value={query.provider ?? ''}
                onChange={(v) => setQuery((q) => ({ ...q, provider: v as CustomerQuery['provider'], page: 1 }))}
                options={[{ value: '', label: 'Any method' }, { value: 'google', label: 'Google' }, { value: 'password', label: 'Email + password only' }]} />
            </FilterMenu>
            <ExportBtn onClick={exportPage} disabled={!data?.results.length} />
            <ToolbarBtn onClick={load} aria-label="Refresh" title="Refresh" className="!px-3" icon={<FiRefreshCw size={15} className={loading ? 'animate-spin' : ''} />} />
          </>
        }
      />

      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <KpiCard loading={!data} label="Total customers" tone="violet" icon={<FiUsers size={16} />} value={data?.summary.total.toLocaleString('en-IN') ?? 0}
            onClick={() => setQuery((q) => ({ ...q, status: '', page: 1 }))} />
          <KpiCard loading={!data} label="Active accounts" tone="success" icon={<FiUserCheck size={16} />} value={data?.summary.active.toLocaleString('en-IN') ?? 0}
            hint={data ? `${data.summary.total - data.summary.active} deactivated` : ''} onClick={() => setQuery((q) => ({ ...q, status: 'active', page: 1 }))} />
          <KpiCard loading={!data} label="Joined this month" tone="info" icon={<FiUserPlus size={16} />} value={data?.summary.newThisMonth ?? 0}
            onClick={() => setQuery((q) => ({ ...q, sort: 'newest', page: 1 }))} />
          <KpiCard loading={!data} label="Have ordered" tone="brand" icon={<FiShoppingBag size={16} />} value={data?.summary.withOrders ?? 0}
            hint={data && data.summary.total ? `${Math.round((data.summary.withOrders / data.summary.total) * 100)}% of customers` : ''}
            onClick={() => setQuery((q) => ({ ...q, sort: 'spent', page: 1 }))} />
          <KpiCard loading={!data} label="Google sign-ins" tone="info" icon={<GoogleSvg size={16} />} value={data?.summary.google ?? 0}
            hint={data && data.summary.total ? `${Math.round(((data.summary.google ?? 0) / data.summary.total) * 100)}% of customers` : ''}
            onClick={() => setQuery((q) => ({ ...q, provider: 'google', page: 1 }))} />
        </div>

        {error ? (
          <ErrorBanner message={error} onRetry={load} />
        ) : !data && loading ? (
          <div className="table-wrap p-4 space-y-3">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : data && data.results.length === 0 ? (
          <div className="table-wrap">
            <EmptyState
              icon={<FiUsers size={20} />}
              title={filtered ? 'No customers match your filters' : 'No customers yet'}
              description={filtered ? 'Try a different search or clear the status filter.' : 'Customers appear here as soon as they create a storefront account.'}
              action={filtered ? (
                <button type="button" className="text-sm font-semibold text-primary" onClick={() => { setSearchInput(''); setQuery((q) => ({ ...q, search: '', status: '', provider: '', page: 1 })) }}>
                  Clear filters
                </button>
              ) : undefined}
            />
          </div>
        ) : data && (
          <div className="table-wrap">
            <div className={`table-scroll transition-opacity ${loading ? 'opacity-60' : ''}`}>
              <table className="min-w-[1040px] [&_td]:!px-3.5 [&_th]:!px-3.5">
                <thead>
                  <tr>
                    <SortTh label="Customer" sortKey="name" {...th} />
                    <SortTh label="Sign-in" />
                    <SortTh label="Mobile" />
                    <SortTh label="Orders" sortKey="orders" align="right" {...th} />
                    <SortTh label="Total spent" sortKey="spent" align="right" {...th} />
                    <SortTh label="Last order" />
                    <SortTh label="Joined" sortKey="joined" {...th} />
                    <SortTh label="Last login" />
                    <SortTh label="Status" />
                    <SortTh label="Action" align="center" />
                  </tr>
                </thead>
                <tbody>
                  {data.results.map((c) => (
                    <tr key={c.id} className="cursor-pointer" onClick={() => setOpenId(c.id)}>
                      <td>
                        <div className="flex items-center gap-3 min-w-[220px]">
                          <Avatar name={c.name} email={c.email} src={c.avatarUrl} />
                          <div className="min-w-0">
                            <p className="font-medium text-text-primary truncate">{c.name || '—'}</p>
                            <p className="text-xs text-text-label truncate">{c.email}</p>
                          </div>
                        </div>
                      </td>
                      <td><SignInBadge method={c.signInMethod} /></td>
                      <td>{c.mobile || <span className="text-text-muted">—</span>}</td>
                      <td className="text-right">{c.ordersCount}</td>
                      <td className="text-right font-semibold text-text-primary">{formatINR(c.totalSpent)}</td>
                      <td className="text-text-label">{c.lastOrderAt ? timeAgo(c.lastOrderAt) : '—'}</td>
                      <td className="text-text-label whitespace-nowrap">{formatDate(c.dateJoined)}</td>
                      <td className="text-text-label whitespace-nowrap" title={c.lastLogin ? formatDate(c.lastLogin, true) : undefined}>{c.lastLogin ? timeAgo(c.lastLogin) : 'Never'}</td>
                      <td><StatusPill tone={c.isActive ? 'success' : 'danger'}>{c.isActive ? 'Active' : 'Deactivated'}</StatusPill></td>
                      <td className="text-center" onClick={(e) => e.stopPropagation()}>
                        <RowMenu
                          label={`Actions for ${c.name || c.email}`}
                          items={[
                            { label: 'View profile', icon: <FiEye size={15} />, onClick: () => setOpenId(c.id) },
                            { label: 'Email', icon: <FiMail size={15} />, onClick: () => { window.location.href = `mailto:${c.email}` } },
                            ...(c.mobile ? [{ label: 'Call', icon: <FiPhone size={15} />, onClick: () => { window.location.href = `tel:${c.mobile}` } }] : []),
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPage={(p) => setQuery((q) => ({ ...q, page: p }))}
              summary={`${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, data.count)} of ${data.count} customers`} />
          </div>
        )}
      </div>

      <CustomerDrawer customerId={openId} onClose={() => setOpenId(null)} onChanged={onChanged} />
    </PageLayout>
  )
}
