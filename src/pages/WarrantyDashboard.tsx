import { motion } from 'framer-motion'
import { FiShield, FiAlertTriangle, FiClock, FiArrowRight } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../components/layout/PageLayout'
import WarrantyCard from '../components/warranty/WarrantyCard'

interface KPI { id: number; title: string; value: number; prefix?: string; suffix?: string; growth: number; trend: 'up' | 'down'; subtitle: string; color: string; bgGlow: string; icon: string; sparkline: number[] }

function StatCard({ title, value, prefix, suffix, growth, trend, subtitle, color, bgGlow, sparkline }: KPI & { delay?: number }) {
  return (
    <motion.div variants={fadeInUp}>
      <div className="relative rounded-3xl bg-bg-card border border-border shadow-lg shadow-black/[0.03] p-4 lg:p-5 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03]" style={{ background: `radial-gradient(120px at 80% 20%, ${color}, transparent)` }} />
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">{title}</span>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{ background: bgGlow, color }} />
        </div>
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-xl lg:text-2xl font-bold text-text-primary tracking-tight">{prefix || ''}{value.toLocaleString('en-IN')}{suffix || ''}</span>
          <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${trend === 'up' ? 'text-success' : 'text-danger'}`}>
            <span>{trend === 'up' ? '↑' : '↓'}</span> {Math.abs(growth)}%
          </span>
        </div>
        <p className="text-[10px] text-text-muted mb-3">{subtitle}</p>
        <svg className="w-full h-8" viewBox={`0 0 ${sparkline.length - 1} 100`} preserveAspectRatio="none">
          <polyline fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            points={sparkline.map((v, i) => `${i},${100 - (v / Math.max(...sparkline)) * 90}`).join(' ')} />
        </svg>
      </div>
    </motion.div>
  )
}
import ClaimTracker from '../components/warranty/ClaimTracker'
import WarrantyTimeline from '../components/warranty/WarrantyTimeline'
import { warrantyKPIs, warrantyRecords, warrantyClaims } from '../data/warrantyData'

const stagger = {
  animate: { transition: { staggerChildren: 0.04 } },
}

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
}

export default function WarrantyDashboard() {
  const navigate = useNavigate()

  const expiringSoon = warrantyRecords.filter((r) => r.status === 'Expiring Soon').slice(0, 3)
  const recentClaims = warrantyClaims.slice(0, 3)
  const timelineEvents = [
    { date: '2026-05-08', event: 'New Claim Submitted', description: 'Arun Kumar - iPhone 15 Pro Max display issue', type: 'claim' as const },
    { date: '2026-05-06', event: 'Claim Verified', description: 'Meera Joshi - Galaxy S24 Ultra battery swelling confirmed', type: 'created' as const },
    { date: '2026-05-02', event: 'Warranty Renewed', description: 'Karan Patel extended warranty for OnePlus 12', type: 'renewed' as const },
    { date: '2026-04-28', event: 'Warranty Expired', description: 'iPhone 14 warranty expired for Neha Gupta', type: 'expired' as const },
  ]

  return (
    <PageLayout title="Warranty Dashboard">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                  <FiShield size={12} />
                  <span className="hover:text-text-secondary transition-colors cursor-pointer">Warranty</span>
                  <span>/</span>
                  <span className="text-text-secondary font-medium">Dashboard</span>
                </div>
                <h1 className="text-xl lg:text-2xl font-bold text-text-primary tracking-tight">Warranty Management</h1>
                <p className="text-sm text-text-muted mt-0.5">Track product warranties, claims, expiry alerts, and brand warranty records.</p>
              </div>
            </div>
          </motion.div>

          <motion.div variants={stagger} initial="initial" animate="animate" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {warrantyKPIs.map((card, i) => (
              <StatCard key={card.id} {...card} delay={i * 0.05} />
            ))}
          </motion.div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 lg:gap-6">
            <div className="xl:col-span-3 space-y-4 lg:space-y-6">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                className="relative rounded-xl bg-bg-card border border-border p-5 lg:p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary tracking-tight flex items-center gap-2">
                      <FiAlertTriangle size={14} className="text-warning" />
                      Expiring Warranties
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">Warranties expiring within 30 days</p>
                  </div>
                  <button onClick={() => navigate('/expiry-alerts')} className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary cursor-pointer">
                    View All <FiArrowRight size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {expiringSoon.map((w) => (
                    <WarrantyCard key={w.id} warranty={w} />
                  ))}
                  {expiringSoon.length === 0 && (
                    <p className="text-sm text-text-muted col-span-2 text-center py-8">No warranties expiring soon</p>
                  )}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="relative rounded-xl bg-bg-card border border-border p-5 lg:p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary tracking-tight flex items-center gap-2">
                      <FiClock size={14} className="text-primary" />
                      Recent Claims
                    </h3>
                    <p className="text-xs text-text-muted mt-0.5">Latest warranty claim activities</p>
                  </div>
                  <button onClick={() => navigate('/warranty-claims')} className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary cursor-pointer">
                    View All <FiArrowRight size={12} />
                  </button>
                </div>
                <div className="space-y-3">
                  {recentClaims.map((claim) => (
                    <div key={claim.id} className="p-4 rounded-xl bg-surface-lighter border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-text-primary">{claim.claimId}</span>
                          <span className="text-[10px] text-text-muted">· {claim.productName}</span>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${claim.priority === 'Critical' ? 'bg-danger/10 text-danger' : claim.priority === 'High' ? 'bg-warning/10 text-warning' : claim.priority === 'Medium' ? 'bg-info/10 text-info' : 'bg-bg text-text-muted'}`}>
                          {claim.priority}
                        </span>
                      </div>
                      <p className="text-xs text-text-secondary mb-2">{claim.issue}</p>
                      <ClaimTracker currentStatus={claim.status} />
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            <div className="xl:col-span-2 space-y-4 lg:space-y-6">
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="relative rounded-xl bg-bg-card border border-border p-5 lg:p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary tracking-tight">Quick Stats</h3>
                    <p className="text-xs text-text-muted mt-0.5">Warranty overview</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-primary/10">
                    <span className="text-xs text-text-secondary">Active Warranties</span>
                    <span className="text-sm font-bold text-primary">1,842</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-warning/10">
                    <span className="text-xs text-text-secondary">Expiring in 30d</span>
                    <span className="text-sm font-bold text-warning">48</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-success/10">
                    <span className="text-xs text-text-secondary">Claims This Month</span>
                    <span className="text-sm font-bold text-success">24</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-info/10">
                    <span className="text-xs text-text-secondary">Approval Rate</span>
                    <span className="text-sm font-bold text-info">82.5%</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-info/10">
                    <span className="text-xs text-text-secondary">Revenue Protected</span>
                    <span className="text-sm font-bold text-info">₹2.85Cr</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-surface-lighter">
                    <span className="text-xs text-text-secondary">Avg. Claim SLA</span>
                    <span className="text-sm font-bold text-text-secondary">6.5 days</span>
                  </div>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="relative rounded-xl bg-bg-card border border-border p-5 lg:p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary tracking-tight">Recent Activity</h3>
                    <p className="text-xs text-text-muted mt-0.5">Warranty timeline</p>
                  </div>
                </div>
                <WarrantyTimeline events={timelineEvents} />
              </motion.div>
            </div>
          </div>
    </PageLayout>
  )
}
