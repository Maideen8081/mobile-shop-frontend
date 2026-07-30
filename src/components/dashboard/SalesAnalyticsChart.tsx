import { useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import GlassCard from './GlassCard'
import { salesChartData } from '../../data/dashboardData'

export default function SalesAnalyticsChart() {
  const [range, setRange] = useState<'weekly' | 'monthly' | 'yearly'>('weekly')

  return (
    <GlassCard padding={false} className="p-5 lg:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-text-primary tracking-tight">Sales Analytics</h3>
          <p className="text-xs text-text-muted mt-0.5">Daily revenue & sales performance</p>
        </div>
        <div className="flex gap-1 bg-surface-lighter rounded-lg p-1">
          {(['weekly', 'monthly', 'yearly'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all cursor-pointer ${
                range === r ? 'bg-bg-card text-text-primary shadow-sm border border-border' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <div className="h-64 lg:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={salesChartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <defs>
              <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#CB202D" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#CB202D" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#A81D2A" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#A81D2A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#172033', color: '#f8fafc', fontSize: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
              formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, '']}
              labelStyle={{ fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}
            />
            <Area type="monotone" dataKey="sales" stroke="#CB202D" strokeWidth={2} fill="url(#salesGradient)" dot={false} activeDot={{ r: 5, fill: '#CB202D', stroke: '#ffffff', strokeWidth: 2 }} />
            <Area type="monotone" dataKey="revenue" stroke="#A81D2A" strokeWidth={2} fill="url(#revGradient)" dot={false} activeDot={{ r: 5, fill: '#A81D2A', stroke: '#ffffff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  )
}
