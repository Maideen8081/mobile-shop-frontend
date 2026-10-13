import { Link } from 'react-router-dom'

const linkColumns = [
  {
    title: 'Shop',
    icon: 'storefront',
    links: [
      { label: 'All Products', to: '/collection/all' },
      { label: 'Phones', to: '/phones' },
      { label: 'Accessories', to: '/accessories' },
      { label: 'Wishlist', to: '/wishlist' },
    ],
  },
  {
    title: 'Services',
    icon: 'build',
    links: [
      { label: 'Screen Repair', to: '/repairs' },
      { label: 'Battery Replacement', to: '/repairs' },
      { label: 'Water Damage', to: '/repairs' },
      { label: 'Data Recovery', to: '/repairs' },
    ],
  },
  {
    title: 'Company',
    icon: 'business',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Privacy Policy', to: '#' },
      { label: 'Terms of Service', to: '#' },
      { label: 'Careers', to: '#' },
    ],
  },
  {
    title: 'Support',
    icon: 'support_agent',
    links: [
      { label: 'My Orders', to: '/orders' },
      { label: 'Track Repair', to: '/my-repairs' },
      { label: 'Contact', to: '/about' },
      { label: 'FAQ', to: '#' },
    ],
  },
]

const socialLinks = [
  { icon: 'public', label: 'Website' },
  { icon: 'share', label: 'Share' },
  { icon: 'mail', label: 'Email' },
]

const trustBadges = [
  { icon: 'verified_user', label: 'SSL Secured' },
  { icon: 'payments', label: 'Safe Payments' },
  { icon: 'local_shipping', label: 'Fast Delivery' },
  { icon: 'replay', label: '7-Day Returns' },
]

interface EcommerceFooterProps {
  compact?: boolean
}

export default function EcommerceFooter({ compact = false }: EcommerceFooterProps) {
  return (
    <footer
      className="text-white"
      style={{
        fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
        background: 'linear-gradient(180deg, #0d0d0d 0%, #111111 100%)',
      }}
    >
      {/* Top accent bar */}
      <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #7A1620 0%, #D91E36 50%, #7A1620 100%)' }} />

      {/* Trust badges strip */}
      {!compact && (
        <div className="border-b border-white/6">
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-4 flex flex-wrap items-center justify-center md:justify-between gap-4">
            {trustBadges.map((b) => (
              <div key={b.label} className="flex items-center gap-2.5 text-white/50 hover:text-white/80 transition-colors">
                <span className="material-symbols-outlined text-[#D91E36]" style={{ fontSize: '18px' }}>{b.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.04em' }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={`max-w-[1440px] mx-auto px-6 md:px-12 ${compact ? 'pt-8 pb-5' : 'pt-12 pb-8'}`}>
        <div className={`grid grid-cols-2 md:grid-cols-5 ${compact ? 'gap-6 md:gap-5' : 'gap-10 md:gap-8'}`}>
          {/* Brand column */}
          <div className={`col-span-2 flex flex-col ${compact ? 'gap-4' : 'gap-6'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D91E36] flex items-center justify-center shadow-lg shadow-[#D91E36]/30">
                <span className="font-black text-white" style={{ fontSize: '14px', letterSpacing: '-0.02em' }}>PF</span>
              </div>
              <div>
                <div className="font-bold text-white" style={{ fontSize: compact ? '15px' : '17px', letterSpacing: '-0.01em' }}>
                  PhoneFix Pro
                </div>
                <div className="text-white/40" style={{ fontSize: '10px', letterSpacing: '0.08em' }}>PREMIUM MOBILE STORE</div>
              </div>
            </div>

            <p className="text-white/55 leading-relaxed max-w-[260px]" style={{ fontSize: compact ? '12px' : '13.5px', lineHeight: 1.7 }}>
              Luminous Precision in Every Repair. Premium devices and expert repairs — trusted by thousands across India.
            </p>

            <div className="flex flex-col gap-2.5">
              {[
                { icon: 'call', text: '+91 98765 43210' },
                { icon: 'mail', text: 'support@phonefixpro.com' },
                { icon: 'location_on', text: 'Bengaluru, Karnataka, India' },
              ].map((item) => (
                <div key={item.icon} className="flex items-center gap-2.5 text-white/55" style={{ fontSize: compact ? '11px' : '13px' }}>
                  <span className="material-symbols-outlined text-[#D91E36] flex-shrink-0" style={{ fontSize: compact ? '14px' : '16px' }}>
                    {item.icon}
                  </span>
                  {item.text}
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-1">
              {socialLinks.map((s) => (
                <button
                  key={s.icon}
                  aria-label={s.label}
                  className="rounded-xl bg-white/6 border border-white/10 flex items-center justify-center text-white/60 hover:bg-[#D91E36] hover:text-white hover:border-[#D91E36] transition-all duration-200 cursor-pointer"
                  style={{ width: compact ? 34 : 40, height: compact ? 34 : 40 }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: compact ? '15px' : '18px' }}>{s.icon}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {linkColumns.map((col) => (
            <div key={col.title} className={`flex flex-col ${compact ? 'gap-2.5' : 'gap-3'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-[#D91E36]" style={{ fontSize: '14px' }}>{col.icon}</span>
                <h2 className="font-bold text-white/90 uppercase tracking-widest" style={{ fontSize: '11px', letterSpacing: '0.12em' }}>
                  {col.title}
                </h2>
              </div>
              {col.links.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-white/50 hover:text-white transition-colors w-fit group flex items-center gap-1"
                  style={{ fontSize: compact ? '12px' : '13px' }}
                >
                  <span className="group-hover:translate-x-0.5 transition-transform inline-block">{link.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div
          className={`${compact ? 'mt-8 p-4' : 'mt-12 p-6'} flex flex-col md:flex-row items-start md:items-center justify-between gap-5 rounded-2xl`}
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div>
            <h2 className="font-bold text-white" style={{ fontSize: compact ? '14px' : '16px' }}>
              Stay in the loop
            </h2>
            <p className="text-white/50 mt-0.5" style={{ fontSize: compact ? '11px' : '13px' }}>
              Get exclusive deals and new arrivals in your inbox.
            </p>
          </div>
          <form onSubmit={(e) => e.preventDefault()} className="flex w-full md:w-auto gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 md:w-64 px-4 rounded-xl bg-white/8 border border-white/12 text-white placeholder:text-white/40 outline-none focus:border-[#D91E36] transition-colors"
              style={{ padding: compact ? '9px 14px' : '11px 16px', fontSize: compact ? '12px' : '13px' }}
            />
            <button
              className="rounded-xl bg-[#D91E36] text-white font-bold hover:bg-[#B8192F] transition-colors cursor-pointer whitespace-nowrap"
              style={{ padding: compact ? '9px 18px' : '11px 22px', fontSize: compact ? '12px' : '13px' }}
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div
          className={`max-w-[1440px] mx-auto px-6 md:px-12 ${compact ? 'py-3.5' : 'py-4'} flex flex-col sm:flex-row items-center justify-between gap-3`}
        >
          <p className="text-white/35" style={{ fontSize: '11px' }}>
            &copy; {new Date().getFullYear()} PhoneFix Pro. All rights reserved. Luminous Precision.
          </p>
          <div className="flex items-center gap-5 text-white/35" style={{ fontSize: '11px' }}>
            {['Privacy', 'Terms', 'Cookies'].map((label) => (
              <Link key={label} to="#" className="hover:text-white transition-colors">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
