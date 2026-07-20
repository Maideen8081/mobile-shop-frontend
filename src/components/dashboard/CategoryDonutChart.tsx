import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import GlassCard from './GlassCard'
import { categoryData } from '../../data/dashboardData'

export default function CategoryDonutChart() {
  return (
    <GlassCard padding={false} className="p-5 lg:p-6 h-full">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-text-primary tracking-tight">Product Categories</h3>
        <p className="text-xs text-text-muted mt-0.5">Sales breakdown by category</p>
      </div>
      <div className="flex flex-col items-center">
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%" cy="50%"
                innerRadius={50}
                outerRadius={72}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {categoryData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', backgroundColor: '#172033', color: '#f8fafc', fontSize: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
                formatter={(v) => [`${v}%`, 'Share']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap justify-center gap-4 mt-3">
          {categoryData.map((item) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-xs text-text-muted font-medium">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  )
}
