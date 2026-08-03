import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FiUser, FiMail, FiPhone, FiCalendar, FiTrash2, FiAlertCircle, FiLoader } from 'react-icons/fi'
import EcommerceFooter from '../components/ecommerce/Footer'
import { authService, type UserProfile } from '../services/authService'
import { useToast } from '../context/ToastContext'
import MobileProfile from '../components/mobile/MobileProfile'
import { useIsMobile } from '../components/mobile/helpers'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'

export default function ProfilePage() {
  const isMobile = useIsMobile()
  if (isMobile) return <MobileProfile />
  const navigate = useNavigate()
  const showToast = useToast().show
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      setLoading(false)
      return
    }
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

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await authService.deleteAccount()
      showToast('Account deleted successfully.', 'success')
      navigate('/')
    } catch {
      showToast('Failed to delete account. Please try again.', 'error')
    }
    setDeleting(false)
    setShowConfirm(false)
  }

  if (!authService.isAuthenticated()) {
    return (
      <div className="min-h-screen" style={{ background: '#f8f9fa' }}>
        <SiteTopNav />
        <div className="flex flex-col items-center justify-center pt-40 pb-20 text-center px-4">
          <span className="material-symbols-outlined text-6xl mb-4" style={{ color: 'rgba(59,75,61,0.3)' }}>person_off</span>
          <h2 className="text-2xl font-bold text-[#191c1d] mb-2">Not Logged In</h2>
          <p className="text-sm mb-6" style={{ color: 'rgba(59,75,61,0.7)' }}>Please log in to view your profile.</p>
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 text-sm font-semibold text-white rounded-full transition-all duration-300 hover:scale-105 cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #CB202D, #A81D2A)',
              boxShadow: '0 4px 15px rgba(203,32,45,0.35)',
            }}
          >
            Go to Login
          </button>
        </div>
        <EcommerceFooter />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#f8f9fa' }}>
        <SiteTopNav />
        <div className="flex items-center justify-center pt-40 pb-20">
          <FiLoader className="animate-spin" size={32} style={{ color: '#A81D2A' }} />
        </div>
        <EcommerceFooter />
      </div>
    )
  }

  const user = profile || { id: 0, email: '', fullName: 'User' }

  return (
    <div className="min-h-screen" style={{ background: '#f8f9fa' }}>
      <SiteTopNav />

      <div className="max-w-2xl mx-auto px-4 pt-28 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(168,29,42,0.05)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex flex-col items-center text-center mb-8">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
              style={{
                background: 'linear-gradient(135deg, rgba(255,90,101,0.15), rgba(168,29,42,0.08))',
                border: '2px solid rgba(255,90,101,0.25)',
              }}
            >
              <FiUser size={32} style={{ color: '#A81D2A' }} />
            </div>
            <h1 className="text-2xl font-bold text-[#191c1d]">{user.fullName}</h1>
            {user.email && <p className="text-sm mt-1" style={{ color: 'rgba(59,75,61,0.7)' }}>{user.email}</p>}
          </div>

          <div className="space-y-4 mb-8">
            <div
              className="flex items-center gap-4 p-4 rounded-xl"
              style={{ background: 'rgba(237,238,239,0.5)', border: '1px solid rgba(185,203,185,0.2)' }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,90,101,0.1)' }}>
                <FiUser size={18} style={{ color: '#A81D2A' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: 'rgba(59,75,61,0.5)' }}>Full Name</p>
                <p className="text-sm font-semibold text-[#191c1d]">{user.fullName || '-'}</p>
              </div>
            </div>

            <div
              className="flex items-center gap-4 p-4 rounded-xl"
              style={{ background: 'rgba(237,238,239,0.5)', border: '1px solid rgba(185,203,185,0.2)' }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,90,101,0.1)' }}>
                <FiMail size={18} style={{ color: '#A81D2A' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs" style={{ color: 'rgba(59,75,61,0.5)' }}>Email</p>
                <p className="text-sm font-semibold text-[#191c1d]">{user.email || '-'}</p>
              </div>
            </div>

            {user.mobile && (
              <div
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: 'rgba(237,238,239,0.5)', border: '1px solid rgba(185,203,185,0.2)' }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,90,101,0.1)' }}>
                  <FiPhone size={18} style={{ color: '#A81D2A' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs" style={{ color: 'rgba(59,75,61,0.5)' }}>Mobile</p>
                  <p className="text-sm font-semibold text-[#191c1d]">{user.mobile}</p>
                </div>
              </div>
            )}

            {user.dateJoined && (
              <div
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: 'rgba(237,238,239,0.5)', border: '1px solid rgba(185,203,185,0.2)' }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,90,101,0.1)' }}>
                  <FiCalendar size={18} style={{ color: '#A81D2A' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs" style={{ color: 'rgba(59,75,61,0.5)' }}>Member Since</p>
                  <p className="text-sm font-semibold text-[#191c1d]">{new Date(user.dateJoined).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
              </div>
            )}
          </div>

          <div className="h-px mb-6" style={{ background: 'rgba(185,203,185,0.3)' }} />

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold rounded-full transition-all duration-300 hover:scale-[1.02] cursor-pointer"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#ef4444',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)' }}
            >
              <FiTrash2 size={16} />
              Delete Account
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl"
              style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)' }}
            >
              <div className="flex items-start gap-3 mb-4">
                <FiAlertCircle size={20} style={{ color: '#ef4444', marginTop: 2 }} />
                <div>
                  <p className="text-sm font-bold text-[#191c1d]">Are you sure?</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(59,75,61,0.7)' }}>
                    This action is permanent and cannot be undone. All your data will be removed.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold rounded-full transition-all duration-300 cursor-pointer"
                  style={{
                    background: 'rgba(237,238,239,0.8)',
                    color: '#191c1d',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(237,238,239,1)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(237,238,239,0.8)' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 text-sm font-semibold text-white rounded-full transition-all duration-300 cursor-pointer disabled:opacity-60"
                  style={{ background: '#ef4444' }}
                  onMouseEnter={e => { if (!deleting) e.currentTarget.style.background = '#dc2626' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#ef4444' }}
                >
                  {deleting ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      <EcommerceFooter />
    </div>
  )
}
