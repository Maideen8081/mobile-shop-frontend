import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FiShield, FiChevronDown, FiChevronUp, FiUser, FiSmartphone, FiCalendar, FiMessageSquare } from 'react-icons/fi'
import PageLayout from '../components/layout/PageLayout'
import ClaimTracker from '../components/warranty/ClaimTracker'
import { warrantyClaims } from '../data/warrantyData'

const statusFilters = ['All', 'Submitted', 'Under Verification', 'Brand Review', 'Approved', 'Rejected', 'Replacement Initiated', 'Completed'] as const

const priorityColors: Record<string, string> = {
  Critical: 'bg-danger/10 text-danger',
  High: 'bg-warning/10 text-warning',
  Medium: 'bg-info/10 text-info',
  Low: 'bg-bg text-text-muted',
}

const statusColors: Record<string, string> = {
  Submitted: 'bg-primary/10 text-primary',
  'Under Verification': 'bg-info/10 text-info',
  'Brand Review': 'bg-warning/10 text-warning',
  Approved: 'bg-success/10 text-success',
  Rejected: 'bg-danger/10 text-danger',
  'Replacement Initiated': 'bg-info/10 text-info',
  Completed: 'bg-success/10 text-success',
}

export default function WarrantyClaims() {
  const [activeFilter, setActiveFilter] = useState<string>('All')
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const filtered = activeFilter === 'All'
    ? warrantyClaims
    : warrantyClaims.filter((c) => c.status === activeFilter)

  return (
    <PageLayout title="Warranty Claims">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                  <FiShield size={12} />
                  <span className="hover:text-text-secondary transition-colors cursor-pointer">Warranty</span>
                  <span>/</span>
                  <span className="text-text-secondary font-medium">Claims</span>
                </div>
                <h1 className="text-xl lg:text-2xl font-bold text-text-primary tracking-tight">Warranty Claims</h1>
                <p className="text-sm text-text-muted mt-0.5">Manage and track all warranty claims from submission to completion.</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="flex flex-wrap items-center gap-2"
          >
            {statusFilters.map((filter) => (
              <motion.button
                key={filter}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  activeFilter === filter
                    ? 'bg-primary text-white'
                    : 'bg-bg-card border border-border text-text-muted hover:text-text-secondary'
                }`}
              >
                {filter}{filter === 'All' ? ` (${warrantyClaims.length})` : ''}
              </motion.button>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="space-y-3">
            <AnimatePresence>
              {filtered.map((claim) => {
                const isExpanded = expandedId === claim.id
                return (
                  <motion.div
                    key={claim.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="relative rounded-xl bg-bg-card border border-border overflow-hidden"
                  >
                    <div
                      onClick={() => setExpandedId(isExpanded ? null : claim.id)}
                      className="p-5 cursor-pointer"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-text-primary">{claim.claimId}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColors[claim.status] || 'bg-bg text-text-muted'}`}>
                              {claim.status}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${priorityColors[claim.priority] || ''}`}>
                              {claim.priority}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-text-primary">{claim.issue}</h3>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5">
                            <span className="flex items-center gap-1 text-[11px] text-text-muted">
                              <FiUser size={11} /> {claim.customerName}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-text-muted">
                              <FiSmartphone size={11} /> {claim.productName}
                            </span>
                            <span className="flex items-center gap-1 text-[11px] text-text-muted">
                              <FiCalendar size={11} /> {claim.submittedDate}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="hidden lg:block flex-1 min-w-[200px]">
                            <ClaimTracker currentStatus={claim.status} />
                          </div>
                          <span className="text-text-muted">
                            {isExpanded ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
                          </span>
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 pt-4 border-t border-border">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                <div>
                                  <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-1">Description</p>
                                  <p className="text-xs text-text-secondary">{claim.description}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-1">Assigned To</p>
                                  <p className="text-xs font-medium text-text-secondary">{claim.assignedTo}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-1">Resolution</p>
                                  <p className="text-xs font-medium text-text-secondary">{claim.resolution || 'Pending'}</p>
                                </div>
                              </div>

                              <div className="mb-4">
                                <p className="text-xs font-semibold text-text-secondary mb-2 lg:hidden">Claim Progress</p>
                                <div className="lg:hidden">
                                  <ClaimTracker currentStatus={claim.status} />
                                </div>
                              </div>

                              {claim.notes.length > 0 && (
                                <div>
                                  <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
                                    <FiMessageSquare size={10} /> Notes ({claim.notes.length})
                                  </p>
                                  <div className="space-y-2">
                                    {claim.notes.map((note, i) => (
                                      <div key={i} className="p-3 rounded-xl bg-surface-lighter border border-border">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-[11px] font-semibold text-text-secondary">{note.by}</span>
                                          <span className="text-[10px] text-text-muted">{note.time}</span>
                                        </div>
                                        <p className="text-[11px] text-text-muted">{note.text}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
    </PageLayout>
  )
}
