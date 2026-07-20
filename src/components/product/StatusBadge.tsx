import { motion } from 'framer-motion'

interface StatusBadgeProps {
  status: 'active' | 'inactive'
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const isActive = status === 'active'
  return (
    <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-semibold ${
        isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50' : 'bg-rose-50 text-rose-600 border border-rose-200/50'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      {isActive ? 'Active' : 'Inactive'}
    </motion.span>
  )
}

interface TagBadgeProps {
  label: string
  color?: string
}

export function TagBadge({ label, color }: TagBadgeProps) {
  const colors: Record<string, string> = {
    trending: 'bg-rose-50 text-rose-600 border-rose-200/50',
    new: 'bg-blue-50 text-blue-600 border-blue-200/50',
    bestseller: 'bg-amber-50 text-amber-600 border-amber-200/50',
    featured: 'bg-primary/10 text-primary border-primary/20',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${colors[color ?? ''] || 'bg-bg text-text-secondary border-border'}`}>
      {label}
    </span>
  )
}
