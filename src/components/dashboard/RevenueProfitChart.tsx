import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import GlassCard from './GlassCard'
import { revenueProfitData } from '../../data/dashboardData'

export default function RevenueProfitChart() {
  return (
    <GlassCard padding={false} className="p-5 lg:p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-text-primary tracking-tight">Revenue vs Profit</h3>
        <p className="text-xs text-text-muted mt-0.5">Monthly financial performance trends</p>
      </div>
      <div className="h-64 lg:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={revenueProfitData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#172033', color: '#f8fafc', fontSize: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
              formatter={(v) => [`₹${Number(v).toLocaleString('en-IN')}`, '']}
              labelStyle={{ fontWeight: 600, color: '#f8fafc', marginBottom: 4 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, fontWeight: 500, paddingTop: 12 }}
              formatter={(value) => <span className="text-text-muted capitalize">{value}</span>}
            />
            <Line type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3, fill: '#7c3aed', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#7c3aed', stroke: '#111827', strokeWidth: 2 }} />
            <Line type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#22c55e', stroke: '#111827', strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  )
}
