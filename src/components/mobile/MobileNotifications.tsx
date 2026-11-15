import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronLeft, FiPackage, FiTruck, FiTool, FiBell } from 'react-icons/fi'
import { authService } from '../../services/authService'
import { orderService } from '../../services/orderService'
import { repairService } from '../../services/repairService'
import SiteTopNav from '../ecommerce/SiteTopNav'
import { useIsMobile } from './helpers'

const PURPLE = '#210D35'
const PURPLE_DEEP = '#3A1E52'
const SUCCESS = '#16A34A'
const card = 'bg-white rounded-[20px] shadow-[0_8px_30px_rgba(0,0,0,0.08)]'

type Notif = {
  id: number
  icon: any
  title: string
  description: string
  time: string
  color: string
  unread: boolean
  action?: string
}

function timeAgo(iso: string): string {
  const t = Date.parse(iso)
  if (!t) return ''
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000))
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return days < 30 ? `${days}d ago` : new Date(t).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

const RECENT_DAYS = 7

/** Real updates only: one entry per order and repair, newest first. */
async function loadNotifications(): Promise<Notif[]> {
  if (!authService.isAuthenticated()) return []
  const [orders, repairs] = await Promise.all([
    orderService.listMine().catch(() => []),
    repairService.myTickets().catch(() => [] as any[]),
  ])
  const recent = (iso: string) => Date.now() - (Date.parse(iso) || 0) < RECENT_DAYS * 86400000
  const fromOrders: (Notif & { at: string })[] = orders.map((o, i) => {
    const at = o.updated_at || o.created_at
    const delivered = /deliver/i.test(o.delivery_status) && !/out for/i.test(o.delivery_status)
    return {
      id: 1_000_000 + (o.id || i),
      icon: delivered ? <FiPackage size={18} /> : <FiTruck size={18} />,
      title: `Order ${o.order_id}`,
      description: `Status: ${o.delivery_status}.`,
      time: timeAgo(at),
      color: delivered ? '#0EA5E9' : PURPLE,
      unread: recent(at),
      action: '/orders',
      at,
    }
  })
  const fromRepairs: (Notif & { at: string })[] = (repairs as any[]).map((r, i) => {
    const at = r.updatedAt || r.createdAt
    return {
      id: 2_000_000 + (r.id || i),
      icon: <FiTool size={18} />,
      title: `Repair ${r.repairId}`,
      description: `${[r.deviceBrand, r.deviceModel].filter(Boolean).join(' ')} — ${String(r.status || '').replace(/_/g, ' ')}.`,
      time: timeAgo(at),
      color: SUCCESS,
      unread: recent(at),
      action: r.id ? `/my-repairs/${r.id}` : '/my-repairs',
      at,
    }
  })
  return [...fromOrders, ...fromRepairs]
    .sort((x, y) => (Date.parse(y.at) || 0) - (Date.parse(x.at) || 0))
    .map(({ at: _at, ...n }) => n)
}

export default function MobileNotifications() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [items, setItems] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    let alive = true
    loadNotifications().then((list) => {
      if (!alive) return
      let readIds: number[] = []
      try { readIds = JSON.parse(localStorage.getItem('notif_read') || '[]') } catch { /* ignore */ }
      setItems(list.map((n) => (readIds.includes(n.id) ? { ...n, unread: false } : n)))
    }).finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, unread: false })))
    localStorage.setItem('notif_read', JSON.stringify(prevIds(items)))
  }

  const openNotif = (n: Notif) => {
    setItems((prev) => {
      const next = prev.map((x) => (x.id === n.id ? { ...x, unread: false } : x))
      localStorage.setItem('notif_read', JSON.stringify(next.filter((x) => !x.unread).map((x) => x.id)))
      return next
    })
    if (n.action) navigate(n.action)
  }

  const unreadCount = items.filter((n) => n.unread).length
  const visible = filter === 'unread' ? items.filter((n) => n.unread) : items

  return (
    <div className="min-h-screen bg-[#FFFBFB] pb-10" style={{ fontFamily: 'var(--font-ui)' }}>
      {!isMobile && <SiteTopNav />}
      <div className="max-w-[720px] mx-auto">
      <div className={`${isMobile ? 'sticky top-0 z-30' : 'pt-6'} bg-[#FFFBFB] px-4 pt-3 pb-3 border-b border-[#EEF0F6]`}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-[8px] bg-white flex items-center justify-center shadow-[0_4px_14px_rgba(123, 63, 208,0.12)]">
            <FiChevronLeft size={20} style={{ color: PURPLE }} />
          </button>
          <div className="flex-1">
            <h1 className="text-title-sm font-bold text-[#1F2937]">Notifications</h1>
            <p className="text-micro text-[#6B7280]">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-caption font-semibold" style={{ color: PURPLE }}>Mark all read</button>
          )}
        </div>
        <div className="flex gap-2 mt-3">
          {(['all', 'unread'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="h-9 px-4 rounded-[8px] text-caption font-semibold capitalize transition"
              style={filter === f ? { background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DEEP})`, color: '#fff' } : { background: '#fff', color: '#6B7280' }}>
              {f === 'all' ? 'All' : 'Unread'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {loading ? (
          <p className="text-caption text-[#6B7280] text-center mt-10">Loading your updates…</p>
        ) : visible.length === 0 ? (
          <div className={`${card} rounded-[24px] p-10 text-center mt-6`}>
            <div className="w-20 h-20 rounded-[8px] mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(123, 63, 208,0.1)' }}>
              <FiBell size={32} style={{ color: PURPLE }} />
            </div>
            <h2 className="text-body font-bold text-[#1F2937] mb-1">No notifications</h2>
            <p className="text-caption text-[#6B7280]">
              {authService.isAuthenticated() ? 'Updates on your orders and repairs will appear here.' : 'Sign in to see updates on your orders and repairs.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {visible.map((n) => (
              <button key={n.id} onClick={() => openNotif(n)} className={`${card} rounded-[18px] p-3.5 flex items-start gap-3 w-full text-left relative ${n.unread ? '' : 'opacity-75'}`}>
                <div className="w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0" style={{ background: `${n.color}15`, color: n.color }}>
                  {n.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-body-sm font-semibold text-[#1F2937] truncate">{n.title}</p>
                    {n.unread && <span className="w-2 h-2 rounded-[8px] flex-shrink-0" style={{ background: PURPLE }} />}
                  </div>
                  <p className="text-caption text-[#6B7280] leading-snug mt-0.5">{n.description}</p>
                  <p className="text-micro text-[#9CA3AF] mt-1">{n.time}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

function prevIds(items: Notif[]): number[] {
  return items.map((n) => n.id)
}
