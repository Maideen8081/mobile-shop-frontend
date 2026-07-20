import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { FiTool, FiClock, FiDollarSign, FiUsers } from 'react-icons/fi'
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts'
import PageLayout from '../components/layout/PageLayout'
import { repairAnalytics, repairTickets, repairTechnicians } from '../data/repairData'

const COLORS = ['#8b5cf6', '#4f6bff', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#14b8a6', '#f97316']

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-bg-card rounded-xl border border-border shadow-xl px-4 py-3">
      <p className="text-xs font-semibold text-text-muted mb-2">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-text-muted">{entry.name}: </span>
          <span className="font-semibold text-text-primary">{typeof entry.value === 'number' ? entry.value.toLocaleString('en-IN') : entry.value}</span>
        </div>
      ))}
    </div>
  )
}

const DonutChartCard = ({ title, subtitle, data, colors, delay = 0 }: { title: string; subtitle: string; data: { name: string; value: number }[]; colors: string[]; delay?: number }) => {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-3xl bg-bg-card border border-border p-5 lg:p-6"
    >
      <h3 className="text-sm font-bold text-text-primary tracking-tight mb-0.5">{title}</h3>
      <p className="text-xs text-text-muted mb-4">{subtitle}</p>
      <div className="flex flex-col items-center">
        <div className="h-44 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={72} paddingAngle={3} dataKey="value">
                {data.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
          {data.slice(0, 6).map((item, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: colors[i % colors.length] }} />
              <span className="text-[10px] text-text-muted">{item.name}</span>
              <span className="text-[10px] font-semibold text-text-secondary">{Math.round(item.value / total * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

const OverviewCard = ({ title, value, subtitle, icon: Icon, color, delay = 0 }: { title: string; value: string; subtitle: string; icon: any; color: string; delay?: number }) => (
  <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    whileHover={{ y: -4, boxShadow: '0 32px 80px rgba(0,0,0,0.08)' }}
    className="relative rounded-3xl bg-bg-card border border-border p-5 overflow-hidden group"
  >
    <div className="absolute -top-12 -right-12 w-36 h-36 rounded-full blur-3xl opacity-20 group-hover:scale-150 transition-transform duration-700" style={{ background: color }} />
    <div className="relative z-10">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wider">{title}</p>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-black/5" style={{ background: `linear-gradient(135deg, ${color}15, ${color}08)` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl lg:text-3xl font-bold text-text-primary tracking-tight">{value}</p>
      <p className="text-xs text-text-muted mt-1">{subtitle}</p>
    </div>
  </motion.div>
)

export default function RepairAnalytics() {
  const totalRevenue = repairTickets.reduce((sum, t) => sum + (t.actualCost || t.estimatedCost), 0)
  const totalRepairs = repairTickets.length
  const avgTurnaround = repairAnalytics.turnaroundTime.reduce((a, b) => a + b, 0) / repairAnalytics.turnaroundTime.length
  const avgEfficiency = Math.round(repairTechnicians.reduce((sum, t) => sum + t.efficiency, 0) / repairTechnicians.length)
  const completedRepairs = repairTickets.filter((t) => t.status === 'Delivered').length

  const brandData = useMemo(() => {
    const map = new Map<string, number>()
    repairTickets.forEach((t) => map.set(t.deviceBrand, (map.get(t.deviceBrand) || 0) + 1))
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  }, [])

  const priorityDist = useMemo(() => {
    const map = new Map<string, number>()
    repairTickets.forEach((t) => map.set(t.priority, (map.get(t.priority) || 0) + 1))
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [])

  const statusDist = useMemo(() => {
    const map = new Map<string, number>()
    repairTickets.forEach((t) => map.set(t.status, (map.get(t.status) || 0) + 1))
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }))
  }, [])

  const turnaroundData = repairAnalytics.turnaroundTime.map((days, i) => ({
    month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
    days,
  }))

  const monthlyData = repairAnalytics.monthlyRepairs
  const techData = repairAnalytics.technicianPerformance

  return (
    <PageLayout title="Repair Analytics">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
              <span className="hover:text-text-secondary transition-colors cursor-pointer">Repairs</span>
              <span>/</span>
              <span className="text-text-secondary font-medium">Analytics</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-text-primary tracking-tight">Repair Analytics</h1>
            <p className="text-sm text-text-muted mt-0.5">Comprehensive insights into repair operations, technician performance, and service trends.</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <OverviewCard title="Total Repairs" value={totalRepairs.toString()} subtitle={`${completedRepairs} completed`} icon={FiTool} color="#8b5cf6" delay={0.05} />
        <OverviewCard title="Avg Turnaround" value={`${avgTurnaround.toFixed(1)}d`} subtitle="Average repair time" icon={FiClock} color="#4f6bff" delay={0.1} />
        <OverviewCard title="Total Revenue" value={`₹${(totalRevenue / 1000).toFixed(0)}k`} subtitle="From all repairs" icon={FiDollarSign} color="#22c55e" delay={0.15} />
        <OverviewCard title="Tech Efficiency" value={`${avgEfficiency}%`} subtitle={`${repairTechnicians.length} technicians`} icon={FiUsers} color="#f59e0b" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-2 relative rounded-3xl bg-bg-card border border-border p-5 lg:p-6"
        >
          <h3 className="text-sm font-bold text-text-primary tracking-tight mb-0.5">Monthly Repairs</h3>
          <p className="text-xs text-text-muted mb-4">Completed vs Received over time</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradient-completed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradient-received" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" strokeOpacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="completed" stroke="#22c55e" fill="url(#gradient-completed)" strokeWidth={2.5} name="Completed" />
                <Area type="monotone" dataKey="received" stroke="#8b5cf6" fill="url(#gradient-received)" strokeWidth={2.5} name="Received" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <DonutChartCard title="Issue Distribution" subtitle="Most common repair categories" data={repairAnalytics.issueDistribution} colors={COLORS} delay={0.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-5">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="lg:col-span-2 relative rounded-3xl bg-bg-card border border-border p-5 lg:p-6"
        >
          <h3 className="text-sm font-bold text-text-primary tracking-tight mb-0.5">Revenue Trend</h3>
          <p className="text-xs text-text-muted mb-4">Monthly revenue from repair services</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" strokeOpacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" fill="url(#revenueGradient)" name="Revenue" radius={[6, 6, 0, 0]} barSize={28}>
                  {monthlyData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl bg-bg-card border border-border p-5 lg:p-6"
        >
          <h3 className="text-sm font-bold text-text-primary tracking-tight mb-0.5">Technician Performance</h3>
          <p className="text-xs text-text-muted mb-4">Completed repairs per technician</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={techData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" strokeOpacity={0.5} horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} width={60} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="completed" name="Completed" radius={[0, 6, 6, 0]} barSize={16}>
                  {techData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
                <Bar dataKey="pending" name="Pending" radius={[0, 6, 6, 0]} barSize={16} fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        <DonutChartCard title="Brand Distribution" subtitle="Devices by manufacturer" data={brandData} colors={COLORS} delay={0.25} />
        <DonutChartCard title="Priority Breakdown" subtitle="Tickets by urgency level" data={priorityDist} colors={['#ef4444', '#f97316', '#f59e0b', '#6b7280']} delay={0.3} />
        <DonutChartCard title="Status Overview" subtitle="Tickets by current status" data={statusDist} colors={COLORS} delay={0.35} />
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="relative rounded-3xl bg-bg-card border border-border p-5 lg:p-6"
        >
          <h3 className="text-sm font-bold text-text-primary tracking-tight mb-0.5">Turnaround Time</h3>
          <p className="text-xs text-text-muted mb-4">Average days per repair</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={turnaroundData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ecf1" strokeOpacity={0.5} />
                <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={[0, 5]} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="days" name="Avg Days" radius={[4, 4, 0, 0]} barSize={14}>
                  {turnaroundData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-3xl bg-bg-card border border-border p-5 lg:p-6"
      >
        <h3 className="text-sm font-bold text-text-primary tracking-tight mb-0.5">Monthly Performance Summary</h3>
        <p className="text-xs text-text-muted mb-4">Detailed breakdown by month</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-primary/20">
                {['Month', 'Received', 'Completed', 'Revenue', 'Completion Rate', 'Avg Revenue/Repair'].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider pb-3 px-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyData.map((row, i) => (
                <motion.tr key={row.month} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="border-b border-border hover:bg-primary/10 transition-colors"
                >
                  <td className="py-3 px-2"><span className="text-sm font-semibold text-text-secondary">{row.month}</span></td>
                  <td className="py-3 px-2"><span className="text-sm text-text-muted">{row.received}</span></td>
                  <td className="py-3 px-2"><span className="text-sm text-text-muted">{row.completed}</span></td>
                  <td className="py-3 px-2"><span className="text-sm font-semibold text-text-secondary">₹{row.revenue.toLocaleString('en-IN')}</span></td>
                  <td className="py-3 px-2">
                    <span className={`text-xs font-semibold ${row.received > 0 ? 'text-success' : 'text-text-muted'}`}>
                      {row.received > 0 ? Math.round(row.completed / row.received * 100) : 0}%
                    </span>
                  </td>
                  <td className="py-3 px-2">
                    <span className="text-sm text-text-muted">
                      ₹{row.completed > 0 ? Math.round(row.revenue / row.completed).toLocaleString('en-IN') : 0}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-3xl bg-bg-card border border-border p-5 lg:p-6"
      >
        <h3 className="text-sm font-bold text-text-primary tracking-tight mb-0.5">Technician Details</h3>
        <p className="text-xs text-text-muted mb-4">Individual performance metrics</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[500px]">
            <thead>
              <tr className="border-b border-primary/20">
                {['Technician', 'Speciality', 'Completed', 'Pending', 'Efficiency', 'Status'].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider pb-3 px-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {repairTechnicians.map((tech, i) => (
                <motion.tr key={tech.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="border-b border-border hover:bg-primary/10 transition-colors"
                >
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold text-white" style={{ background: tech.color }}>
                        {tech.avatar}
                      </div>
                      <span className="text-sm font-medium text-text-secondary">{tech.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-2"><span className="text-xs text-text-muted">{tech.speciality}</span></td>
                  <td className="py-3 px-2"><span className="text-sm font-semibold text-success">{tech.repairs}</span></td>
                  <td className="py-3 px-2"><span className="text-sm text-text-muted">{Math.round(tech.repairs * (1 - tech.efficiency / 100))}</span></td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-bg-card overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${tech.efficiency}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-text-secondary">{tech.efficiency}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-semibold ${tech.online ? 'bg-success/10 text-success' : 'bg-bg text-text-muted'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tech.online ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                      {tech.online ? 'Online' : 'Offline'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </PageLayout>
  )
}
