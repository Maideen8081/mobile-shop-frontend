import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiAlertTriangle, FiArrowRight, FiBox, FiClock, FiDollarSign, FiPackage, FiRefreshCw,
  FiRepeat, FiShoppingBag, FiTool, FiTrendingUp, FiUsers,
} from 'react-icons/fi'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import PageLayout from '../components/layout/PageLayout'
import {
  Btn, EmptyState, ErrorBanner, KpiCard, PageHeader, Panel, Skeleton, StatusPill,
  apiErrorMessage, formatINR, timeAgo, toneForStatus,
} from '../components/admin/AdminUI'
import { adminService, type DashboardData } from '../services/adminService'
import { useAuth } from '../context/AuthContext'

const BRAND = '#cb202d'
const axisTick = { fontSize: 11, fill: '#98a2b3' }

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function ChartTooltip({ active, payload, label, money = true }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string; money?: boolean }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl bg-[#101828] text-white px-3 py-2 shadow-lg text-xs">
      <p className="text-[#98a2b3] mb-0.5">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="font-semibold tabular">
          {p.name === 'orders' ? `${p.value} orders` : money ? formatINR(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setData(await adminService.dashboard())
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not load dashboard figures.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const k = data?.kpis
  const firstName = user?.fullName?.trim().split(' ')[0] || ''

  const alerts = k
    ? [
        k.repairsUrgent > 0 && { tone: 'danger' as const, text: `${k.repairsUrgent} high-priority repair${k.repairsUrgent > 1 ? 's' : ''} open`, path: '/admin/repair-dashboard' },
        k.outOfStockCount > 0 && { tone: 'danger' as const, text: `${k.outOfStockCount} variant${k.outOfStockCount > 1 ? 's' : ''} out of stock`, path: '/admin/products' },
        k.lowStockCount > 0 && { tone: 'warning' as const, text: `${k.lowStockCount} running low on stock`, path: '/admin/products' },
        k.ordersOpen > 0 && { tone: 'info' as const, text: `${k.ordersOpen} order${k.ordersOpen > 1 ? 's' : ''} to fulfil`, path: '/admin/online-orders' },
        k.tradeInsPending > 0 && { tone: 'warning' as const, text: `${k.tradeInsPending} trade-in${k.tradeInsPending > 1 ? 's' : ''} awaiting review`, path: '/admin/trade-in-management' },
        k.repairsReady > 0 && { tone: 'success' as const, text: `${k.repairsReady} repair${k.repairsReady > 1 ? 's' : ''} ready for pickup`, path: '/admin/repair-dashboard' },
      ].filter(Boolean) as { tone: 'danger' | 'warning' | 'info' | 'success'; text: string; path: string }[]
    : []

  const salesTrend = (data?.salesTrend ?? []).map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }))
  const fortnightRevenue = salesTrend.reduce((s, d) => s + d.revenue, 0)
  const ordersTotalForBars = Math.max(1, ...(data?.ordersByStatus ?? []).map((o) => o.count))

  return (
    <PageLayout title="Dashboard">
      <PageHeader
        eyebrow={new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
        title={`${greeting()}${firstName ? `, ${firstName}` : ''}`}
        description="Here’s what is happening across your store, workshop and trade-ins today."
        actions={
          <Btn onClick={load} loading={loading && !!data} icon={<FiRefreshCw size={15} />}>
            Refresh
          </Btn>
        }
      />

      {error && <div className="mb-6"><ErrorBanner message={error} onRetry={load} /></div>}

      {alerts.length > 0 && (
        <div className="admin-card p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-text-primary shrink-0">
            <span className="w-7 h-7 rounded-lg bg-[#fffaeb] text-[#dc6803] flex items-center justify-center"><FiAlertTriangle size={14} /></span>
            Needs attention
          </div>
          <div className="flex flex-wrap gap-2">
            {alerts.map((a) => (
              <button key={a.text} type="button" onClick={() => navigate(a.path)} className="transition hover:-translate-y-px">
                <StatusPill tone={a.tone}>{a.text}</StatusPill>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard loading={loading && !data} label="Today’s sales" tone="brand" icon={<FiDollarSign size={16} />}
          value={formatINR(k?.todaySales ?? 0)} delta={k?.todaySalesGrowth} hint={k?.todaySalesGrowth == null ? 'no sales yesterday to compare' : 'vs yesterday'} />
        <KpiCard loading={loading && !data} label="Revenue this month" tone="success" icon={<FiTrendingUp size={16} />}
          value={formatINR(k?.monthRevenue ?? 0, true)} delta={k?.monthRevenueGrowth} hint={k?.monthRevenueGrowth == null ? 'no sales last month to compare' : 'vs last month'} />
        <KpiCard loading={loading && !data} label="Orders to fulfil" tone="info" icon={<FiShoppingBag size={16} />}
          value={k?.ordersOpen ?? 0} hint={`${k?.ordersToday ?? 0} placed today · ${k?.ordersTotal ?? 0} all time`}
          onClick={() => navigate('/admin/online-orders')} />
        <KpiCard loading={loading && !data} label="Open repairs" tone="warning" icon={<FiTool size={16} />}
          value={k?.repairsOpen ?? 0} hint={`${k?.repairsToday ?? 0} booked today · ${k?.repairsUrgent ?? 0} urgent`}
          onClick={() => navigate('/admin/repair-dashboard')} />
        <KpiCard loading={loading && !data} label="Customers" tone="violet" icon={<FiUsers size={16} />}
          value={(k?.customersTotal ?? 0).toLocaleString('en-IN')} hint={`+${k?.customersNewThisMonth ?? 0} this month`}
          onClick={() => navigate('/admin/customer-list')} />
        <KpiCard loading={loading && !data} label="Published products" tone="neutral" icon={<FiPackage size={16} />}
          value={k?.productsPublished ?? 0} hint={`${(k?.stockUnits ?? 0).toLocaleString('en-IN')} units in stock`}
          onClick={() => navigate('/admin/products')} />
        <KpiCard loading={loading && !data} label="Stock alerts" tone={k && k.outOfStockCount > 0 ? 'danger' : 'warning'} icon={<FiBox size={16} />}
          value={(k?.lowStockCount ?? 0)} hint={`${k?.outOfStockCount ?? 0} out of stock`}
          onClick={() => navigate('/admin/products')} />
        <KpiCard loading={loading && !data} label="Trade-ins to review" tone="neutral" icon={<FiRepeat size={16} />}
          value={k?.tradeInsPending ?? 0} hint="pending or quoted"
          onClick={() => navigate('/admin/trade-in-management')} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mt-4">
        <Panel
          className="xl:col-span-2"
          title="Sales, last 14 days"
          subtitle={data ? `${formatINR(fortnightRevenue)} from ${salesTrend.reduce((s, d) => s + d.orders, 0)} orders (cancelled excluded)` : ' '}
        >
          <div className="h-72 -ml-2">
            {loading && !data ? (
              <Skeleton className="h-full w-full" />
            ) : fortnightRevenue === 0 ? (
              <EmptyState icon={<FiTrendingUp size={20} />} title="No sales in the last 14 days" description="Orders placed on the storefront will show up here." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={BRAND} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={BRAND} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#eef0f3" />
                  <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => formatINR(v, true)} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#d0d5dd', strokeDasharray: '4 4' }} />
                  <Area type="monotone" dataKey="revenue" name="revenue" stroke={BRAND} strokeWidth={2.25} fill="url(#dashRev)" activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel title="Orders by status" subtitle="All time" action={
          <button type="button" onClick={() => navigate('/admin/online-orders')} className="text-xs font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1">
            Manage <FiArrowRight size={12} />
          </button>
        }>
          {loading && !data ? (
            <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-6" />)}</div>
          ) : (
            <ul className="space-y-3.5">
              {(data?.ordersByStatus ?? []).map((o) => (
                <li key={o.status}>
                  <div className="flex items-center justify-between text-[13px] mb-1.5">
                    <span className="text-text-secondary">{o.label}</span>
                    <span className="font-semibold text-text-primary tabular">{o.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface-lighter overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${(o.count / ordersTotalForBars) * 100}%`,
                        background: { success: '#17b26a', danger: '#f04438', warning: '#f79009', info: '#2e90fa' }[toneForStatus(o.status) as string] ?? '#98a2b3',
                      }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mt-4">
        <Panel title="Monthly revenue" subtitle="Last 6 months">
          <div className="h-56 -ml-2">
            {loading && !data ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.revenueTrend ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#eef0f3" />
                  <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                  <YAxis tick={axisTick} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => formatINR(v, true)} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f2f4f7' }} />
                  <Bar dataKey="revenue" name="revenue" fill={BRAND} radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Panel>

        <Panel title="Best sellers" subtitle="By units sold">
          {loading && !data ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9" />)}</div>
          ) : !data?.topProducts.length ? (
            <EmptyState icon={<FiPackage size={20} />} title="No sales yet" description="Your best-selling products will be ranked here." />
          ) : (
            <ol className="space-y-1">
              {data.topProducts.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 py-2">
                  <span className={`w-6 h-6 rounded-lg text-[11px] font-bold flex items-center justify-center ${i === 0 ? 'bg-[#fdecee] text-primary' : 'bg-surface-lighter text-text-label'}`}>{i + 1}</span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-text-primary truncate">{p.name}</span>
                    <span className="block text-xs text-text-label">{p.units} sold</span>
                  </span>
                  <span className="text-sm font-semibold text-text-primary tabular">{formatINR(p.revenue)}</span>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title="Low stock" subtitle="At or below alert level" action={
          <button type="button" onClick={() => navigate('/admin/products')} className="text-xs font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1">
            Restock <FiArrowRight size={12} />
          </button>
        }>
          {loading && !data ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-9" />)}</div>
          ) : !data?.lowStock.length ? (
            <EmptyState icon={<FiBox size={20} />} title="Stock levels look healthy" description="Variants that drop to their alert level appear here." />
          ) : (
            <ul className="space-y-1">
              {data.lowStock.map((v) => (
                <li key={v.id} className="flex items-center gap-3 py-2">
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-text-primary truncate">{v.product}</span>
                    <span className="block text-xs text-text-label truncate">{v.variant}</span>
                  </span>
                  <StatusPill tone={v.stock === 0 ? 'danger' : 'warning'}>
                    {v.stock === 0 ? 'Out of stock' : `${v.stock} left`}
                  </StatusPill>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
        <Panel title="Recent orders" bodyClassName="pt-3" action={
          <button type="button" onClick={() => navigate('/admin/online-orders')} className="text-xs font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1">
            View all <FiArrowRight size={12} />
          </button>
        }>
          {loading && !data ? (
            <div className="px-5 pb-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : !data?.recentOrders.length ? (
            <EmptyState icon={<FiShoppingBag size={20} />} title="No orders yet" />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr><th>Order</th><th>Customer</th><th className="!text-right">Total</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {data.recentOrders.map((o) => (
                    <tr key={o.orderNumber} className="cursor-pointer" onClick={() => navigate(`/admin/online-orders?q=${encodeURIComponent(o.orderNumber)}`)}>
                      <td>
                        <span className="block font-semibold text-text-primary text-[13px]">{o.orderNumber}</span>
                        <span className="block text-xs text-text-muted">{timeAgo(o.createdAt)}</span>
                      </td>
                      <td className="max-w-[160px] truncate">{o.customer}</td>
                      <td className="text-right font-semibold text-text-primary">{formatINR(o.total)}</td>
                      <td><StatusPill tone={toneForStatus(o.status)}>{o.statusLabel}</StatusPill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Latest repair tickets" bodyClassName="pt-3" action={
          <button type="button" onClick={() => navigate('/admin/repair-dashboard')} className="text-xs font-semibold text-primary hover:text-primary-hover inline-flex items-center gap-1">
            View all <FiArrowRight size={12} />
          </button>
        }>
          {loading && !data ? (
            <div className="px-5 pb-5 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : !data?.recentRepairs.length ? (
            <EmptyState icon={<FiTool size={20} />} title="No repair tickets yet" action={<Btn variant="primary" size="sm" onClick={() => navigate('/admin/new-repair')}>Create ticket</Btn>} />
          ) : (
            <div className="table-scroll">
              <table>
                <thead>
                  <tr><th>Ticket</th><th>Device</th><th className="hidden 2xl:table-cell">Priority</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {data.recentRepairs.map((r) => (
                    <tr key={r.id} className="cursor-pointer" onClick={() => navigate('/admin/repair-dashboard')}>
                      <td>
                        <span className="block font-semibold text-text-primary text-[13px]">{r.ticketNumber}</span>
                        <span className="block text-xs text-text-muted truncate max-w-[140px]">{r.customer} · {timeAgo(r.createdAt)}</span>
                      </td>
                      <td className="max-w-[180px] truncate">
                        {['high', 'urgent'].includes(r.priority) && <FiAlertTriangle size={12} className="inline text-danger mr-1.5 -mt-0.5" aria-label={`${r.priority} priority`} />}
                        {r.device}
                      </td>
                      <td className="hidden 2xl:table-cell">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium capitalize text-text-secondary">
                          {['high', 'urgent'].includes(r.priority) ? <FiAlertTriangle size={12} className="text-danger" /> : <FiClock size={12} className="text-text-muted" />}
                          {r.priority}
                        </span>
                      </td>
                      <td><StatusPill tone={toneForStatus(r.status)}>{r.statusLabel}</StatusPill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>
    </PageLayout>
  )
}
