import { motion } from 'framer-motion'
import { FiStar, FiTrendingUp, FiTrendingDown } from 'react-icons/fi'
import GlassCard from './GlassCard'
import { topSellingProducts } from '../../data/dashboardData'

export default function TopSellingProducts() {
  return (
    <GlassCard padding={false} className="p-5 lg:p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-text-primary tracking-tight">Top Selling Products</h3>
          <p className="text-xs text-text-muted mt-0.5">Best performers this month</p>
        </div>
        <button className="text-xs font-medium text-primary hover:text-primary-hover transition-colors cursor-pointer">View All →</button>
      </div>

      <div className="space-y-3">
        {topSellingProducts.map((product, i) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: i * 0.06, ease: 'easeOut' }}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/[0.03] transition-colors group"
          >
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg">
              {product.image}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-text-primary truncate">{product.name}</p>
                <span className="flex items-center gap-0.5 text-[10px] text-warning font-semibold">
                  <FiStar size={10} />{product.rating}
                </span>
              </div>
              <p className="text-xs text-text-muted">{product.brand} • {product.sold} units sold</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-text-primary">₹{(product.revenue / 100000).toFixed(1)}L</p>
              <div className="flex items-center gap-1 justify-end">
                <span className={`text-[10px] font-semibold ${product.trend === 'up' ? 'text-success' : 'text-danger'}`}>
                  {product.growth}
                </span>
                {product.trend === 'up' ? <FiTrendingUp size={10} className="text-success" /> : <FiTrendingDown size={10} className="text-danger" />}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  )
}
