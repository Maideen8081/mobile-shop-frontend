import { StatusPill } from '../admin/AdminUI'

interface StatusBadgeProps {
  status: 'active' | 'inactive'
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  return <StatusPill tone={status === 'active' ? 'success' : 'danger'}>{status === 'active' ? 'Active' : 'Inactive'}</StatusPill>
}
