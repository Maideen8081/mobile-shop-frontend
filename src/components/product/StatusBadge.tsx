import { motion } from 'framer-motion'

interface StatusBadgeProps {
  status: 'active' | 'inactive'
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const isActive = status === 'active'
  return (
    <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-semibold ${
        isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-white text-text-secondary border border-border'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-primary' : 'bg-text-muted'}`} />
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
    trending: 'bg-primary/10 text-primary border-primary/20',
    new: 'bg-primary/10 text-primary border-primary/20',
    bestseller: 'bg-primary/10 text-primary border-primary/20',
    featured: 'bg-primary text-white border-primary',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${colors[color ?? ''] || 'bg-bg text-text-secondary border-border'}`}>
      {label}
    </span>
  )
}
