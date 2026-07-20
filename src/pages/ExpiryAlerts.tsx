import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiShield, FiClock, FiAlertTriangle, FiCheck, FiSend } from 'react-icons/fi'
import PageLayout from '../components/layout/PageLayout'
import ExpiryAlertCard from '../components/warranty/ExpiryAlertCard'
import { expiryAlerts } from '../data/warrantyData'

export default function ExpiryAlerts() {
  const [alerts, setAlerts] = useState(expiryAlerts)
  const [dateFilter, setDateFilter] = useState('all')

  const critical = alerts.filter((a) => a.remainingDays <= 7).length
  const reminded = alerts.filter((a) => a.reminded).length

  const filteredAlerts = alerts.filter((a) => {
    if (dateFilter === 'critical') return a.remainingDays <= 7
    if (dateFilter === 'warning') return a.remainingDays > 7 && a.remainingDays <= 30
    if (dateFilter === 'safe') return a.remainingDays > 30
    return true
  })

  const handleSendReminder = (id: number) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, reminded: true } : a)))
  }

  const handleExtendWarranty = (id: number) => {
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, extendOffer: false } : a)))
  }

  return (
    <PageLayout title="Expiry Alerts">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                  <FiShield size={12} />
                  <span className="hover:text-text-secondary transition-colors cursor-pointer">Warranty</span>
                  <span>/</span>
                  <span className="text-text-secondary font-medium">Expiry Alerts</span>
                </div>
                <h1 className="text-xl lg:text-2xl font-bold text-text-primary tracking-tight">Expiry Alerts</h1>
                <p className="text-sm text-text-muted mt-0.5">Monitor and manage warranties nearing expiration.</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <div className="relative rounded-xl bg-bg-card border border-border p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center">
                  <FiAlertTriangle size={20} className="text-danger" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{critical}</p>
                  <p className="text-xs text-text-muted">Critical (&le;7 days)</p>
                </div>
              </div>
            </div>
            <div className="relative rounded-xl bg-bg-card border border-border p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                  <FiClock size={20} className="text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{alerts.length}</p>
                  <p className="text-xs text-text-muted">Total Alerts</p>
                </div>
              </div>
            </div>
            <div className="relative rounded-xl bg-bg-card border border-border p-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                  <FiSend size={20} className="text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">{reminded}</p>
                  <p className="text-xs text-text-muted">Reminders Sent</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="flex flex-wrap items-center gap-2"
          >
            {[
              { key: 'all', label: 'All Alerts' },
              { key: 'critical', label: 'Critical' },
              { key: 'warning', label: 'Warning' },
              { key: 'safe', label: 'Safe' },
            ].map((f) => (
              <motion.button
                key={f.key}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setDateFilter(f.key)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  dateFilter === f.key
                    ? 'bg-primary text-white'
                    : 'bg-bg-card border border-border text-text-muted hover:text-text-secondary'
                }`}
              >
                {f.label}
              </motion.button>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredAlerts.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <ExpiryAlertCard
                  alert={alert}
                  onSendReminder={handleSendReminder}
                  onExtendWarranty={handleExtendWarranty}
                />
              </motion.div>
            ))}
          </motion.div>

          {filteredAlerts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted">
              <FiCheck size={48} className="mb-4 opacity-30" />
              <p className="text-sm font-medium">No alerts for this filter</p>
            </div>
          )}
    </PageLayout>
  )
}
