import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { addressService, type AddressData } from '../services/addressService'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import '../components/ecommerce/SiteTopNav.css'
import MobileAddressManagement from '../components/mobile/MobileAddressManagement'
import { useIsMobile } from '../components/mobile/helpers'

const typeIcons: Record<string, React.ReactNode> = {
  Home: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>,
  Office: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>,
  Other: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s7-6.2 7-11.2A7 7 0 105 9.8C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/></svg>,
}

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

function formatPhone(p: string) {
  const d = p.replace(/\D/g, '')
  if (d.length === 10) return `${d.slice(0,5)} ${d.slice(5)}`
  return p
}

export default function AddressManagement() {
  const isMobile = useIsMobile()
  if (isMobile) return <MobileAddressManagement />

  const [addresses, setAddresses] = useState<AddressData[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editing, setEditing] = useState<AddressData | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    let mounted = true
    addressService.list()
      .then(data => { if (mounted) setAddresses(data) })
      .catch(() => {})
      .finally(() => { if (mounted) setLoading(false) })
    return () => { mounted = false }
  }, [])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2200)
  }

  const openAdd = () => { setEditing(null); setForm(emptyForm); setFormOpen(true) }

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
    setFormOpen(true)
  }

  const handleSave = async () => {
    if (!form.fullName.trim() || !form.mobile.trim() || !form.addressLine1.trim() || !form.city.trim() || !form.state.trim() || !form.zipCode.trim()) return
    setSaving(true)
    try {
      if (editing && editing.id) {
        const updated = await addressService.update(editing.id, form)
        setAddresses(prev => prev.map(a => a.id === editing.id ? updated : a))
        showToast('Address updated')
      } else {
        const created = await addressService.create(form)
        setAddresses(prev => [...prev, created])
        showToast('Address added')
      }
      setFormOpen(false)
    } catch { showToast('Failed to save address') }
    setSaving(false)
  }

  const handleDelete = async () => {
    if (deletingId == null) return
    const numId = Number(deletingId)
    try {
      await addressService.delete(numId)
      const wasDefault = addresses.find(a => Number(a.id) === numId)?.isDefault
      setAddresses(prev => {
        const next = prev.filter(a => Number(a.id) !== numId)
        if (wasDefault && next.length > 0) next[0].isDefault = true
        return next
      })
      showToast('Address removed')
    } catch { showToast('Failed to delete address') }
    setConfirmOpen(false)
    setDeletingId(null)
  }

  const handleSetDefault = async (id: number | undefined) => {
    if (id == null) return
    const numId = Number(id)
    try {
      const updated = await addressService.setDefault(numId)
      setAddresses(prev => prev.map(a => Number(a.id) === numId ? updated : { ...a, isDefault: false }))
      showToast('Default address updated')
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <>
        <SiteTopNav />
        <div className="min-h-screen flex items-center justify-center" style={{ background: '#FCFAFA' }}>
          <div className="text-center">
            <div className="w-10 h-10 rounded-full border-3 border-t-transparent animate-spin mx-auto mb-3" style={{ borderColor: '#EAE5E6', borderTopColor: '#D2172E' }} />
            <p className="text-sm" style={{ color: '#837E88' }}>Loading your addresses...</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: '#FCFAFA' }}>
      <style>{`
        .addr-pulse-rail{height:5px;width:100%;background:linear-gradient(90deg,#9C0F22,#F03049 45%,#D2172E 55%,#9C0F22);background-size:220% 100%;animation:railmove 6s ease-in-out infinite;position:sticky;top:0;z-index:60;}
        @keyframes railmove{0%,100%{background-position:0% 0}50%{background-position:100% 0}}
        .addr-bg-wash{position:fixed;inset:0;z-index:-1;background:radial-gradient(700px 340px at 88% -8%,#FCEDEE 0%,transparent 65%),radial-gradient(500px 280px at 4% 30%,#FBF0F1 0%,transparent 60%),#FCFAFA;}
        .addr-shell{max-width:1180px;margin:0 auto;padding:0 32px;}
        .addr-crumb{display:flex;align-items:center;gap:8px;padding:28px 0 0;font-size:13px;color:#837E88;font-weight:500;}
        .addr-crumb a{color:#837E88;text-decoration:none;display:flex;align-items:center;gap:6px;transition:color .15s;}
        .addr-crumb a:hover{color:#9C0F22;}
        .addr-crumb svg{width:14px;height:14px;}
        .addr-crumb .sep{color:#D8D2D5;}
        .addr-crumb .current{color:#17151A;font-weight:600;}
        .addr-page-head{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;padding:14px 0 30px;border-bottom:1px solid #EAE5E6;margin-bottom:30px;}
        .addr-title{font-family:'Big Shoulders Display',sans-serif;font-weight:800;font-size:clamp(30px,4vw,42px);letter-spacing:-0.01em;text-transform:uppercase;margin:0 0 6px;}
        .addr-sub{margin:0;color:#4A4750;font-size:14.5px;}
        .addr-btn{display:inline-flex;align-items:center;gap:9px;font-weight:700;font-size:14px;padding:13px 22px;border-radius:11px;border:none;cursor:pointer;transition:transform .15s,box-shadow .15s,background .15s;}
        .addr-btn svg{width:16px;height:16px;}
        .addr-btn-primary{background:linear-gradient(180deg,#F03049,#D2172E);color:#fff;box-shadow:0 10px 22px -10px rgba(210,23,46,0.55);}
        .addr-btn-primary:hover{transform:translateY(-1px);box-shadow:0 14px 26px -10px rgba(210,23,46,0.62);}
        .addr-btn-ghost{background:#fff;color:#4A4750;border:1px solid #EAE5E6;}
        .addr-btn-ghost:hover{border-color:#D2172E;color:#9C0F22;}
        .addr-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;padding-bottom:80px;}
        .addr-card{position:relative;background:#fff;border:1px solid #EAE5E6;border-radius:16px;padding:22px 22px 18px;box-shadow:0 1px 2px rgba(23,21,26,0.04),0 12px 28px -14px rgba(23,21,26,0.18);transition:transform .18s,box-shadow .18s,border-color .18s;}
        .addr-card:hover{transform:translateY(-2px);box-shadow:0 4px 10px rgba(23,21,26,0.05),0 20px 38px -18px rgba(210,23,46,0.24);}
        .addr-card.is-default{background:linear-gradient(155deg,#FCEDEE 0%,#FDF6F6 55%);border-color:#F0DEE0;}
        .addr-card.is-default::before{content:"";position:absolute;left:0;top:18px;bottom:18px;width:3px;background:#D2172E;border-radius:0 3px 3px 0;}
        .addr-top{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:16px;}
        .addr-who{display:flex;align-items:center;gap:12px;min-width:0;}
        .addr-icon{width:42px;height:42px;border-radius:11px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:#F8DFE2;color:#9C0F22;}
        .addr-card.is-default .addr-icon{background:#D2172E;color:#fff;}
        .addr-icon svg{width:20px;height:20px;}
        .addr-name-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
        .addr-name{font-family:'Big Shoulders Display',sans-serif;font-weight:700;font-size:19px;letter-spacing:.01em;text-transform:uppercase;}
        .addr-badge-default{font-size:9.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;background:#D2172E;color:#fff;padding:3px 8px;border-radius:999px;}
        .addr-phone{display:flex;align-items:center;gap:6px;font-size:12.5px;color:#4A4750;margin-top:3px;}
        .addr-phone svg{width:12px;height:12px;color:#837E88;}
        .type-pill{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;padding:5px 11px;border-radius:999px;white-space:nowrap;border:1px solid #F0DEE0;color:#9C0F22;background:#fff;}
        .type-pill svg{width:11px;height:11px;}
        .type-pill.work{color:#2E6FBF;border-color:#D3E1F4;}
        .type-pill.other{color:#B87A12;border-color:#F1DCB2;}
        .addr-body{font-size:13.8px;line-height:1.65;color:#4A4750;padding:2px 0 16px 54px;}
        .addr-body .pin{font-family:'JetBrains Mono',monospace;color:#17151A;font-weight:600;}
        .addr-actions{display:flex;justify-content:flex-end;gap:8px;padding-top:14px;border-top:1px dashed #EAE5E6;}
        .icon-btn{width:34px;height:34px;border-radius:9px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s,transform .15s;}
        .icon-btn svg{width:15px;height:15px;}
        .icon-btn.edit{background:#E7F0FB;color:#2E6FBF;}
        .icon-btn.edit:hover{background:#2E6FBF;color:#fff;}
        .icon-btn.del{background:#FCEDEE;color:#D2172E;}
        .icon-btn.del:hover{background:#D2172E;color:#fff;}
        .icon-btn.star{background:#FCF6E9;color:#B87A12;}
        .icon-btn.star:hover{background:#B87A12;color:#fff;}
        .icon-btn:active{transform:scale(.92);}
        .set-default-link{margin-right:auto;font-size:12px;font-weight:700;color:#837E88;background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:5px;padding:8px 4px;}
        .set-default-link:hover{color:#9C0F22;}
        .set-default-link svg{width:13px;height:13px;}
        .add-card{border:1.5px dashed #E3B9BF;border-radius:16px;background:repeating-linear-gradient(135deg,#FEFBFB,#FEFBFB 10px,#FDF5F6 10px,#FDF5F6 11px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;min-height:210px;cursor:pointer;transition:border-color .15s,background .15s;}
        .add-card:hover{border-color:#D2172E;}
        .add-card .plus{width:50px;height:50px;border-radius:50%;background:#F8DFE2;color:#D2172E;display:flex;align-items:center;justify-content:center;transition:transform .18s,background .18s;}
        .add-card:hover .plus{background:#D2172E;color:#fff;transform:rotate(90deg) scale(1.06);}
        .add-card .plus svg{width:22px;height:22px;}
        .add-card span{font-weight:700;color:#4A4750;font-size:14.5px;}
        .modal-overlay{position:fixed;inset:0;background:rgba(23,21,26,0.5);backdrop-filter:blur(3px);display:none;align-items:center;justify-content:center;z-index:10001;padding:20px;}
        .modal-overlay.show{display:flex;}
        .modal{background:#fff;border-radius:20px;width:100%;max-width:560px;box-shadow:0 30px 60px -20px rgba(23,21,26,0.35);max-height:88vh;overflow-y:auto;animation:modal-pop .18s ease;}
        @keyframes modal-pop{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}
        .modal-head{display:flex;justify-content:space-between;align-items:center;padding:24px 28px 20px;border-bottom:1px solid #EAE5E6;}
        .modal-head h2{font-family:'Big Shoulders Display',sans-serif;font-size:24px;margin:0;text-transform:uppercase;color:#17151A;}
        .modal-close{width:36px;height:36px;border-radius:10px;border:none;background:#FCFAFA;color:#4A4750;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;}
        .modal-close:hover{background:#FCEDEE;color:#D2172E;}
        .modal-close svg{width:16px;height:16px;}
        .modal-body{padding:24px 28px;}
        .field-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;}
        .field{display:flex;flex-direction:column;gap:7px;}
        .field.full{grid-column:1 / -1;}
        .field label{font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#4A4750;}
        .field input{border:1.5px solid #EAE5E6;border-radius:10px;padding:13px 14px;font-size:14px;font-family:'Inter',sans-serif;color:#17151A;outline:none;background:#FCFAFA;transition:border-color .15s,background .15s,box-shadow .15s;}
        .field input:focus{border-color:#D2172E;background:#fff;box-shadow:0 0 0 3px rgba(210,23,46,0.08);}
        .field input::placeholder{color:#B2ADB4;}
        .type-select-row{display:flex;gap:10px;margin-bottom:16px;}
        .type-opt{flex:1;display:flex;flex-direction:column;align-items:center;gap:7px;padding:14px 8px;border:1.5px solid #EAE5E6;border-radius:12px;cursor:pointer;font-size:12px;font-weight:700;color:#4A4750;transition:all .15s;background:#fff;}
        .type-opt svg{width:20px;height:20px;}
        .type-opt:hover{border-color:#D2172E;color:#9C0F22;}
        .type-opt.selected{border-color:#D2172E;background:#FCEDEE;color:#9C0F22;}
        .toggle-row{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:#FCFAFA;border:1.5px solid #EAE5E6;border-radius:12px;margin-bottom:8px;}
        .toggle-row .lbl{font-size:14px;font-weight:600;color:#17151A;}
        .toggle-row .lbl small{display:block;font-weight:400;color:#837E88;font-size:12px;margin-top:3px;}
        .switch{width:44px;height:25px;border-radius:999px;background:#DCD7D9;position:relative;cursor:pointer;flex-shrink:0;transition:background .18s;border:none;}
        .switch::after{content:"";position:absolute;width:19px;height:19px;border-radius:50%;background:#fff;top:3px;left:3px;transition:transform .18s;box-shadow:0 1px 3px rgba(0,0,0,0.25);}
        .switch.on{background:#D2172E;}
        .switch.on::after{transform:translateX(19px);}
        .modal-foot{display:flex;justify-content:flex-end;gap:12px;padding:20px 28px 24px;border-top:1px solid #EAE5E6;}
        .confirm-modal{max-width:400px;text-align:center;padding:36px 28px 28px;}
        .confirm-modal .warn-icon{width:56px;height:56px;border-radius:50%;background:#FCEDEE;color:#D2172E;display:flex;align-items:center;justify-content:center;margin:0 auto 18px;}
        .confirm-modal .warn-icon svg{width:26px;height:26px;}
        .confirm-modal h3{font-family:'Big Shoulders Display',sans-serif;font-size:24px;margin:0 0 10px;text-transform:uppercase;color:#17151A;}
        .confirm-modal p{font-size:14px;color:#4A4750;margin:0 0 24px;line-height:1.6;}
        .confirm-actions{display:flex;gap:12px;}
        .confirm-actions .addr-btn{flex:1;justify-content:center;}
        .addr-btn-danger{background:#D2172E;color:#fff;}
        .addr-btn-danger:hover{background:#9C0F22;}
        .addr-toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%) translateY(20px);background:#17151A;color:#fff;padding:14px 24px;border-radius:12px;font-size:14px;font-weight:600;box-shadow:0 14px 30px -10px rgba(0,0,0,0.4);opacity:0;pointer-events:none;transition:all .25s ease;z-index:10002;display:flex;align-items:center;gap:10px;}
        .addr-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
        .addr-toast svg{width:16px;height:16px;color:#6FE39A;}
        @media(max-width:760px){.addr-shell{padding:0 18px;}.addr-grid{grid-template-columns:1fr;}.field-row{grid-template-columns:1fr;}.addr-body{padding-left:0;}}
        @media(prefers-reduced-motion:reduce){*{animation:none !important;transition:none !important;}}
        :focus-visible{outline:2px solid #D2172E;outline-offset:2px;}
      `}</style>

      <div className="addr-pulse-rail" />
      <div className="addr-bg-wash" />
      <SiteTopNav />

      <div className="addr-shell">
        <nav className="addr-crumb" aria-label="Breadcrumb">
          <Link to="/"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></svg>Home</Link>
          <span className="sep">&#8250;</span>
          <Link to="/profile">Profile</Link>
          <span className="sep">&#8250;</span>
          <span className="current">Addresses</span>
        </nav>

        <div className="addr-page-head">
          <div>
            <h1 className="addr-title">Manage Addresses</h1>
            <p className="addr-sub">Manage your saved delivery addresses</p>
          </div>
          <button className="addr-btn addr-btn-primary" onClick={openAdd}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
            Add New Address
          </button>
        </div>

        {addresses.length === 0 ? (
          <div className="text-center" style={{ padding: '60px 20px 90px', color: '#837E88' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 44, height: 44, color: '#D2172E', marginBottom: 14 }}><path d="M12 21s7-6.2 7-11.2A7 7 0 105 9.8C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/></svg>
            <h3 style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontSize: 24, color: '#17151A', margin: '0 0 6px', textTransform: 'uppercase' }}>No saved addresses yet</h3>
            <p style={{ fontSize: 13.5, margin: '0 0 18px' }}>Add a delivery address to speed up checkout next time.</p>
            <button className="addr-btn addr-btn-primary" onClick={openAdd}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              Add New Address
            </button>
          </div>
        ) : (
          <div className="addr-grid">
            {addresses.map(addr => {
              const typeLower = addr.addressType?.toLowerCase() || 'home'
              return (
                <article key={addr.id} className={`addr-card${addr.isDefault ? ' is-default' : ''}`}>
                  <div className="addr-top">
                    <div className="addr-who">
                      <div className="addr-icon">{typeIcons[addr.addressType] || typeIcons.Other}</div>
                      <div>
                        <div className="addr-name-row">
                          <span className="addr-name">{addr.fullName}</span>
                          {addr.isDefault && <span className="addr-badge-default">Default</span>}
                        </div>
                        <div className="addr-phone">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.7a2 2 0 01-.4 2.1L8 9.8a16 16 0 006.2 6.2l1.3-1.3a2 2 0 012.1-.4c.9.3 1.8.5 2.7.6a2 2 0 011.7 2z"/></svg>
                          {formatPhone(addr.mobile)}
                        </div>
                      </div>
                    </div>
                    <span className={`type-pill ${typeLower === 'home' ? '' : typeLower}`}>
                      {typeIcons[addr.addressType] || typeIcons.Other}
                      {addr.addressType}
                    </span>
                  </div>
                  <div className="addr-body">
                    {addr.addressLine1}<br/>
                    {addr.addressLine2 && <>{addr.addressLine2}<br/></>}
                    {addr.city}, {addr.state} - <span className="pin">{addr.zipCode}</span><br/>
                    {addr.country}
                  </div>
                  <div className="addr-actions">
                    {!addr.isDefault && (
                      <button className="set-default-link" onClick={() => handleSetDefault(addr.id)}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.8L12 16.9l-6.2 3.4 1.6-6.8L2.2 8.9l6.9-.6z"/></svg>
                        Set as default
                      </button>
                    ) || <span style={{ marginRight: 'auto' }} />}
                    <button className="icon-btn edit" title="Edit" onClick={() => openEdit(addr)}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>
                    </button>
                    <button className="icon-btn del" title="Delete" onClick={() => { setDeletingId(Number(addr.id)); setConfirmOpen(true) }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
                    </button>
                  </div>
                </article>
              )
            })}
            <div className="add-card" onClick={openAdd}>
              <div className="plus">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>
              </div>
              <span>Add New Address</span>
            </div>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <div className={`modal-overlay${formOpen ? ' show' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) setFormOpen(false) }}>
        <div className="modal">
          <div className="modal-head" style={{ background: 'linear-gradient(135deg, #FCEDEE 0%, #FDF6F6 100%)', borderBottom: '1px solid #F0DEE0' }}>
            <div className="flex items-center gap-3">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: '#D2172E', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20 }}><path d="M12 21s7-6.2 7-11.2A7 7 0 105 9.8C5 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.4"/></svg>
              </div>
              <h2>{editing ? 'Edit Address' : 'Add New Address'}</h2>
            </div>
            <button className="modal-close" onClick={() => setFormOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
          </div>
          <div className="modal-body">
            <div className="field-row">
              <div className="field">
                <label>Full Name *</label>
                <input type="text" value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} placeholder="e.g. Maideen" />
              </div>
              <div className="field">
                <label>Phone Number *</label>
                <input type="tel" value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="e.g. 9080575858" />
              </div>
            </div>
            <div className="field-row">
              <div className="field full">
                <label>Address Line 1 *</label>
                <input type="text" value={form.addressLine1} onChange={e => setForm(p => ({ ...p, addressLine1: e.target.value }))} placeholder="House no., street, area" />
              </div>
            </div>
            <div className="field-row">
              <div className="field full">
                <label>Address Line 2 / Landmark</label>
                <input type="text" value={form.addressLine2 || ''} onChange={e => setForm(p => ({ ...p, addressLine2: e.target.value }))} placeholder="Optional" />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>City *</label>
                <input type="text" value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="e.g. Virudhunagar" />
              </div>
              <div className="field">
                <label>State *</label>
                <input type="text" value={form.state} onChange={e => setForm(p => ({ ...p, state: e.target.value }))} placeholder="e.g. Tamil Nadu" />
              </div>
            </div>
            <div className="field-row">
              <div className="field">
                <label>Pincode *</label>
                <input type="text" value={form.zipCode} onChange={e => setForm(p => ({ ...p, zipCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))} placeholder="e.g. 626149" />
              </div>
              <div className="field">
                <label>Country</label>
                <input type="text" value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} placeholder="e.g. India" />
              </div>
            </div>
            <div className="field" style={{ marginBottom: 16 }}>
              <label>Address Type</label>
              <div className="type-select-row">
                {(['Home', 'Office', 'Other'] as const).map(t => (
                  <div key={t} className={`type-opt${form.addressType === t ? ' selected' : ''}`} onClick={() => setForm(p => ({ ...p, addressType: t }))}>
                    {typeIcons[t]}
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <div className="toggle-row">
              <div className="lbl">
                Set as default address
                <small>Used automatically at checkout</small>
              </div>
              <button className={`switch${form.isDefault ? ' on' : ''}`} type="button" onClick={() => setForm(p => ({ ...p, isDefault: !p.isDefault }))} aria-pressed={form.isDefault} />
            </div>
          </div>
          <div className="modal-foot">
            <button className="addr-btn addr-btn-ghost" onClick={() => setFormOpen(false)} style={{ borderRadius: 12 }}>Cancel</button>
            <button className="addr-btn addr-btn-primary" onClick={handleSave} disabled={saving} style={{ borderRadius: 12, minWidth: 140 }}>
              {saving ? 'Saving...' : 'Save Address'}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirm Modal */}
      <div className={`modal-overlay${confirmOpen ? ' show' : ''}`} onClick={(e) => { if (e.target === e.currentTarget) { setConfirmOpen(false); setDeletingId(null) } }}>
        <div className="modal confirm-modal">
          <div className="warn-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
          </div>
          <h3>Remove this address?</h3>
          <p>This will permanently delete the saved address. You can't undo this.</p>
          <div className="confirm-actions">
            <button className="addr-btn addr-btn-ghost" onClick={() => { setConfirmOpen(false); setDeletingId(null) }}>Keep it</button>
            <button className="addr-btn addr-btn-danger" onClick={handleDelete}>Delete</button>
          </div>
        </div>
      </div>

      {/* Toast */}
      <div className={`addr-toast${toast ? ' show' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M20 6L9 17l-5-5"/></svg>
        <span>{toast}</span>
      </div>
    </div>
  )
}
