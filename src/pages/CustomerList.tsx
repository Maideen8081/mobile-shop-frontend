import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FiSearch, FiEye, FiEdit2, FiMessageCircle, FiStar, FiShoppingBag, FiDownload, FiChevronLeft, FiChevronRight, FiUserCheck } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../components/layout/PageLayout'
import CustomerCard from '../components/crm/CustomerCard'
import { customers } from '../data/crmData'

const ITEMS_PER_PAGE = 6

const tierColors: Record<string, string> = {
  Platinum: 'text-primary bg-primary/10',
  Gold: 'text-primary bg-primary/10',
  Silver: 'text-text-secondary bg-gray-100',
  Bronze: 'text-orange-700 bg-orange-100',
}

export default function CustomerList() {
  const [search, setSearch] = useState('')
  const [filterTier, setFilterTier] = useState('all')
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table')
  const [page, setPage] = useState(1)
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    let result = customers.filter((c) => {
      const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.mobile.includes(search) || c.email.toLowerCase().includes(search.toLowerCase())
      const matchTier = filterTier === 'all' || c.loyaltyTier === filterTier
      return matchSearch && matchTier
    })
    return result
  }, [search, filterTier])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  return (
    <PageLayout title="Customers">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs text-text-muted mb-1">
              <span>CRM</span><span>/</span><span className="text-text-secondary font-medium">Customers</span>
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-text-primary">Customers</h1>
            <p className="text-sm text-text-muted mt-0.5">{customers.length} total customers</p>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full">
          <FiSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="text" placeholder="Search by name, mobile, or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full h-11 pl-10 pr-4 rounded-2xl bg-bg-card border border-border text-sm outline-none focus:border-primary/50 focus:shadow-[0_0_0_4px_rgba(124,58,237,0.08)]"
          />
        </div>
        <select value={filterTier} onChange={(e) => { setFilterTier(e.target.value); setPage(1) }}
          className="h-11 px-4 rounded-2xl bg-bg-card border border-border text-sm outline-none appearance-none cursor-pointer focus:border-primary/50"
        >
          <option value="all">All Tiers</option>
          <option value="Platinum">Platinum</option>
          <option value="Gold">Gold</option>
          <option value="Silver">Silver</option>
          <option value="Bronze">Bronze</option>
        </select>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-card border border-border shadow-sm">
          {(['table', 'cards'] as const).map((mode) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl capitalize transition-all cursor-pointer ${viewMode === mode ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:text-text-secondary'}`}
            >{mode}</button>
          ))}
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-bg-card border border-border text-xs font-semibold text-text-secondary hover:bg-primary/10 transition-all cursor-pointer">
          <FiDownload size={13} /> Export
        </button>
      </div>

      {paged.length === 0 ? (
        <div className="text-center py-16">
          <FiUserCheck size={48} className="mx-auto text-text-muted mb-3" />
          <p className="text-sm text-text-muted">No customers found</p>
        </div>
      ) : viewMode === 'table' ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="overflow-x-auto rounded-xl bg-bg-card border border-border shadow-lg">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-primary/6">
                {['Customer', 'Mobile', 'Purchases', 'Repairs', 'Loyalty Pts', 'Tier', 'Last Visit', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-[10px] font-semibold text-text-muted uppercase tracking-wider px-4 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((c, i) => (
                <motion.tr key={c.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-primary/20 hover:bg-primary/5 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/customer-profile?id=${c.id}`)}
                >
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-xs font-bold text-white shadow-sm">{c.avatar}</div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{c.name}</p>
                        <p className="text-[10px] text-text-muted">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><span className="text-xs text-text-muted">{c.mobile}</span></td>
                  <td className="px-4 py-3.5"><span className="text-sm font-semibold text-text-secondary">{c.totalPurchases}</span></td>
                  <td className="px-4 py-3.5"><span className="text-sm text-text-secondary">{c.repairCount}</span></td>
                  <td className="px-4 py-3.5"><span className="text-sm font-semibold text-primary">{c.loyaltyPoints.toLocaleString()}</span></td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-semibold ${tierColors[c.loyaltyTier] || tierColors.Bronze}`}>
                      {c.loyaltyTier}
                    </span>
                  </td>
                  <td className="px-4 py-3.5"><span className="text-xs text-text-muted">{c.lastVisit}</span></td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-semibold ${c.status === 'active' ? 'bg-primary/10 text-primary' : c.status === 'inactive' ? 'bg-gray-100 text-text-muted' : 'bg-red-100 text-red-700'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'active' ? 'bg-success/100' : c.status === 'inactive' ? 'bg-gray-400' : 'bg-danger/100'}`} />
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {[
                        { icon: FiEye, label: 'View', color: 'text-info bg-info/10' },
                        { icon: FiEdit2, label: 'Edit', color: 'text-primary bg-primary/10' },
                        { icon: FiMessageCircle, label: 'WhatsApp', color: 'text-success bg-success/10' },
                        { icon: FiStar, label: 'Loyalty', color: 'text-warning bg-warning/10' },
                        { icon: FiShoppingBag, label: 'Purchases', color: 'text-info bg-info/10' },
                      ].map((btn) => (
                        <button key={btn.label} onClick={(e) => { e.stopPropagation(); if (btn.label === 'View') navigate(`/customer-profile?id=${c.id}`) }}
                          className={`w-7 h-7 rounded-lg ${btn.color} flex items-center justify-center cursor-pointer`} title={btn.label}>
                          <btn.icon size={12} />
                        </button>
                      ))}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          <div className="flex items-center justify-between px-4 py-3 border-t border-primary/6">
            <p className="text-xs text-text-muted">Showing {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}</p>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(page - 1)}
                className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center disabled:opacity-30 cursor-pointer">
                <FiChevronLeft size={14} className="text-text-secondary" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-xl text-xs font-semibold cursor-pointer ${page === p ? 'bg-primary text-white shadow-md' : 'bg-primary/10 text-text-muted hover:bg-primary/10'}`}>
                  {p}
                </button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)}
                className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center disabled:opacity-30 cursor-pointer">
                <FiChevronRight size={14} className="text-text-secondary" />
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paged.map((c, i) => (
              <CustomerCard key={c.id} customer={c} index={i} onClick={() => navigate(`/customer-profile?id=${c.id}`)} />
            ))}
          </motion.div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-muted">Showing {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}</p>
            <div className="flex items-center gap-1">
              <button disabled={page === 1} onClick={() => setPage(page - 1)}
                className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center disabled:opacity-30 cursor-pointer">
                <FiChevronLeft size={14} className="text-text-secondary" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-8 h-8 rounded-xl text-xs font-semibold cursor-pointer ${page === p ? 'bg-primary text-white shadow-md' : 'bg-primary/10 text-text-muted hover:bg-primary/10'}`}>
                  {p}
                </button>
              ))}
              <button disabled={page === totalPages} onClick={() => setPage(page + 1)}
                className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center disabled:opacity-30 cursor-pointer">
                <FiChevronRight size={14} className="text-text-secondary" />
              </button>
            </div>
          </div>
        </>
      )}
    </PageLayout>
  )
}
