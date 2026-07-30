import { motion } from 'framer-motion'
import {
  FiShoppingBag, FiTool, FiClock, FiDollarSign,
  FiTrendingUp, FiPackage, FiAlertTriangle, FiStar,
  FiArrowRight,
} from 'react-icons/fi'
import {
  ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts'
import PageLayout from '../components/layout/PageLayout'
import FloatingCard from '../components/ui/FloatingCard'
import StatCounter from '../components/dashboard/StatCounter'
import {
  kpiCards, salesChartData, revenueProfitData, categoryData,
  topSellingProducts, lowStockItems,
  recentActivities, quickActions, customerGrowthData,
} from '../data/dashboardData'

const iconMap: Record<string, React.ReactNode> = {
  FiShoppingBag: <FiShoppingBag size={20} />,
  FiTool: <FiTool size={20} />,
  FiClock: <FiClock size={20} />,
  FiDollarSign: <FiDollarSign size={20} />,
  FiTrendingUp: <FiTrendingUp size={20} />,
  FiPackage: <FiPackage size={20} />,
  FiAlertTriangle: <FiAlertTriangle size={20} />,
  FiStar: <FiStar size={20} />,
}

export default function Dashboard() {
  return (
    <PageLayout title="Dashboard">
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-lg font-semibold text-text-primary">Overview</h2>
          <p className="text-sm text-text-secondary">Your store performance at a glance</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card, i) => (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: i * 0.05 }}
            >
              <FloatingCard padding="lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: card.bgGlow }}>
                    {iconMap[card.icon] || <FiTrendingUp size={20} style={{ color: card.color }} />}
                  </div>
                  <span className={`flex items-center gap-0.5 text-xs font-semibold ${card.trend === 'up' ? 'text-success' : 'text-danger'}`}>
                    <span>{card.trend === 'up' ? '↑' : '↓'}</span>
                    {Math.abs(card.growth)}%
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-text-primary">
                    {card.prefix}<StatCounter value={card.value} />{card.suffix}
                  </p>
                  <p className="text-xs text-text-secondary">{card.title}</p>
                  <p className="text-[10px] text-text-muted">{card.subtitle}</p>
                </div>
              </FloatingCard>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
              <FloatingCard padding="xl">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm font-semibold text-text-primary">Sales Overview</h3>
                      <p className="text-xs text-text-secondary">Weekly sales and revenue</p>
                    </div>
                    <button className="text-xs font-medium text-primary hover:text-primary-hover flex items-center gap-1 cursor-pointer">
                      View Report <FiArrowRight size={12} />
                    </button>
                  </div>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={salesChartData}>
                        <defs>
                          <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#CB202D" stopOpacity={0.12} />
                            <stop offset="100%" stopColor="#CB202D" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0e6e6" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#999999' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#999999' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #f0e6e6', fontSize: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }} />
                        <Area type="monotone" dataKey="sales" stroke="#CB202D" strokeWidth={2} fill="url(#salesGrad)" />
                        <Area type="monotone" dataKey="revenue" stroke="#A81D2A" strokeWidth={2} fill="url(#salesGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </FloatingCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FloatingCard padding="xl">
                  <h3 className="text-sm font-semibold text-text-primary mb-4">Revenue & Profit</h3>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueProfitData.slice(-6)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0e6e6" />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#999999' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#999999' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #f0e6e6', fontSize: 12 }} />
                        <Bar dataKey="revenue" fill="#CB202D" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="profit" fill="#A81D2A" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </FloatingCard>

              <FloatingCard padding="xl">
                  <h3 className="text-sm font-semibold text-text-primary mb-4">Categories</h3>
                <div className="h-52 flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                        {categoryData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3 mt-2 justify-center">
                  {categoryData.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-[11px] text-text-secondary">{item.name}</span>
                    </div>
                  ))}
                </div>
              </FloatingCard>
            </div>

            <FloatingCard padding="xl">
                  <h3 className="text-sm font-semibold text-text-primary mb-4">Customer Growth</h3>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={customerGrowthData}>
                        <defs>
                          <linearGradient id="newGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#CB202D" stopOpacity={0.1} />
                            <stop offset="100%" stopColor="#CB202D" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0e6e6" />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#999999' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#999999' }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #f0e6e6', fontSize: 12 }} />
                        <Area type="monotone" dataKey="new" stroke="#CB202D" strokeWidth={2} fill="url(#newGrad)" />
                        <Area type="monotone" dataKey="returning" stroke="#A81D2A" strokeWidth={2} fill="url(#newGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </FloatingCard>
          </div>

          <div className="space-y-6">
            <FloatingCard padding="lg">
                  <h3 className="text-sm font-semibold text-text-primary mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {quickActions.map((action) => (
                      <button
                        key={action.id}
                        className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border border-border hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                      >
                        <span className="text-lg">{action.icon}</span>
                        <span className="text-[11px] font-medium text-text-secondary">{action.label}</span>
                      </button>
                    ))}
                  </div>
                </FloatingCard>

            <FloatingCard padding="lg">
                  <h3 className="text-sm font-semibold text-text-primary mb-3">Top Products</h3>
                  <div className="space-y-3">
                    {topSellingProducts.slice(0, 4).map((product) => (
                      <div key={product.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg shrink-0">{product.image}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-text-primary truncate">{product.name}</p>
                            <p className="text-[10px] text-text-muted">{product.brand} · {product.sold} sold</p>
                          </div>
                        </div>
                        <span className={`text-xs font-semibold ${product.trend === 'up' ? 'text-success' : 'text-danger'}`}>
                          {product.growth}
                        </span>
                      </div>
                    ))}
                  </div>
                </FloatingCard>

            <FloatingCard padding="lg">
                  <h3 className="text-sm font-semibold text-text-primary mb-3">Low Stock</h3>
                  <div className="space-y-3">
                    {lowStockItems.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-lg shrink-0">{item.image}</span>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-text-primary truncate">{item.name}</p>
                            <p className="text-[10px] text-text-muted">{item.sku}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`text-xs font-bold ${item.critical ? 'text-danger' : 'text-success'}`}>{item.stock}</p>
                          <p className="text-[10px] text-text-muted">{item.threshold}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </FloatingCard>

            <FloatingCard padding="lg">
                  <h3 className="text-sm font-semibold text-text-primary mb-3">Activity</h3>
                  <div className="space-y-2.5">
                    {recentActivities.slice(0, 4).map((activity) => (
                      <div key={activity.id} className="flex items-start gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs text-text-secondary leading-relaxed">{activity.text}</p>
                          <p className="text-[10px] text-text-muted mt-0.5">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </FloatingCard>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
