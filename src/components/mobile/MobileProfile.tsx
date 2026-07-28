import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiChevronLeft, FiLogOut, FiEdit3, FiMapPin, FiCreditCard, FiShoppingBag, FiHeart, FiTag, FiBell, FiUser, FiMail, FiPhone, FiCalendar, FiShield, FiLock, FiGlobe, FiMoon, FiSliders, FiSmartphone, FiHelpCircle, FiMessageCircle, FiFileText, FiAlertTriangle, FiStar, FiInfo, FiCheckCircle, FiPhoneCall } from 'react-icons/fi'
import { authService, type UserProfile } from '../../services/authService'
import { useMobileToast } from './useMobileToast'
import DoubleRingLoader from '../ui/DoubleRingLoader'
import MobileBottomNav from './MobileBottomNav'
import MobileCartBarActions from './MobileCartBarActions'

const PRIMARY = '#CB202D'
const DANGER = '#EF4444'
const INK = '#1F2937'
const MUTED = '#6B7280'
const grad = 'linear-gradient(135deg,#CB202D 0%,#FF5A65 100%)'

export default function MobileProfile() {
  const navigate = useNavigate()
  const { show: showToast, Toast } = useMobileToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLogout, setShowLogout] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [detail, setDetail] = useState<{ title: string; body: string } | null>(null)
  const [editForm, setEditForm] = useState({ fullName: '', email: '', mobile: '' })

  const openEdit = () => {
    const u = profile || ({} as UserProfile)
    setEditForm({ fullName: u.fullName || '', email: u.email || '', mobile: u.mobile || '' })
    setEditing(true)
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const updated = await authService.updateProfile(editForm)
      setProfile(updated)
      showToast('Profile updated successfully.', 'success')
      setEditing(false)
    } catch {
      showToast('Failed to update profile.', 'error')
    }
    setSaving(false)
  }

  useEffect(() => {
    if (!authService.isAuthenticated()) { setLoading(false); return }
    authService.getProfile()
      .then(setProfile)
      .catch(() => {
        const stored = localStorage.getItem('user_profile')
        if (stored) {
          try {
            const { name, email } = JSON.parse(stored)
            setProfile({ id: 0, email: email || '', fullName: name || 'User' })
          } catch { setProfile(null) }
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const completion = (() => {
    const u = profile || ({} as UserProfile)
    const fields = [u.fullName, u.email, u.mobile]
    const filled = fields.filter((f) => f && String(f).trim().length > 0).length
    return Math.round((filled / fields.length) * 100)
  })()

  const handleLogout = () => {
    authService.logout()
    localStorage.removeItem('cart')
    localStorage.removeItem('wishlist')
    window.dispatchEvent(new Event('cart-updated'))
    window.dispatchEvent(new Event('wishlist-updated'))
    showToast('Logged out successfully.', 'success')
    navigate('/login')
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await authService.deleteAccount()
      localStorage.removeItem('cart')
      localStorage.removeItem('wishlist')
      localStorage.removeItem('user_profile')
      window.dispatchEvent(new Event('cart-updated'))
      window.dispatchEvent(new Event('wishlist-updated'))
      showToast('Account deleted successfully.', 'success')
      navigate('/login')
    } catch {
      showToast('Failed to delete account. Please try again.', 'error')
      setDeleting(false)
      setShowDelete(false)
    }
  }

  const goBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate('/')
  }

  const DETAILS: Record<string, string> = {
    'Privacy': 'We protect your personal data with industry-standard encryption. You can request a data export or deletion anytime from this section.',
    'Security': 'Keep your account safe with a strong password and two-factor authentication. We notify you of any unusual login activity.',
    'Language': 'The app is currently available in English. More regional languages will be added in upcoming releases.',
    'Dark Mode': 'Theme follows your device setting (System default). A manual toggle is coming soon.',
    'Saved Devices': 'You have 2 active devices signed in to your account. Revoke access for any device you no longer use.',
    'Help Center': 'Find answers to common questions about orders, returns, repairs, and payments in our help articles.',
    'Live Chat': 'Our support team is available 9 AM – 9 PM to assist you in real time via live chat.',
    'FAQ': 'Frequently asked questions cover shipping, warranty, refunds, and account management.',
    'Contact Support': 'Email support@mobileshop.com or call our helpline +91 1800 123 456 during business hours.',
    'Report Issue': 'Facing a problem? Report it here and our team will investigate and get back to you shortly.',
    'Rate App': 'Enjoying Mobile Shop? Rate us on the Play Store — your feedback helps us improve.',
    'Terms & Conditions': 'By using Mobile Shop you agree to our standard terms of service governing purchases, returns, and usage of the platform.',
    'Privacy Policy': 'Our privacy policy explains what data we collect, how it is used, and the controls you have over your information.',
    'App Info': 'Mobile Shop v1.0.0 — Your one-stop mobile shopping and repair companion.',
    'Licenses': 'This application uses open-source libraries distributed under MIT and Apache 2.0 licenses.',
  }

  if (!authService.isAuthenticated()) {
    return (
      <div className="min-h-screen bg-[#FFFBFB] max-w-[480px] mx-auto flex flex-col font-sans" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
        {/* Header */}
        <div className="relative overflow-hidden" style={{ background: grad, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
          <span className="absolute -top-10 -right-8 w-40 h-40 rounded-full bg-white/20 blur-2xl" />
          <span className="absolute -bottom-12 -left-10 w-44 h-44 rounded-full bg-white/10 blur-2xl" />
          <span className="absolute top-1/3 right-10 w-20 h-20 rounded-full border border-white/20" />
          <div className="relative z-10 px-5 pt-4 pb-6">
            <div className="flex items-center justify-between">
              <button onClick={() => navigate('/')} aria-label="Home" className="w-9 h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center active:scale-90 transition">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
              </button>
              <h1 className="text-[16px] font-semibold text-white/90">My Profile</h1>
              <div className="w-9 h-9" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-28 -mt-4">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(203,32,45,0.1)', boxShadow: '0 8px 30px rgba(203,32,45,0.12)' }}>
            <FiUser size={40} style={{ color: PRIMARY }} />
          </div>

          <h2 className="text-[22px] font-bold text-[#1F2937] mb-1.5">Welcome!</h2>
          <p className="text-[13px] text-[#6B7280] text-center mb-8 leading-relaxed max-w-[260px]">
            Sign in to access your profile, orders, wishlist and more.
          </p>

          <button
            onClick={() => navigate('/login')}
            className="w-full h-13 rounded-full text-[15px] font-semibold text-white flex items-center justify-center gap-2 mb-3"
            style={{ background: grad, boxShadow: '0 6px 20px rgba(203,32,45,0.3)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
            Login
          </button>

          <button
            onClick={() => navigate('/signup')}
            className="w-full h-13 rounded-full text-[15px] font-semibold text-[#CB202D] flex items-center justify-center gap-2"
            style={{ background: 'rgba(203,32,45,0.08)', border: '1.5px solid rgba(203,32,45,0.2)' }}
          >
            Create Account
          </button>

          <button
            onClick={() => navigate('/')}
            className="mt-6 flex items-center gap-1.5 text-[13px] font-medium text-[#6B7280] active:scale-95 transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            Back to Home
          </button>
        </div>

        <MobileBottomNav />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FFFBFB] max-w-[480px] mx-auto flex items-center justify-center">
        <DoubleRingLoader size={48} label="Loading profile…" />
      </div>
    )
  }

  const user = profile || { id: 0, email: '', fullName: 'User' }
  const initials = (user.fullName || 'U').split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()

  const quickActions = [
    { icon: FiMapPin, label: 'Addresses', sub: 'Saved addresses', to: '/profile/addresses' },
    { icon: FiCreditCard, label: 'Payment', sub: 'Manage cards', to: '/checkout/payment' },
    { icon: FiShoppingBag, label: 'Orders', sub: 'Purchase history', to: '/orders' },
    { icon: FiHeart, label: 'Wishlist', sub: 'Saved products', to: '/wishlist' },
    { icon: FiTag, label: 'Coupons', sub: 'Available offers', to: '/collection/all' },
    { icon: FiBell, label: 'Notifications', sub: 'Preferences', to: '/notifications' },
  ]

  const infoRows = [
    { icon: FiUser, label: 'Full Name', value: user.fullName || '-' },
    { icon: FiMail, label: 'Email', value: user.email || '-' },
    ...(user.mobile ? [{ icon: FiPhone, label: 'Phone Number', value: user.mobile }] : []),
    ...(user.dateJoined ? [{ icon: FiCalendar, label: 'Member Since', value: new Date(user.dateJoined).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) }] : []),
  ]

  const settings = [
    { icon: FiShield, label: 'Privacy', sub: 'Control your data', to: '/profile' },
    { icon: FiLock, label: 'Security', sub: 'Password & login', to: '/profile' },
    { icon: FiGlobe, label: 'Language', sub: 'English', to: '/profile' },
    { icon: FiMoon, label: 'Dark Mode', sub: 'System default', to: '/profile' },
    { icon: FiSliders, label: 'Notification Preferences', sub: 'Manage alerts', to: '/notifications' },
    { icon: FiSmartphone, label: 'Saved Devices', sub: '2 active devices', to: '/profile' },
  ]

  const support = [
    { icon: FiHelpCircle, label: 'Help Center', to: '/profile' },
    { icon: FiMessageCircle, label: 'Live Chat', to: '/profile' },
    { icon: FiFileText, label: 'FAQ', to: '/profile' },
    { icon: FiPhoneCall, label: 'Contact Support', to: '/profile' },
    { icon: FiAlertTriangle, label: 'Report Issue', to: '/profile' },
    { icon: FiStar, label: 'Rate App', to: '/profile' },
  ]

  const about = [
    { icon: FiFileText, label: 'Terms & Conditions', to: '/profile' },
    { icon: FiLock, label: 'Privacy Policy', to: '/profile' },
    { icon: FiInfo, label: 'App Info', sub: 'Version 1.0.0', to: '/profile' },
    { icon: FiFileText, label: 'Licenses', to: '/profile' },
  ]

  const card = 'bg-white rounded-[22px] shadow-[0_8px_30px_rgba(0,0,0,0.08)]'
  const press = 'active:scale-[0.98] transition'

  return (
    <div className="min-h-screen bg-[#F7F8FC] max-w-[480px] mx-auto pb-28 font-sans" style={{ fontFamily: "'Poppins', system-ui, sans-serif" }}>
      {/* ── Premium compact header ── */}
      <div className="relative overflow-hidden" style={{ background: grad, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        {/* decorative blurred circles */}
        <span className="absolute -top-10 -right-8 w-40 h-40 rounded-full bg-white/20 blur-2xl" />
        <span className="absolute -bottom-12 -left-10 w-44 h-44 rounded-full bg-white/10 blur-2xl" />
        <span className="absolute top-1/3 right-10 w-20 h-20 rounded-full border border-white/20" />

        <div className="relative z-10 px-5 pt-4 flex items-center justify-between">
          <button onClick={goBack} aria-label="Back" className="w-9 h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center active:scale-90 transition">
            <FiChevronLeft size={20} className="text-white" />
          </button>
          <h1 className="text-[16px] font-semibold text-white/90">My Profile</h1>
          <button onClick={openEdit} aria-label="Edit Profile" className="w-9 h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center active:scale-90 transition">
            <FiEdit3 size={17} className="text-white" />
          </button>
        </div>

        <div className="relative z-10 flex flex-col items-center text-center pt-4 pb-8">
          <div className="relative">
            <div className="w-[90px] h-[90px] rounded-full flex items-center justify-center text-[30px] font-bold text-white border-[3px] border-white shadow-[0_8px_24px_rgba(0,0,0,0.22)]"
              style={{ background: 'rgba(255,255,255,0.18)' }}>
              {initials}
            </div>
            <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-[#22C55E] border-2 border-white" />
          </div>
          <h2 className="text-[20px] font-bold text-white mt-3 leading-tight tracking-tight px-4">{user.fullName || 'User'}</h2>
          {user.email && <p className="text-[14px] text-white/70 mt-0.5 truncate max-w-[280px] px-4">{user.email}</p>}
          <div className="flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur">
            <FiCheckCircle size={13} className="text-[#FCD34D]" />
            <span className="text-[11px] font-semibold text-white/90">Verified User</span>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 relative z-20">
        {/* ── Profile completion floating card ── */}
        <div className={`${card} rounded-[20px] p-4`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[13px] font-semibold" style={{ color: INK }}>Profile Completion</p>
            <span className="text-[13px] font-bold" style={{ color: PRIMARY }}>{completion}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[#EEF1F4] overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${completion}%`, background: grad }} />
          </div>
          <button onClick={openEdit} className={`w-full mt-3 h-10 rounded-full text-[13px] font-semibold text-white ${press}`} style={{ background: grad }}>
            Complete Profile
          </button>
        </div>

        {/* ── Quick action grid ── */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {quickActions.map((a) => {
            const Icon = a.icon
            return (
              <button key={a.label} onClick={() => navigate(a.to)} className={`${card} ${press} rounded-[18px] p-3 flex flex-col items-center text-center gap-1.5`}>
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(203,32,45,0.10)', color: PRIMARY }}>
                  <Icon size={19} />
                </div>
                <span className="text-[12px] font-semibold leading-tight" style={{ color: INK }}>{a.label}</span>
                <span className="text-[10px] leading-tight truncate w-full" style={{ color: MUTED }}>{a.sub}</span>
              </button>
            )
          })}
        </div>

        {/* ── Personal information ── */}
        <SectionTitle>Personal Information</SectionTitle>
        <div className={card}>
          {infoRows.map((r, i) => {
            const Icon = r.icon
            return (
              <button key={r.label} onClick={openEdit} className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${press} ${i < infoRows.length - 1 ? 'border-b border-[#F1F3F7]' : ''}`}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,32,45,0.08)', color: PRIMARY }}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px]" style={{ color: MUTED }}>{r.label}</p>
                  <p className="text-[14px] font-semibold truncate" style={{ color: INK }}>{r.value}</p>
                </div>
                <FiChevronLeft size={18} className="text-[#9CA3AF] rotate-180 flex-shrink-0" />
              </button>
            )
          })}
        </div>

        {/* ── Account settings ── */}
        <SectionTitle>Account Settings</SectionTitle>
        <div className={card}>
          {settings.map((s, i) => {
            const Icon = s.icon
            const onClick = s.label === 'Notification Preferences'
              ? () => navigate('/notifications')
              : () => setDetail({ title: s.label, body: DETAILS[s.label] || 'Details coming soon.' })
            return (
              <button key={s.label} onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${press} ${i < settings.length - 1 ? 'border-b border-[#F1F3F7]' : ''}`}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(203,32,45,0.08)', color: PRIMARY }}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[14px] font-semibold" style={{ color: INK }}>{s.label}</p>
                  <p className="text-[11px]" style={{ color: MUTED }}>{s.sub}</p>
                </div>
                <FiChevronLeft size={18} className="text-[#9CA3AF] rotate-180 flex-shrink-0" />
              </button>
            )
          })}
        </div>

        {/* ── Support ── */}
        <SectionTitle>Support</SectionTitle>
        <div className={card}>
          {support.map((s, i) => {
            const Icon = s.icon
            return (
              <button key={s.label} onClick={() => setDetail({ title: s.label, body: DETAILS[s.label] || 'Details coming soon.' })} className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${press} ${i < support.length - 1 ? 'border-b border-[#F1F3F7]' : ''}`}>
                <Icon size={18} className="text-[#9CA3AF] flex-shrink-0" />
                <span className="flex-1 text-left text-[14px] font-medium" style={{ color: INK }}>{s.label}</span>
                <FiChevronLeft size={18} className="text-[#9CA3AF] rotate-180 flex-shrink-0" />
              </button>
            )
          })}
        </div>

        {/* ── About ── */}
        <SectionTitle>About</SectionTitle>
        <div className={card}>
          {about.map((s, i) => {
            const Icon = s.icon
            return (
              <button key={s.label} onClick={() => setDetail({ title: s.label, body: DETAILS[s.label] || 'Details coming soon.' })} className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${press} ${i < about.length - 1 ? 'border-b border-[#F1F3F7]' : ''}`}>
                <Icon size={18} className="text-[#9CA3AF] flex-shrink-0" />
                <div className="flex-1 text-left">
                  <span className="text-[14px] font-medium" style={{ color: INK }}>{s.label}</span>
                  {s.sub && <p className="text-[11px]" style={{ color: MUTED }}>{s.sub}</p>}
                </div>
                <FiChevronLeft size={18} className="text-[#9CA3AF] rotate-180 flex-shrink-0" />
              </button>
            )
          })}
        </div>

        {/* ── Logout ── */}
        <button onClick={() => setShowLogout(true)} className={`${card} ${press} w-full flex items-center justify-center gap-2 mt-4 h-12 rounded-[18px] text-[14px] font-semibold`} style={{ color: DANGER }}>
          <FiLogOut size={17} /> Logout
        </button>

        {/* ── Delete account danger card ── */}
        <div className="mt-4 rounded-[20px] p-4 border" style={{ background: '#FFFBFB', borderColor: '#FFD5D5' }}>
          <div className="flex items-center gap-2 mb-2">
            <FiAlertTriangle size={16} style={{ color: DANGER }} />
            <p className="text-[13px] font-semibold" style={{ color: DANGER }}>Delete Account</p>
          </div>
          <p className="text-[12px] mb-3" style={{ color: '#B91C1C' }}>Permanently remove your account and all associated data.</p>
          <button onClick={() => setShowDelete(true)} className="w-full h-11 rounded-full text-[13px] font-semibold text-white" style={{ background: DANGER }}>
            Delete Account
          </button>
        </div>

        <p className="text-center text-[11px] mt-5" style={{ color: MUTED }}>Mobile Shop • v1.0.0</p>
      </div>

      {/* ── Logout bottom sheet ── */}
      <Sheet open={showLogout} onClose={() => setShowLogout(false)}>
        <div className="w-12 h-1.5 rounded-full bg-[#E5E7EB] mx-auto mb-4" />
        <h3 className="text-[18px] font-bold text-center" style={{ color: INK }}>Logout?</h3>
        <p className="text-[13px] text-center mt-1 mb-5" style={{ color: MUTED }}>You'll need to sign in again to access your account.</p>
        <button onClick={() => setShowLogout(false)} className="w-full h-12 rounded-full text-[14px] font-semibold mb-3" style={{ background: '#F3F4F6', color: INK }}>
          Cancel
        </button>
        <button onClick={handleLogout} className="w-full h-12 rounded-full text-[14px] font-semibold text-white" style={{ background: grad }}>
          Yes, Logout
        </button>
      </Sheet>

      {/* ── Delete bottom sheet ── */}
      <Sheet open={showDelete} onClose={() => setShowDelete(false)}>
        <div className="w-12 h-1.5 rounded-full bg-[#E5E7EB] mx-auto mb-4" />
        <div className="flex items-center gap-2 justify-center mb-2">
          <FiAlertTriangle size={18} style={{ color: DANGER }} />
          <h3 className="text-[18px] font-bold" style={{ color: DANGER }}>Delete Account</h3>
        </div>
        <p className="text-[13px] text-center mt-1 mb-5" style={{ color: MUTED }}>This action is permanent and cannot be undone.</p>
        <button onClick={() => setShowDelete(false)} className="w-full h-12 rounded-full text-[14px] font-semibold mb-3" style={{ background: '#F3F4F6', color: INK }}>
          Cancel
        </button>
        <button onClick={handleDelete} disabled={deleting} className="w-full h-12 rounded-full text-[14px] font-semibold text-white disabled:opacity-60" style={{ background: DANGER }}>
          {deleting ? 'Deleting…' : 'Delete Permanently'}
        </button>
      </Sheet>

      {/* ── Edit profile sheet ── */}
      <Sheet open={editing} onClose={() => setEditing(false)}>
        <div className="w-12 h-1.5 rounded-full bg-[#E5E7EB] mx-auto mb-4" />
        <h3 className="text-[18px] font-bold mb-4" style={{ color: INK }}>Edit Profile</h3>
        <div className="space-y-3">
          <Field label="Full Name">
            <input
              value={editForm.fullName}
              onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
              className="w-full h-11 px-3 rounded-2xl bg-[#F7F8FC] border border-[#E5E7EB] outline-none text-[14px] font-medium"
              style={{ color: INK }}
            />
          </Field>
          <Field label="Email">
            <input
              value={editForm.email}
              onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full h-11 px-3 rounded-2xl bg-[#F7F8FC] border border-[#E5E7EB] outline-none text-[14px] font-medium"
              style={{ color: INK }}
            />
          </Field>
          <Field label="Phone Number">
            <input
              value={editForm.mobile}
              onChange={(e) => setEditForm((f) => ({ ...f, mobile: e.target.value }))}
              className="w-full h-11 px-3 rounded-2xl bg-[#F7F8FC] border border-[#E5E7EB] outline-none text-[14px] font-medium"
              style={{ color: INK }}
            />
          </Field>
        </div>
        <button onClick={() => setEditing(false)} className="w-full h-12 rounded-full text-[14px] font-semibold mt-5 mb-3" style={{ background: '#F3F4F6', color: INK }}>
          Cancel
        </button>
        <button onClick={handleSaveProfile} disabled={saving} className={`w-full h-12 rounded-full text-[14px] font-semibold text-white disabled:opacity-60 ${press}`} style={{ background: grad }}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </Sheet>

      {/* ── Detail sheet ── */}
      <Sheet open={detail !== null} onClose={() => setDetail(null)}>
        <div className="w-12 h-1.5 rounded-full bg-[#E5E7EB] mx-auto mb-4" />
        <h3 className="text-[18px] font-bold mb-3" style={{ color: INK }}>{detail?.title}</h3>
        <p className="text-[14px] leading-relaxed" style={{ color: MUTED }}>{detail?.body}</p>
        <button onClick={() => setDetail(null)} className="w-full h-12 rounded-full text-[14px] font-semibold mt-5" style={{ background: grad, color: '#fff' }}>
          Close
        </button>
      </Sheet>

      <MobileBottomNav />
      <MobileCartBarActions />
      {Toast}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[12px] font-semibold mb-1.5 px-0.5" style={{ color: MUTED }}>{label}</p>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[18px] font-semibold mt-6 mb-2.5 px-0.5" style={{ color: INK }}>{children}</h2>
}

function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 px-4 pb-6" onClick={onClose}>
      <div className="w-full max-w-[420px] bg-white rounded-[24px] p-5" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}
