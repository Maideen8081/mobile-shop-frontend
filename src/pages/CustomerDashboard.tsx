import { motion } from 'framer-motion'
import { FiArrowRight } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts'
import PageLayout from '../components/layout/PageLayout'
import { crmKPIs, customers, crmAnalytics } from '../data/crmData'

interface KPI { id: number; title: string; value: number; prefix?: string; suffix?: string; growth: number; trend: 'up' | 'down'; subtitle: string; color: string; bgGlow: string; icon: string; sparkline: number[] }

function StatCard({ title, value, prefix, suffix, growth, trend, subtitle, color, bgGlow, sparkline, delay = 0 }: KPI & { delay?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="relative rounded-3xl bg-bg-card border border-border shadow-lg shadow-black/[0.03] p-4 lg:p-5 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-[0.03]" style={{ background: `radial-gradient(120px at 80% 20%, ${color}, transparent)` }} />
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{title}</span>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: bgGlow, color }}>{/* icon placeholder */}</div>
      </div>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="text-xl lg:text-2xl font-bold text-text-primary tracking-tight">{prefix || ''}{value.toLocaleString('en-IN')}{suffix || ''}</span>
        <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
          <span>{trend === 'up' ? '↑' : '↓'}</span> {Math.abs(growth)}%
        </span>
      </div>
      <p className="text-[10px] text-text-muted mb-3">{subtitle}</p>
      <svg className="w-full h-8" viewBox={`0 0 ${sparkline.length - 1} 100`} preserveAspectRatio="none">
        <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          points={sparkline.map((v, i) => `${i},${100 - (v / Math.max(...sparkline)) * 90}`).join(' ')} />
      </svg>
    </motion.div>
  )
}
import CrmActivityFeed from '../components/crm/CrmActivityFeed'
import CustomerCard from '../components/crm/CustomerCard'

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-card rounded-xl border border-border shadow-xl px-4 py-3">
      <p className="text-xs font-semibold text-text-muted mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-text-muted">{entry.name}: </span>
          <span className="font-semibold text-text-primary">{entry.value.toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  )
}

export default function CustomerDashboard() {
  const navigate = useNavigate()
  const topCustomers = customers.filter((c) => c.vip).slice(0, 4)
  const growthData = crmAnalytics.customerGrowth
  const segmentData = crmAnalytics.revenueBySegment

  return (
    <PageLayout title="Customer Relationship Management">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
              <span className="hover:text-text-secondary transition-colors cursor-pointer">CRM</span>
              <span>/</span>
              <span className="text-text-secondary font-medium">Dashboard</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-text-primary tracking-tight">Customer Relationship Management</h1>
            <p className="text-sm text-text-muted mt-0.5">Manage customers, loyalty programs, campaigns, and customer engagement.</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {crmKPIs.slice(0, 8).map((card, i) => (
          <StatCard key={card.id} {...card} delay={i * 0.05} />
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 lg:gap-6">
        <div className="xl:col-span-3 space-y-4 lg:space-y-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="relative rounded-3xl bg-bg-card border border-border shadow-lg shadow-black/[0.03] p-5 lg:p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-sm font-bold text-text-primary tracking-tight">Customer Growth</h3>
                <p className="text-xs text-text-muted mt-0.5">New vs Returning customer trends</p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growthData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <defs>
                    <linearGradient id="crm-new-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="crm-returning-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f6bff" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#4f6bff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" strokeOpacity={0.5} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="new" stroke="#8b5cf6" fill="url(#crm-new-grad)" strokeWidth={2.5} name="New Customers" />
                  <Area type="monotone" dataKey="returning" stroke="#4f6bff" fill="url(#crm-returning-grad)" strokeWidth={2.5} name="Returning" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="relative rounded-3xl bg-bg-card border border-border shadow-lg shadow-black/[0.03] p-5 lg:p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-text-primary tracking-tight">Top Customers</h3>
                <p className="text-xs text-text-muted mt-0.5">Highest value VIP customers</p>
              </div>
              <button onClick={() => navigate('/customer-list')} className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-purple-700 cursor-pointer">
                View All <FiArrowRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {topCustomers.map((c, i) => (
                <CustomerCard key={c.id} customer={c} index={i} onClick={() => navigate(`/customer-profile?id=${c.id}`)} />
              ))}
            </div>
          </motion.div>
        </div>

        <div className="xl:col-span-2 space-y-4 lg:space-y-6">
          <CrmActivityFeed />

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="relative rounded-3xl bg-bg-card border border-border shadow-lg shadow-black/[0.03] p-5 lg:p-6"
          >
            <h3 className="text-sm font-bold text-text-primary tracking-tight mb-4">Revenue by Segment</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={segmentData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" strokeOpacity={0.5} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="value" name="Revenue Share" radius={[0, 6, 6, 0]} barSize={20}>
                    {segmentData.map((entry, i) => (
                      <rect key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-3 mt-3">
              {segmentData.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                  <span className="text-[10px] text-text-muted">{item.name}</span>
                  <span className="text-[10px] font-semibold text-text-secondary">{item.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </PageLayout>
  )
}
