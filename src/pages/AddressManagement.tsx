import { useState, useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  FiPlus, FiEdit2, FiTrash2, FiChevronRight, FiHome,
  FiMapPin, FiPhone, FiStar, FiX, FiCheck, FiLoader, FiAlertCircle,
} from 'react-icons/fi'
import { Home, Briefcase, MapPin } from 'lucide-react'
import { addressService, type AddressData } from '../services/addressService'
import StorefrontNavbar from '../components/ecommerce/StorefrontNavbar'
import MobileAddressManagement from '../components/mobile/MobileAddressManagement'
import { useIsMobile } from '../components/mobile/helpers'
import { useLockBodyScroll } from '../hooks/useLockBodyScroll'

const emptyForm: Omit<AddressData, 'id' | 'createdAt' | 'updatedAt'> = {
  fullName: '',
  mobile: '',
  alternateMobile: '',
  addressLine1: '',
  addressLine2: '',
  landmark: '',
  country: 'India',
  state: '',
  city: '',
  zipCode: '',
  addressType: 'Home',
  isDefault: false,
}

const typeIcons: Record<string, ReactNode> = {
  Home: <Home size={14} />,
  Office: <Briefcase size={14} />,
  Other: <MapPin size={14} />,
}

export default function AddressManagement() {
  const isMobile = useIsMobile()
  if (isMobile) return <MobileAddressManagement />
  const [addresses, setAddresses] = useState<AddressData[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<AddressData | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)

  useLockBodyScroll(modalOpen)

  useEffect(() => {
    let mounted = true
    addressService.list()
      .then(data => { if (mounted) setAddresses(data) })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const openAdd = () => {
    setEditing(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (addr: AddressData) => {
    setEditing(addr)
    setForm({
      fullName: addr.fullName,
      mobile: addr.mobile,
      alternateMobile: addr.alternateMobile || '',
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      landmark: addr.landmark || '',
      country: addr.country,
      state: addr.state,
      city: addr.city,
      zipCode: addr.zipCode,
      addressType: addr.addressType,
      isDefault: addr.isDefault,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (editing && editing.id) {
        const updated = await addressService.update(editing.id, form)
        setAddresses(prev => prev.map(a => a.id === editing.id ? updated : a))
      } else {
        const created = await addressService.create(form)
        setAddresses(prev => [...prev, created])
      }
      setModalOpen(false)
    } catch { /* ignore */ }
    setSaving(false)
  }

  const handleDelete = async (id: number | undefined) => {
    if (id == null) return
    const numId = Number(id)
    setDeleting(numId)
    await addressService.delete(numId)
    setAddresses(prev => prev.filter(a => Number(a.id) !== numId))
    setDeleting(null)
  }

  const handleSetDefault = async (id: number | undefined) => {
    if (id == null) return
    const numId = Number(id)
    try {
      const updated = await addressService.setDefault(numId)
      setAddresses(prev => prev.map(a => Number(a.id) === numId ? updated : { ...a, isDefault: false }))
    } catch { /* ignore */ }
  }

  return (
      <div className="min-h-screen bg-[#F8F6F2] pt-28">
      <StorefrontNavbar activeLabel="Home" />

      <div className="relative pt-6 pb-20">
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-60 -right-60 w-[500px] h-[500px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #CB202D 0%, transparent 70%)' }} />
          <div className="absolute -bottom-60 -left-60 w-[400px] h-[400px] rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, #A81D2A 0%, transparent 70%)' }} />
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.05, 0.1, 0.05] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
            style={{ background: 'radial-gradient(circle, #CB202D 0%, transparent 70%)' }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 lg:px-6">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-xs mb-6 pt-4 text-[#6B7280]"
          >
            <Link to="/" className="hover:text-[#A81D2A] transition-colors">
              <FiHome size={12} className="inline mr-1" />Home
            </Link>
            <FiChevronRight size={10} />
            <span className="hover:text-[#A81D2A] transition-colors">Profile</span>
            <FiChevronRight size={10} />
            <span className="text-[#2D2118]">Addresses</span>
          </motion.div>

          {/* Header */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
            className="flex items-center justify-between mb-8"
          >
            <motion.div
              variants={{ hidden: { opacity: 0, x: -16 }, visible: { opacity: 1, x: 0 } }}
            >
              <h1 className="text-3xl lg:text-4xl font-extrabold text-[#2D2118] flex items-center gap-3">
                Manage Addresses
              </h1>
              <p className="text-sm mt-1 text-[#6B7280]">
                Manage your saved delivery addresses
              </p>
            </motion.div>
            <motion.button
              variants={{ hidden: { opacity: 0, x: 16, scale: 0.95 }, visible: { opacity: 1, x: 0, scale: 1 } }}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={openAdd}
              className="flex items-center gap-2 px-5 h-11 rounded-xl text-sm font-bold transition-all cursor-pointer"
              style={{
                background: 'linear-gradient(135deg, #CB202D, #A81D2A)',
                color: 'white',
                boxShadow: '0 4px 16px rgba(203,32,45,0.3)',
              }}
            >
              <FiPlus size={16} /> Add New Address
            </motion.button>
          </motion.div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <FiLoader size={32} className="animate-spin" style={{ color: '#A81D2A' }} />
            </div>
          ) : addresses.length === 0 ? (
            <EmptyAddressState onAdd={openAdd} />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              <AnimatePresence mode="popLayout">
                {addresses.map((addr, i) => (
                  <AddressCard
                    key={addr.id}
                    addr={addr}
                    index={i}
                    onEdit={() => openEdit(addr)}
                    onDelete={() => handleDelete(addr.id)}
                    onSetDefault={() => addr.id && handleSetDefault(addr.id)}
                    deleting={deleting === addr.id}
                  />
                ))}
              </AnimatePresence>
              {/* Add card */}
              <motion.button
                initial={{ opacity: 0, scale: 0.93, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: addresses.length * 0.05 + 0.15, type: 'spring', stiffness: 200, damping: 22 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={openAdd}
                className="group rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-3 h-64 transition-all duration-300 cursor-pointer"
                style={{
                  borderColor: 'rgba(203,32,45,0.2)',
                  background: '#F9FAFB',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(203,32,45,0.5)'; e.currentTarget.style.background = 'rgba(203,32,45,0.05)' }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(203,32,45,0.2)'; e.currentTarget.style.background = '#F9FAFB' }}
              >
                <motion.div
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(203,32,45,0.15)' }}
                >
                  <FiPlus size={22} style={{ color: '#A81D2A' }} />
                </motion.div>
                <span className="text-sm font-semibold text-[#6B7280] group-hover:text-emerald-600 transition-colors">
                  Add New Address
                </span>
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Address Form Modal */}
      <AnimatePresence>
        {modalOpen && (
          <AddressFormModal
            form={form}
            setForm={setForm}
            editing={editing}
            saving={saving}
            onSave={handleSave}
            onClose={() => setModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function EmptyAddressState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
        className="relative w-32 h-32 rounded-3xl mb-8 flex items-center justify-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(203,32,45,0.1), rgba(168,29,42,0.1))',
          border: '1px solid rgba(203,32,45,0.15)',
        }}
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0"
          style={{ background: 'radial-gradient(circle at 50% 50%, rgba(203,32,45,0.15), transparent 70%)' }}
        />
        <FiMapPin size={48} style={{ color: 'rgba(168,29,42,0.4)' }} />
      </motion.div>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold text-[#2D2118] mb-3"
      >
        No saved addresses
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="text-sm mb-8 text-[#6B7280]"
      >
        Add your first delivery address to get started
      </motion.p>
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onAdd}
        className="flex items-center gap-2 px-8 h-12 rounded-2xl text-sm font-bold transition-all cursor-pointer"
        style={{
          background: 'linear-gradient(135deg, #CB202D, #A81D2A)',
          color: 'white',
          boxShadow: '0 8px 32px rgba(203,32,45,0.3)',
        }}
      >
        <FiPlus size={18} /> Add New Address
      </motion.button>
    </motion.div>
  )
}

function AddressCard({ addr, index, onEdit, onDelete, onSetDefault, deleting }: {
  addr: AddressData; index: number; onEdit: () => void; onDelete: () => void; onSetDefault: () => void; deleting: boolean
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      transition={{ delay: index * 0.05, type: 'spring', stiffness: 250, damping: 24 }}
      whileHover={{ y: -3 }}
      className="group relative rounded-3xl overflow-hidden transition-all duration-500 cursor-pointer"
      style={{
        background: addr.isDefault
          ? 'linear-gradient(135deg, rgba(203,32,45,0.08), rgba(168,29,42,0.05))'
          : '#ffffff',
        border: addr.isDefault
          ? '1px solid rgba(203,32,45,0.3)'
          : '1px solid #E5E7EB',
        boxShadow: addr.isDefault
          ? '0 8px 24px rgba(203,32,45,0.12)'
          : '0 2px 12px rgba(0,0,0,0.05)',
      }}
      onMouseEnter={(e) => {
        if (!addr.isDefault) {
          e.currentTarget.style.borderColor = 'rgba(203,32,45,0.3)'
          e.currentTarget.style.background = '#F9FAFB'
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(203,32,45,0.08)'
        }
      }}
      onMouseLeave={(e) => {
        if (!addr.isDefault) {
          e.currentTarget.style.borderColor = '#E5E7EB'
          e.currentTarget.style.background = '#ffffff'
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.05)'
        }
      }}
    >
      {addr.isDefault && (
        <motion.div
          animate={{ scale: [1, 1.02, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{
            background: 'linear-gradient(135deg, rgba(203,32,45,0.04), transparent, rgba(168,29,42,0.04))',
            zIndex: 0,
          }}
        />
      )}
      <div className="p-5 relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: addr.addressType === 'Home'
                  ? 'linear-gradient(135deg, rgba(203,32,45,0.2), rgba(168,29,42,0.2))'
                  : addr.addressType === 'Office'
                    ? 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(14,165,233,0.2))'
                    : 'linear-gradient(135deg, rgba(203,32,45,0.2), rgba(16,185,129,0.2))',
              }}
            >
              {typeIcons[addr.addressType] || <MapPin size={14} style={{ color: '#A81D2A' }} />}
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-[#2D2118]">{addr.fullName}</h3>
                {addr.isDefault && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, #CB202D, #A81D2A)',
                      color: 'white',
                    }}
                  >DEFAULT</motion.span>
                )}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <FiPhone size={10} className="text-[#6B7280]" />
                <span className="text-xs text-[#6B7280]">{addr.mobile}</span>
              </div>
            </div>
          </div>
          <motion.span
            whileHover={{ scale: 1.05 }}
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0"
            style={{
              background: addr.addressType === 'Home'
                ? 'rgba(203,32,45,0.15)'
                : addr.addressType === 'Office'
                  ? 'rgba(6,182,212,0.15)'
                  : 'rgba(203,32,45,0.15)',
              color: addr.addressType === 'Home'
                ? '#A81D2A'
                : addr.addressType === 'Office'
                  ? '#22d3ee'
                  : '#34d399',
            }}
          >
            {addr.addressType}
          </motion.span>
        </div>

        <div className="space-y-1 mb-4 text-[#6B7280]">
          <p className="text-sm leading-relaxed">{addr.addressLine1}</p>
          {addr.addressLine2 && <p className="text-sm">{addr.addressLine2}</p>}
          {addr.landmark && <p className="text-sm">Landmark: {addr.landmark}</p>}
          <p className="text-sm">
            {addr.city}, {addr.state} - {addr.zipCode}
          </p>
          <p className="text-sm">{addr.country}</p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            {!addr.isDefault && (
              <motion.button
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onSetDefault}
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-[11px] font-medium transition-all cursor-pointer"
                style={{
                  background: 'rgba(203,32,45,0.1)',
                  color: 'rgba(168,29,42,0.7)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(203,32,45,0.2)'; e.currentTarget.style.color = 'rgba(168,29,42,0.9)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(203,32,45,0.1)'; e.currentTarget.style.color = 'rgba(168,29,42,0.7)' }}
              >
                <FiStar size={11} /> Set Default
              </motion.button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <motion.button
              whileHover={{ scale: 1.1, y: -1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onEdit}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
              style={{
                background: 'rgba(6,182,212,0.1)',
                color: 'rgba(6,182,212,0.6)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(6,182,212,0.2)'; e.currentTarget.style.color = 'rgba(6,182,212,0.9)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(6,182,212,0.1)'; e.currentTarget.style.color = 'rgba(6,182,212,0.6)' }}
            >
              <FiEdit2 size={12} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1, y: -1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onDelete}
              disabled={deleting}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
              style={{
                background: 'rgba(239,68,68,0.1)',
                color: deleting ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.6)',
              }}
              onMouseEnter={(e) => { if (!deleting) { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = 'rgba(239,68,68,0.9)' } }}
              onMouseLeave={(e) => { if (!deleting) { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = 'rgba(239,68,68,0.6)' } }}
            >
              {deleting ? <FiLoader size={12} className="animate-spin" /> : <FiTrash2 size={12} />}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function validateMobile(v: string): string {
  const digits = v.replace(/\D/g, '').slice(0, 10)
  if (digits.length < 10) return 'Enter exactly 10 digits'
  return ''
}

function validateForm(form: Omit<AddressData, 'id' | 'createdAt' | 'updatedAt'>): Record<string, string> {
  const errs: Record<string, string> = {}
  if (!form.fullName.trim()) errs.fullName = 'Required'
  const mobileErr = validateMobile(form.mobile)
  if (mobileErr) errs.mobile = mobileErr
  if (form.alternateMobile && form.alternateMobile.replace(/\D/g, '').length > 0) {
    const altErr = validateMobile(form.alternateMobile)
    if (altErr) errs.alternateMobile = 'Enter exactly 10 digits'
  }
  if (!form.addressLine1.trim()) errs.addressLine1 = 'Required'
  if (!form.city.trim()) errs.city = 'Required'
  if (!form.state.trim()) errs.state = 'Required'
  if (!form.zipCode.trim()) errs.zipCode = 'Required'
  else if (!/^\d{5,6}$/.test(form.zipCode.replace(/\D/g, ''))) errs.zipCode = 'Enter 5-6 digits'
  return errs
}

function AddressFormModal({ form, setForm, editing, saving, onSave, onClose }: {
  form: Omit<AddressData, 'id' | 'createdAt' | 'updatedAt'>
  setForm: React.Dispatch<React.SetStateAction<typeof form>>
  editing: AddressData | null
  saving: boolean
  onSave: () => void
  onClose: () => void
}) {
  const [errors, setErrors] = useState<Record<string, string>>({})

  const update = (k: keyof typeof form, v: string | boolean) => {
    if (k === 'mobile' || k === 'alternateMobile') {
      v = (v as string).replace(/\D/g, '').slice(0, 10)
    }
    if (k === 'zipCode') {
      v = (v as string).replace(/\D/g, '').slice(0, 6)
    }
    setForm(prev => ({ ...prev, [k]: v }))
    if (errors[k]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[k]
        return next
      })
    }
  }

  const handleSave = () => {
    const errs = validateForm(form)
    setErrors(errs)
    if (Object.keys(errs).length === 0) onSave()
  }

  const isValid = Object.keys(errors).length === 0
    && form.fullName.trim()
    && /^\d{10}$/.test(form.mobile.replace(/\D/g, ''))
    && form.addressLine1.trim()
    && form.city.trim()
    && form.state.trim()
    && /^\d{5,6}$/.test(form.zipCode.replace(/\D/g, ''))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 30 }}
        transition={{ type: 'spring', stiffness: 350, damping: 26 }}
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl"
        style={{
          background: '#ffffff',
          border: '1px solid #E5E7EB',
          boxShadow: '0 24px 80px rgba(0,0,0,0.15), 0 0 60px rgba(203,32,45,0.04)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="sticky top-0 z-10 flex items-center justify-between p-5 border-b"
          style={{
            background: '#ffffff',
            borderColor: '#E5E7EB',
          }}
        >
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, delay: 0.15 }}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(203,32,45,0.2), rgba(168,29,42,0.2))' }}
            >
              <FiMapPin size={16} style={{ color: '#A81D2A' }} />
            </motion.div>
            <h2 className="text-lg font-bold text-[#2D2118]">
              {editing ? 'Edit Address' : 'Add New Address'}
            </h2>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer"
            style={{ background: '#F3F4F6', color: '#6B7280' }}
          >
            <FiX size={18} />
          </motion.button>
        </motion.div>

        <motion.div
          className="p-5 space-y-4"
          initial="hidden"
          animate="visible"
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.03 } } }}
        >
          {/* Name + Mobile */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
            className="grid sm:grid-cols-2 gap-4"
          >
            <FormField label="Full Name" value={form.fullName} onChange={v => update('fullName', v)} placeholder="John Doe" error={errors.fullName} />
            <FormField label="Mobile Number" value={form.mobile} onChange={v => update('mobile', v)} placeholder="9876543210" type="tel" error={errors.mobile} />
          </motion.div>

          {/* Alternate Mobile */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
          >
            <FormField label="Alternate Mobile (optional)" value={form.alternateMobile || ''} onChange={v => update('alternateMobile', v)} placeholder="9876543210" type="tel" error={errors.alternateMobile} />
          </motion.div>

          {/* Address Line 1 */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
          >
            <FormField label="Address Line 1" value={form.addressLine1} onChange={v => update('addressLine1', v)} placeholder="House/Flat No., Street, Area" error={errors.addressLine1} />
          </motion.div>

          {/* Address Line 2 */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
          >
            <FormField label="Apartment / Suite (optional)" value={form.addressLine2 || ''} onChange={v => update('addressLine2', v)} placeholder="Building name, floor, etc." />
          </motion.div>

          {/* Landmark */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
          >
            <FormField label="Landmark (optional)" value={form.landmark || ''} onChange={v => update('landmark', v)} placeholder="Near school, mall, station..." />
          </motion.div>

          {/* Country + State + City */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
            className="grid sm:grid-cols-3 gap-4"
          >
            <FormField label="Country" value={form.country} onChange={v => update('country', v)} placeholder="India" />
            <FormField label="State" value={form.state} onChange={v => update('state', v)} placeholder="Karnataka" error={errors.state} />
            <FormField label="City" value={form.city} onChange={v => update('city', v)} placeholder="Bangalore" error={errors.city} />
          </motion.div>

          {/* ZIP */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
            className="grid sm:grid-cols-2 gap-4"
          >
            <FormField label="ZIP Code" value={form.zipCode} onChange={v => update('zipCode', v)} placeholder="560001" error={errors.zipCode} />
          </motion.div>

          {/* Address Type */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
          >
            <label className="block text-xs font-semibold mb-2 text-[#6B7280]">
              Address Type
            </label>
            <div className="flex gap-2">
              {(['Home', 'Office', 'Other'] as const).map(type => (
                <motion.button
                  key={type}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => update('addressType', type)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  style={{
                    background: form.addressType === type
                      ? 'linear-gradient(135deg, #CB202D, #A81D2A)'
                      : '#F3F4F6',
                    border: form.addressType === type
                      ? '1px solid transparent'
                      : '1px solid #E5E7EB',
                    color: form.addressType === type ? 'white' : '#6B7280',
                    boxShadow: form.addressType === type ? '0 4px 12px rgba(203,32,45,0.25)' : 'none',
                  }}
                >
                  {typeIcons[type]}
                  {type}
                  {form.addressType === type && <FiCheck size={12} />}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Default checkbox */}
          <motion.div
            variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
          >
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
              style={{
                background: form.isDefault ? 'linear-gradient(135deg, #CB202D, #A81D2A)' : '#ffffff',
                border: form.isDefault ? '1px solid transparent' : '1px solid #D1D5DB',
              }}
              onClick={() => update('isDefault', !form.isDefault)}
            >
              {form.isDefault && <FiCheck size={12} className="text-white" />}
            </div>
            <span className="text-sm text-[#6B7280]">Set as default address</span>
          </label>
        </motion.div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3 p-5 border-t"
          style={{ borderColor: '#E5E7EB' }}
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="flex-1 h-12 rounded-xl text-sm font-semibold transition-all cursor-pointer"
            style={{
              background: '#F3F4F6',
              border: '1px solid #E5E7EB',
              color: '#6B7280',
            }}
          >
            Cancel
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving || !isValid}
            className="flex-1 h-12 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
            style={{
              background: 'linear-gradient(135deg, #CB202D, #A81D2A)',
              color: 'white',
              boxShadow: '0 4px 16px rgba(203,32,45,0.3)',
              opacity: saving || !isValid ? 0.5 : 1,
            }}
          >
            {saving ? <FiLoader size={16} className="animate-spin" /> : <FiCheck size={16} />}
            {saving ? 'Saving...' : 'Save Address'}
          </motion.button>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

function FormField({ label, value, onChange, placeholder, type = 'text', error }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; error?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 text-[#6B7280]">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 px-4 rounded-xl text-sm outline-none transition-all"
        style={{
          background: '#ffffff',
          border: `1px solid ${error ? '#EF4444' : '#D1D5DB'}`,
          color: '#2D2118',
          boxShadow: error ? '0 0 12px rgba(239,68,68,0.1)' : 'none',
        }}
        onFocus={(e) => { e.target.style.borderColor = error ? '#EF4444' : '#CB202D'; e.target.style.boxShadow = error ? '0 0 20px rgba(239,68,68,0.12)' : '0 0 20px rgba(203,32,45,0.08)' }}
        onBlur={(e) => { e.target.style.borderColor = error ? '#EF4444' : '#D1D5DB'; e.target.style.boxShadow = error ? '0 0 12px rgba(239,68,68,0.1)' : 'none' }}
      />
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] mt-1 flex items-center gap-1"
          style={{ color: 'rgba(239,68,68,0.7)' }}
        >
          <FiAlertCircle size={10} /> {error}
        </motion.p>
      )}
    </div>
  )
}
