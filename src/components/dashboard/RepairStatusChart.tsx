import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import GlassCard from './GlassCard'
import { repairStatusData } from '../../data/dashboardData'

export default function RepairStatusChart() {
  const total = repairStatusData.reduce((sum, d) => sum + d.value, 0)

  return (
    <GlassCard padding={false} className="p-5 lg:p-6 h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-text-primary tracking-tight">Repair Status</h3>
        <p className="text-xs text-text-muted mt-0.5">{total} total repair requests</p>
      </div>
      <div className="flex flex-col items-center">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={repairStatusData}
                cx="50%" cy="50%"
                innerRadius={48}
                outerRadius={68}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {repairStatusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#172033', color: '#f8fafc', fontSize: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                formatter={(v) => [Number(v), 'Requests']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3">
          {repairStatusData.map((item) => (
            <div key={item.name} className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-text-muted whitespace-nowrap">{item.name}</span>
              <span className="text-xs font-bold text-text-primary">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}
