import { motion } from 'framer-motion'
import { FiSearch, FiSliders } from 'react-icons/fi'

interface SearchFilterBarProps {
  search: string
  onSearchChange: (v: string) => void
  filterStatus: string
  onFilterStatusChange: (v: string) => void
}

export default function SearchFilterBar({ search, onSearchChange, filterStatus, onFilterStatusChange }: SearchFilterBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col sm:flex-row gap-3"
    >
      <div className="flex-1 relative">
        <FiSearch size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search categories..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-xl bg-bg-card border border-white/5 text-sm text-text-secondary placeholder-text-muted outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/10 transition-all"
        />
      </div>
      <div className="flex gap-2">
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value)}
            className="h-10 px-4 pr-9 rounded-xl bg-bg-card border border-white/5 text-sm text-text-muted outline-none appearance-none cursor-pointer focus:border-primary/30 focus:ring-1 focus:ring-primary/10 transition-all"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <FiSliders size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        </div>
        <select className="h-10 px-4 rounded-xl bg-bg-card border border-white/5 text-sm text-text-muted outline-none appearance-none cursor-pointer focus:border-primary/30 focus:ring-1 focus:ring-primary/10 transition-all">
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>
    </motion.div>
  )
}
