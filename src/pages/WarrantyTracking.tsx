import { useState } from 'react'
import { motion } from 'framer-motion'
import { FiSearch, FiShield, FiHash, FiFileText, FiSmartphone } from 'react-icons/fi'
import PageLayout from '../components/layout/PageLayout'
import WarrantyCard from '../components/warranty/WarrantyCard'
import { warrantyRecords } from '../data/warrantyData'
import type { WarrantyRecord } from '../data/warrantyData'

const searchModes = [
  { key: 'imei', label: 'IMEI', icon: FiHash },
  { key: 'invoice', label: 'Invoice', icon: FiFileText },
  { key: 'mobile', label: 'Mobile', icon: FiSmartphone },
  { key: 'serial', label: 'Serial No.', icon: FiHash },
] as const

type SearchMode = (typeof searchModes)[number]['key']

export default function WarrantyTracking() {
  const [searchMode, setSearchMode] = useState<SearchMode>('imei')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<WarrantyRecord[]>(warrantyRecords)

  const handleSearch = (value: string) => {
    setQuery(value)
    if (!value.trim()) {
      setResults(warrantyRecords)
      return
    }
    const q = value.toLowerCase()
    const filtered = warrantyRecords.filter((r) => {
      switch (searchMode) {
        case 'imei': return r.imei.toLowerCase().includes(q)
        case 'invoice': return r.invoiceNumber.toLowerCase().includes(q)
        case 'mobile': return r.customerMobile.includes(q)
        case 'serial': return r.serialNumber.toLowerCase().includes(q)
        default: return true
      }
    })
    setResults(filtered)
  }

  return (
    <PageLayout title="Warranty Tracking">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
                  <FiShield size={12} />
                  <span className="hover:text-text-secondary transition-colors cursor-pointer">Warranty</span>
                  <span>/</span>
                  <span className="text-text-secondary font-medium">Tracking</span>
                </div>
                <h1 className="text-xl lg:text-2xl font-bold text-text-primary tracking-tight">Warranty Tracking</h1>
                <p className="text-sm text-text-muted mt-0.5">Search warranties by IMEI, invoice, mobile, or serial number.</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="relative rounded-xl bg-bg-card border border-border p-5 lg:p-6"
          >
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {searchModes.map((mode) => {
                const Icon = mode.icon
                const isActive = searchMode === mode.key
                return (
                  <motion.button
                    key={mode.key}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setSearchMode(mode.key); setQuery(''); setResults(warrantyRecords) }}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'bg-bg text-text-muted hover:bg-surface-hover border border-border'
                    }`}
                  >
                    <Icon size={14} />
                    {mode.label}
                  </motion.button>
                )
              })}
            </div>

            <div className="relative">
              <FiSearch size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={`Search by ${searchModes.find((m) => m.key === searchMode)?.label}...`}
                className="w-full h-12 pl-12 pr-4 rounded-xl bg-bg border border-border text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200 focus:border-primary/50 focus:bg-bg-card focus:shadow-[0_0_0_4px_rgba(124,58,237,0.15)]"
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-text-muted">
                {results.length === warrantyRecords.length
                  ? `Showing all ${warrantyRecords.length} warranties`
                  : `Found ${results.length} result${results.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((warranty, i) => (
                <motion.div
                  key={warranty.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <WarrantyCard warranty={warranty} />
                </motion.div>
              ))}
            </div>
            {results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-text-muted">
                <FiSearch size={48} className="mb-4 opacity-30" />
                <p className="text-sm font-medium">No warranties found</p>
                <p className="text-xs mt-1">Try a different search term or mode</p>
              </div>
            )}
          </motion.div>
    </PageLayout>
  )
}
