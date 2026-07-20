import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import GlassCard from './GlassCard'
import { technicians } from '../../data/dashboardData'

export default function TechnicianBarChart() {
  const data = technicians.map((t) => ({ name: t.name.split(' ')[0], efficiency: t.efficiency, repairs: t.repairs }))

  return (
    <GlassCard padding={false} className="p-5 lg:p-6">
      <div className="mb-5">
        <h3 className="text-sm font-semibold text-text-primary">Technician Performance</h3>
        <p className="text-xs text-text-muted mt-0.5">Efficiency & repairs completed</p>
      </div>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 500 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#172033', color: '#f8fafc', fontSize: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
            />
            <Bar dataKey="efficiency" fill="#7c3aed" radius={[6, 6, 0, 0]} barSize={28} />
            <Bar dataKey="repairs" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  )
}
