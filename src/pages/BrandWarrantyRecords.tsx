import { motion } from 'framer-motion'
import { FiShield, FiClock, FiAward, FiUsers, FiActivity } from 'react-icons/fi'
import PageLayout from '../components/layout/PageLayout'
import { brandWarranties } from '../data/warrantyData'

export default function BrandWarrantyRecords() {
  return (
    <PageLayout title="Brand Warranty Records">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                  <FiShield size={12} />
                  <span className="hover:text-text-secondary transition-colors cursor-pointer">Warranty</span>
                  <span>/</span>
                  <span className="text-text-secondary font-medium">Brand Records</span>
                </div>
                <h1 className="text-xl lg:text-2xl font-bold text-text-primary tracking-tight">Brand Warranty Records</h1>
                <p className="text-sm text-text-muted mt-0.5">View warranty policies, coverage details, and performance for each brand.</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4"
          >
            {brandWarranties.map((brand, i) => (
              <motion.div
                key={brand.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6, boxShadow: '0 32px 80px rgba(0,0,0,0.08)' }}
                className="relative rounded-xl bg-bg-card border border-border p-5 overflow-hidden group"
              >
                <div
                  className="absolute -top-16 -right-16 w-40 h-40 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"
                  style={{ background: `${brand.color}15` }}
                />

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shadow-lg"
                      style={{ background: `${brand.color}10` }}
                    >
                      {brand.logo}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">{brand.brand}</h3>
                      <p className="text-[10px] text-text-muted font-medium">{brand.policyName}</p>
                    </div>
                  </div>

                  <div className="mb-4 p-3 rounded-xl bg-surface-lighter border border-border">
                    <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-1">Coverage</p>
                    <p className="text-[11px] text-text-secondary leading-relaxed">{brand.coverageDetails}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
                      <div className="flex items-center gap-1.5 mb-1">
                        <FiAward size={11} className="text-primary" />
                        <span className="text-[10px] text-text-muted">Success Rate</span>
                      </div>
                      <p className="text-lg font-bold text-primary">{brand.claimSuccessRate}%</p>
                    </div>
                    <div className="p-3 rounded-xl bg-info/10 border border-info/20">
                      <div className="flex items-center gap-1.5 mb-1">
                        <FiClock size={11} className="text-info" />
                        <span className="text-[10px] text-text-muted">Avg SLA</span>
                      </div>
                      <p className="text-lg font-bold text-info">{brand.averageSla} days</p>
                    </div>
                    <div className="p-3 rounded-xl bg-success/10 border border-success/20">
                      <div className="flex items-center gap-1.5 mb-1">
                        <FiUsers size={11} className="text-success" />
                        <span className="text-[10px] text-text-muted">Active</span>
                      </div>
                      <p className="text-lg font-bold text-success">{brand.activeWarranties}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-warning/10 border border-warning/20">
                      <div className="flex items-center gap-1.5 mb-1">
                        <FiActivity size={11} className="text-warning" />
                        <span className="text-[10px] text-text-muted">Claims</span>
                      </div>
                      <p className="text-lg font-bold text-warning">{brand.totalClaims}</p>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-[10px] text-text-muted">
                      <span>Default Duration</span>
                      <span className="font-semibold text-text-secondary">{brand.defaultDuration} days</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
    </PageLayout>
  )
}
