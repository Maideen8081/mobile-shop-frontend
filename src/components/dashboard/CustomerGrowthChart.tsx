import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import GlassCard from './GlassCard'
import { customerGrowthData } from '../../data/dashboardData'

export default function CustomerGrowthChart() {
  return (
    <GlassCard padding={false} className="p-5 lg:p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-text-primary tracking-tight">Customer Growth</h3>
        <p className="text-xs text-text-muted mt-0.5">New vs returning customers</p>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={customerGrowthData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#172033', color: '#f8fafc', fontSize: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
            />
            <Legend
              wrapperStyle={{ fontSize: 11, fontWeight: 500, paddingTop: 8 }}
              formatter={(value) => <span className="text-text-muted capitalize">{value}</span>}
            />
            <Bar dataKey="new" fill="#7c3aed" radius={[6, 6, 0, 0]} barSize={12} />
            <Bar dataKey="returning" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={12} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  )
}
