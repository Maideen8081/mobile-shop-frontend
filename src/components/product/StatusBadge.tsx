import { StatusPill } from '../admin/AdminUI'

interface StatusBadgeProps {
  status: 'active' | 'inactive'
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return <StatusPill tone={status === 'active' ? 'success' : 'danger'}>{status === 'active' ? 'Active' : 'Inactive'}</StatusPill>
}

interface TagBadgeProps {
  label: string
  color?: string
}

const tagColors: Record<string, string> = {
  trending: 'bg-[#fbe1d8] text-[#a8261b]',
  new: 'bg-[#dcebff] text-[#2f7cf6]',
  bestseller: 'bg-[#f7f6f2] text-[#18503c]',
  featured: 'bg-[#ffe8c7] text-[#c26a05]',
}

export function TagBadge({ label, color }: TagBadgeProps) {
  return (
    <span className={`inline-flex items-center px-1.5 py-px rounded-md text-[10px] font-semibold whitespace-nowrap ${tagColors[color ?? ''] || 'bg-[#f7f6f2] text-[#1d2522]'}`}>
      {label}
    </span>
  )
}
