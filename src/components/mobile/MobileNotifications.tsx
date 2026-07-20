import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronLeft, FiPackage, FiTruck, FiTag, FiHeart, FiBell, FiCheck } from 'react-icons/fi'

const PURPLE = '#6C3BFF'
const PURPLE_DEEP = '#4B2ECC'
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

const SAMPLE: Notif[] = [
  { id: 1, icon: <FiTruck size={18} />, title: 'Order Shipped', description: 'Your order ORD-48291003 is on the way and will arrive by Fri.', time: '2h ago', color: PURPLE, unread: true, action: '/orders' },
  { id: 2, icon: <FiTag size={18} />, title: 'Flash Sale Live', description: 'Up to 40% off on premium smartphones for the next 6 hours.', time: '5h ago', color: '#F59E0B', unread: true, action: '/collection/all' },
  { id: 3, icon: <FiHeart size={18} />, title: 'Back in Stock', description: 'iPhone 16 Pro (256GB, Desert) is back in stock. Grab it now!', time: '1d ago', color: SUCCESS, unread: true, action: '/wishlist' },
  { id: 4, icon: <FiPackage size={18} />, title: 'Order Delivered', description: 'Your order ORD-48290551 has been delivered. Enjoy!', time: '2d ago', color: '#0EA5E9', unread: false },
  { id: 5, icon: <FiBell size={18} />, title: 'New Repair Slot', description: 'Weekend repair appointments are now open for booking.', time: '3d ago', color: '#8B5CF6', unread: false, action: '/book-repair' },
]

export default function MobileNotifications() {
  const navigate = useNavigate()
  const [items, setItems] = useState<Notif[]>(SAMPLE)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  useEffect(() => {
    const stored = localStorage.getItem('notif_read')
    if (stored) {
      try {
        const readIds: number[] = JSON.parse(stored)
        setItems((prev) => prev.map((n) => (readIds.includes(n.id) ? { ...n, unread: false } : n)))
      } catch {}
    }
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
    <div className="min-h-screen bg-[#F8F9FF] max-w-[480px] mx-auto pb-10" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
      <div className="sticky top-0 z-30 bg-[#F8F9FF] px-4 pt-3 pb-3 border-b border-[#EEF0F6]">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-[0_4px_14px_rgba(108,59,255,0.12)]">
            <FiChevronLeft size={20} style={{ color: PURPLE }} />
          </button>
          <div className="flex-1">
            <h1 className="text-[18px] font-bold text-[#1F2937]">Notifications</h1>
            <p className="text-[11px] text-[#6B7280]">{unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-[12px] font-semibold" style={{ color: PURPLE }}>Mark all read</button>
          )}
        </div>
        <div className="flex gap-2 mt-3">
          {(['all', 'unread'] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className="h-9 px-4 rounded-full text-[12px] font-semibold capitalize transition"
              style={filter === f ? { background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_DEEP})`, color: '#fff' } : { background: '#fff', color: '#6B7280' }}>
              {f === 'all' ? 'All' : 'Unread'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {visible.length === 0 ? (
          <div className={`${card} rounded-[24px] p-10 text-center mt-6`}>
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(108,59,255,0.1)' }}>
              <FiBell size={32} style={{ color: PURPLE }} />
            </div>
            <h2 className="text-[16px] font-bold text-[#1F2937] mb-1">No notifications</h2>
            <p className="text-[12px] text-[#6B7280]">You're all caught up.</p>
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
                    <p className="text-[14px] font-semibold text-[#1F2937] truncate">{n.title}</p>
                    {n.unread && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PURPLE }} />}
                  </div>
                  <p className="text-[12px] text-[#6B7280] leading-snug mt-0.5">{n.description}</p>
                  <p className="text-[11px] text-[#9CA3AF] mt-1">{n.time}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function prevIds(items: Notif[]): number[] {
  return items.map((n) => n.id)
}
