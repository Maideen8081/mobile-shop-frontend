import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FiAlertTriangle, FiBell, FiCalendar, FiChevronLeft, FiChevronRight, FiEdit3,
  FiHeart, FiHelpCircle, FiHome, FiKey, FiLock, FiLogOut, FiMail, FiMapPin,
  FiPackage, FiPhone, FiSliders, FiTool, FiUser,
} from 'react-icons/fi'
import { authService, type UserProfile } from '../../services/authService'
import { addressService, type AddressData } from '../../services/addressService'
import { useMobileToast } from './useMobileToast'
import PageLoading from '../ui/PageLoading'
import MobileBottomNav from './MobileBottomNav'
import MobileCartBarActions from './MobileCartBarActions'

const PRIMARY = '#0f3b2c'
const DANGER = '#EF4444'
const INK = '#1d2522'
const MUTED = '#5d6762'
const grad = 'linear-gradient(135deg,#0f3b2c 0%,#0f3b2c 100%)'

const PREFS_KEY = 'profile_prefs'
type Prefs = { orderUpdates: boolean; promotions: boolean }
const readPrefs = (): Prefs => {
  try {
    return { orderUpdates: true, promotions: false, ...JSON.parse(localStorage.getItem(PREFS_KEY) || '{}') }
  } catch {
    return { orderUpdates: true, promotions: false }
  }
}

export default function MobileProfile() {
  const navigate = useNavigate()
  const { show: showToast, Toast } = useMobileToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [addresses, setAddresses] = useState<AddressData[]>([])
  const [loading, setLoading] = useState(true)
  const [prefs, setPrefs] = useState<Prefs>(readPrefs)
  const [showLogout, setShowLogout] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [editing, setEditing] = useState(false)
  const [changingPw, setChangingPw] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [editForm, setEditForm] = useState({ fullName: '', email: '', mobile: '' })
  const [pwForm, setPwForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' })
  const [pwError, setPwError] = useState('')

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
    let alive = true
    authService.getProfile()
      .then((p) => { if (alive) setProfile(p) })
      .catch(() => {
        if (!alive) return
        const stored = localStorage.getItem('user_profile')
        if (stored) {
          try {
            const { name, email } = JSON.parse(stored)
            setProfile({ id: 0, email: email || '', fullName: name || 'User' })
          } catch { setProfile(null) }
        }
      })
      .finally(() => { if (alive) setLoading(false) })
    addressService.list().then((a) => { if (alive) setAddresses(a) }).catch(() => {})
    return () => { alive = false }
  }, [])

  const handleLogout = async () => {
    await authService.logout()
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
    else navigate('/home')
  }

  const updatePref = (key: keyof Prefs, value: boolean) => {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    try { localStorage.setItem(PREFS_KEY, JSON.stringify(next)) } catch { /* ignore */ }
    showToast('Preferences saved', 'success')
  }

  const savePassword = async () => {
    setPwError('')
    if (!pwForm.oldPassword) return setPwError('Enter your current password')
    if (pwForm.newPassword.length < 8 || !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pwForm.newPassword)) {
      return setPwError('New password needs 8+ chars with upper, lower case and a number')
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) return setPwError('New passwords don’t match')
    setPwSaving(true)
    try {
      await authService.changePassword(pwForm)
      setChangingPw(false)
      setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' })
      showToast('Password changed', 'success')
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || 'Couldn’t change password.'
      setPwError(typeof msg === 'string' ? msg : 'Couldn’t change password.')
    }
    setPwSaving(false)
  }

  if (!authService.isAuthenticated()) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] max-w-[480px] mx-auto flex flex-col font-sans" style={{ fontFamily: 'var(--font-ui)' }}>
        <div className="relative overflow-hidden" style={{ background: grad, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
          <div className="relative z-10 px-5 pt-4 pb-6">
            <div className="flex items-center justify-between">
              <button onClick={() => navigate('/home')} aria-label="Home" className="w-9 h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center active:scale-90 transition">
                <FiHome size={18} className="text-white" />
              </button>
              <h1 className="text-body font-semibold text-white/90">My Profile</h1>
              <div className="w-9 h-9" />
            </div>
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-28 -mt-4">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(15,59,44,0.1)' }}>
            <FiUser size={40} style={{ color: PRIMARY }} />
          </div>
          <h2 className="text-title font-bold text-[#1d2522] mb-1.5">Welcome!</h2>
          <p className="text-label text-[#5d6762] text-center mb-8 leading-relaxed max-w-[260px]">
            Sign in to access your profile, orders, wishlist and more.
          </p>
          <button onClick={() => navigate('/login')} className="w-full h-13 rounded-[12px] text-body font-semibold text-white flex items-center justify-center gap-2 mb-3" style={{ background: grad }}>
            Login
          </button>
          <button onClick={() => navigate('/signup')} className="w-full h-13 rounded-[12px] text-body font-semibold text-[#0f3b2c] flex items-center justify-center gap-2" style={{ background: 'rgba(15,59,44,0.08)', border: '1.5px solid rgba(15,59,44,0.2)' }}>
            Create Account
          </button>
        </div>
        <MobileBottomNav />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f6f2] max-w-[480px] mx-auto flex items-center justify-center">
        <PageLoading label="Loading profile…" />
      </div>
    )
  }

  const user = profile || { id: 0, email: '', fullName: 'User' }
  const initials = (user.fullName || 'U').split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase()
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0]
  const joined = user.dateJoined ? new Date(user.dateJoined).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : ''

  const accountItems = [
    { icon: FiPackage, label: 'My Orders', to: '/orders' },
    { icon: FiTool, label: 'My Repairs', to: '/my-repairs' },
    { icon: FiMapPin, label: 'Addresses', to: '/profile/addresses' },
    { icon: FiHeart, label: 'Wishlist', to: '/wishlist' },
    { icon: FiBell, label: 'Notifications', to: '/notifications' },
    { icon: FiHelpCircle, label: 'Help & Support', to: '/support' },
  ]

  const infoRows = [
    { icon: FiUser, label: 'Full Name', value: user.fullName || '—' },
    { icon: FiMail, label: 'Email', value: user.email || '—' },
    { icon: FiPhone, label: 'Mobile', value: user.mobile || 'Not added', missing: !user.mobile },
    { icon: FiCalendar, label: 'Member Since', value: joined || 'Not available', missing: !joined },
  ]

  const card = 'bg-white rounded-[20px] shadow-[0_6px_24px_rgba(15,59,44,0.06)]'
  const press = 'active:scale-[0.99] transition'

  return (
    <div className="min-h-screen bg-[#f7f6f2] max-w-[480px] mx-auto pb-28 font-sans" style={{ fontFamily: 'var(--font-ui)' }}>
      <div className="relative overflow-hidden" style={{ background: grad, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 }}>
        <span className="absolute -top-10 -right-8 w-40 h-40 rounded-full bg-white/15 blur-2xl" />
        <span className="absolute -bottom-12 -left-10 w-44 h-44 rounded-full bg-white/10 blur-2xl" />
        <div className="relative z-10 px-5 pt-4 flex items-center justify-between">
          <button onClick={goBack} aria-label="Back" className="w-9 h-9 rounded-full bg-white/15 backdrop-blur flex items-center justify-center active:scale-90 transition">
            <FiChevronLeft size={20} className="text-white" />
          </button>
          <h1 className="text-body font-semibold text-white/90">My Profile</h1>
          <button onClick={openEdit} aria-label="Edit Profile" className="w-9 h-9 flex items-center justify-center active:scale-90 transition">
            <FiEdit3 size={17} className="text-white" />
          </button>
        </div>
        <div className="relative z-10 flex flex-col items-center text-center pt-4 pb-8">
          <div className="w-[86px] h-[86px] rounded-full flex items-center justify-center text-title font-bold text-white border-[3px] border-white/90 shadow-[0_8px_24px_rgba(0,0,0,0.18)]" style={{ background: 'rgba(255,255,255,0.18)' }}>
            {initials}
          </div>
          <h2 className="text-title font-bold text-white mt-3 leading-tight tracking-tight px-4">{user.fullName || 'User'}</h2>
          {user.email && <p className="text-body-sm text-white/75 mt-0.5 truncate max-w-[280px] px-4">{user.email}</p>}
        </div>
      </div>

      <div className="px-4 pt-5 relative z-20">
        <SectionTitle>Account</SectionTitle>
        <div className={card}>
          {accountItems.map((item, i) => {
            const Icon = item.icon
            return (
              <button key={item.label} onClick={() => navigate(item.to)} className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${press} ${i < accountItems.length - 1 ? 'border-b border-[#F1F3F7]' : ''}`}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(15,59,44,0.08)', color: PRIMARY }}>
                  <Icon size={17} />
                </div>
                <span className="flex-1 text-body-sm font-semibold" style={{ color: INK }}>{item.label}</span>
                <FiChevronRight size={18} className="text-[#9aa29e]" />
              </button>
            )
          })}
        </div>

        <SectionTitle>Personal Information</SectionTitle>
        <div className={card}>
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <span className="text-caption font-semibold" style={{ color: MUTED }}>Your details</span>
            <button onClick={openEdit} className="flex items-center gap-1 text-caption font-semibold" style={{ color: PRIMARY }}><FiEdit3 size={13} /> Edit</button>
          </div>
          {infoRows.map((r, i) => {
            const Icon = r.icon
            return (
              <div key={r.label} className={`flex items-center gap-3 px-4 py-3 ${i < infoRows.length - 1 ? 'border-b border-[#F1F3F7]' : ''}`}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(15,59,44,0.06)', color: PRIMARY }}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-micro" style={{ color: MUTED }}>{r.label}</p>
                  <p className={`text-body-sm font-semibold truncate ${r.missing ? 'text-[#9aa29e]' : ''}`} style={!r.missing ? { color: INK } : undefined}>{r.value}</p>
                </div>
              </div>
            )
          })}
        </div>

        <SectionTitle>Default Address</SectionTitle>
        <button onClick={() => navigate('/profile/addresses')} className={`${card} ${press} w-full text-left p-4 flex items-start gap-3`}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(15,59,44,0.08)', color: PRIMARY }}>
            <FiHome size={18} />
          </div>
          {defaultAddress ? (
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-caption font-bold px-2 py-0.5 rounded-full" style={{ background: '#dfe6cf', color: PRIMARY }}>{defaultAddress.addressType || 'Home'}</span>
                {defaultAddress.isDefault && <span className="text-micro font-semibold" style={{ color: '#059669' }}>Default</span>}
              </div>
              <p className="text-body-sm font-medium leading-snug" style={{ color: INK }}>
                {defaultAddress.addressLine1}{defaultAddress.addressLine2 ? `, ${defaultAddress.addressLine2}` : ''}
              </p>
              <p className="text-caption mt-0.5" style={{ color: MUTED }}>{defaultAddress.city}, {defaultAddress.state} – {defaultAddress.zipCode}</p>
            </div>
          ) : (
            <div className="flex-1">
              <p className="text-body-sm font-semibold" style={{ color: INK }}>No saved address</p>
              <p className="text-caption mt-0.5" style={{ color: MUTED }}>Add one to check out faster.</p>
            </div>
          )}
          <FiChevronRight size={18} className="text-[#9aa29e] mt-1" />
        </button>

        <SectionTitle>Security & Account</SectionTitle>
        <div className={card}>
          <button onClick={() => setChangingPw(true)} className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${press} border-b border-[#F1F3F7]`}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(15,59,44,0.08)', color: PRIMARY }}><FiKey size={16} /></div>
            <div className="flex-1"><p className="text-body-sm font-semibold" style={{ color: INK }}>Change Password</p><p className="text-micro" style={{ color: MUTED }}>Update your password</p></div>
            <FiChevronRight size={18} className="text-[#9aa29e]" />
          </button>
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#F1F3F7]">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(15,59,44,0.08)', color: PRIMARY }}><FiLock size={16} /></div>
            <div className="flex-1"><p className="text-body-sm font-semibold" style={{ color: INK }}>Two-Factor Authentication</p><p className="text-micro" style={{ color: MUTED }}>Coming soon</p></div>
            <Toggle on={false} disabled />
          </div>
          <button onClick={() => setShowDelete(true)} className={`w-full flex items-center gap-3 px-4 py-3.5 text-left ${press}`}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: '#FEF2F2', color: DANGER }}><FiAlertTriangle size={16} /></div>
            <div className="flex-1"><p className="text-body-sm font-semibold" style={{ color: DANGER }}>Delete Account</p><p className="text-micro" style={{ color: MUTED }}>Permanently remove your account</p></div>
            <FiChevronRight size={18} className="text-[#f3a493]" />
          </button>
        </div>

        <SectionTitle>Preferences</SectionTitle>
        <div className={card}>
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#F1F3F7]">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(15,59,44,0.08)', color: PRIMARY }}><FiBell size={16} /></div>
            <div className="flex-1"><p className="text-body-sm font-semibold" style={{ color: INK }}>Order Notifications</p><p className="text-micro" style={{ color: MUTED }}>Updates on orders and repairs</p></div>
            <Toggle on={prefs.orderUpdates} onChange={(v) => updatePref('orderUpdates', v)} />
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(15,59,44,0.08)', color: PRIMARY }}><FiSliders size={16} /></div>
            <div className="flex-1"><p className="text-body-sm font-semibold" style={{ color: INK }}>Offers & Promotions</p><p className="text-micro" style={{ color: MUTED }}>Deals and special offers</p></div>
            <Toggle on={prefs.promotions} onChange={(v) => updatePref('promotions', v)} />
          </div>
        </div>

        <button onClick={() => setShowLogout(true)} className={`${card} ${press} w-full flex items-center justify-center gap-2 mt-5 h-12 text-body-sm font-semibold`} style={{ color: DANGER }}>
          <FiLogOut size={17} /> Sign Out
        </button>
      </div>

      <Sheet open={showLogout} onClose={() => setShowLogout(false)}>
        <div className="w-12 h-1.5 rounded-full bg-[#ece9e2] mx-auto mb-4" />
        <h3 className="text-title-sm font-bold text-center" style={{ color: INK }}>Sign out?</h3>
        <p className="text-label text-center mt-1 mb-5" style={{ color: MUTED }}>You'll need to sign in again to access your account.</p>
        <button onClick={() => setShowLogout(false)} className="w-full h-12 rounded-[12px] text-body-sm font-semibold mb-3" style={{ background: '#F3F4F6', color: INK }}>Cancel</button>
        <button onClick={handleLogout} className="w-full h-12 rounded-[12px] text-body-sm font-semibold text-white" style={{ background: grad }}>Yes, Sign Out</button>
      </Sheet>

      <Sheet open={showDelete} onClose={() => setShowDelete(false)}>
        <div className="w-12 h-1.5 rounded-full bg-[#ece9e2] mx-auto mb-4" />
        <div className="flex items-center gap-2 justify-center mb-2">
          <FiAlertTriangle size={18} style={{ color: DANGER }} />
          <h3 className="text-title-sm font-bold" style={{ color: DANGER }}>Delete Account</h3>
        </div>
        <p className="text-label text-center mt-1 mb-5" style={{ color: MUTED }}>This action is permanent and cannot be undone.</p>
        <button onClick={() => setShowDelete(false)} className="w-full h-12 rounded-[12px] text-body-sm font-semibold mb-3" style={{ background: '#F3F4F6', color: INK }}>Cancel</button>
        <button onClick={handleDelete} disabled={deleting} className="w-full h-12 rounded-[12px] text-body-sm font-semibold text-white disabled:opacity-60" style={{ background: DANGER }}>
          {deleting ? 'Deleting…' : 'Delete Permanently'}
        </button>
      </Sheet>

      <Sheet open={editing} onClose={() => setEditing(false)}>
        <div className="w-12 h-1.5 rounded-full bg-[#ece9e2] mx-auto mb-4" />
        <h3 className="text-title-sm font-bold mb-4" style={{ color: INK }}>Edit Profile</h3>
        <div className="space-y-3">
          <Field label="Full Name"><input value={editForm.fullName} onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))} className="w-full h-11 px-3 rounded-xl bg-[#f7f6f2] border border-[#ece9e2] outline-none text-body-sm font-medium" style={{ color: INK }} /></Field>
          <Field label="Email"><input value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} className="w-full h-11 px-3 rounded-xl bg-[#f7f6f2] border border-[#ece9e2] outline-none text-body-sm font-medium" style={{ color: INK }} /></Field>
          <Field label="Phone Number"><input value={editForm.mobile} onChange={(e) => setEditForm((f) => ({ ...f, mobile: e.target.value }))} className="w-full h-11 px-3 rounded-xl bg-[#f7f6f2] border border-[#ece9e2] outline-none text-body-sm font-medium" style={{ color: INK }} /></Field>
        </div>
        <button onClick={() => setEditing(false)} className="w-full h-12 rounded-[12px] text-body-sm font-semibold mt-5 mb-3" style={{ background: '#F3F4F6', color: INK }}>Cancel</button>
        <button onClick={handleSaveProfile} disabled={saving} className={`w-full h-12 rounded-[12px] text-body-sm font-semibold text-white disabled:opacity-60 ${press}`} style={{ background: grad }}>{saving ? 'Saving…' : 'Save Changes'}</button>
      </Sheet>

      <Sheet open={changingPw} onClose={() => { setChangingPw(false); setPwError('') }}>
        <div className="w-12 h-1.5 rounded-full bg-[#ece9e2] mx-auto mb-4" />
        <h3 className="text-title-sm font-bold mb-4" style={{ color: INK }}>Change Password</h3>
        <div className="space-y-3">
          <Field label="Current Password"><input type="password" value={pwForm.oldPassword} onChange={(e) => setPwForm((f) => ({ ...f, oldPassword: e.target.value }))} className="w-full h-11 px-3 rounded-xl bg-[#f7f6f2] border border-[#ece9e2] outline-none text-body-sm" style={{ color: INK }} /></Field>
          <Field label="New Password"><input type="password" value={pwForm.newPassword} onChange={(e) => setPwForm((f) => ({ ...f, newPassword: e.target.value }))} className="w-full h-11 px-3 rounded-xl bg-[#f7f6f2] border border-[#ece9e2] outline-none text-body-sm" style={{ color: INK }} /></Field>
          <Field label="Confirm New Password"><input type="password" value={pwForm.confirmPassword} onChange={(e) => setPwForm((f) => ({ ...f, confirmPassword: e.target.value }))} className="w-full h-11 px-3 rounded-xl bg-[#f7f6f2] border border-[#ece9e2] outline-none text-body-sm" style={{ color: INK }} /></Field>
          {pwError && <p className="text-caption font-medium" style={{ color: DANGER }}>{pwError}</p>}
        </div>
        <button onClick={() => { setChangingPw(false); setPwError('') }} className="w-full h-12 rounded-[12px] text-body-sm font-semibold mt-5 mb-3" style={{ background: '#F3F4F6', color: INK }}>Cancel</button>
        <button onClick={savePassword} disabled={pwSaving} className={`w-full h-12 rounded-[12px] text-body-sm font-semibold text-white disabled:opacity-60 ${press}`} style={{ background: grad }}>{pwSaving ? 'Updating…' : 'Update Password'}</button>
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
      <p className="text-caption font-semibold mb-1.5 px-0.5" style={{ color: MUTED }}>{label}</p>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-title-sm font-semibold mt-6 mb-2.5 px-0.5" style={{ color: INK }}>{children}</h2>
}

function Toggle({ on, onChange, disabled }: { on: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={on} disabled={disabled} onClick={() => onChange?.(!on)}
      className={`relative w-11 h-6 rounded-full transition ${on ? '' : 'bg-[#D1D5DB]'} ${disabled ? 'opacity-50' : ''}`} style={on ? { background: PRIMARY } : undefined}>
      <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
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
