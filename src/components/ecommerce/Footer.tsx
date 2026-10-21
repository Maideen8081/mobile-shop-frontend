import { Link } from 'react-router-dom'

const linkColumns = [
  {
    title: 'Shop',
    links: [
      { label: 'All Products', to: '/collection/all' },
      { label: 'Smartphones', to: '/phones' },
      { label: 'Accessories', to: '/accessories' },
      { label: 'Trade-In', to: '/trade-in' },
    ],
  },
  {
    title: 'Repairs',
    links: [
      { label: 'Repair Services', to: '/repairs' },
      { label: 'Book a Repair', to: '/book-repair' },
      { label: 'Track My Repair', to: '/my-repairs' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'My Orders', to: '/orders' },
      { label: 'Wishlist', to: '/wishlist' },
      { label: 'Support Chat', to: '/support' },
      { label: 'About Us', to: '/about' },
    ],
  },
]

const contacts = [
  { icon: 'call', text: '+91 98765 43210', href: 'tel:+919876543210' },
  { icon: 'mail', text: 'support@phonefixpro.com', href: 'mailto:support@phonefixpro.com' },
  { icon: 'location_on', text: 'Bengaluru, Karnataka' },
]

const promises = [
  { icon: 'verified_user', label: 'Secure checkout' },
  { icon: 'local_shipping', label: 'Free delivery over ₹500' },
  { icon: 'replay', label: '7-day returns' },
  { icon: 'build_circle', label: '6-month repair warranty' },
]

interface EcommerceFooterProps {
  compact?: boolean
}

export default function EcommerceFooter({ compact = false }: EcommerceFooterProps) {
  return (
    <footer
      className="text-white"
      style={{
        fontFamily: 'var(--font-ui)',
        background: '#0b0b0c',
      }}
    >
      <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #a3122a, #ff5a6e, #a3122a)' }} />

      <div className={`max-w-[1440px] mx-auto px-6 md:px-12 ${compact ? 'py-6' : 'py-8'}`}>
        <div className="grid grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr_1fr] gap-x-8 gap-y-6">
          {/* Brand + contact */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-3">
            <Link to="/home" className="flex items-center gap-2.5 w-fit">
              <span className="w-9 h-9 rounded-lg bg-[#D91E36] flex items-center justify-center shadow-lg shadow-black/30">
                <span className="font-black text-white text-[13px] tracking-tight">PF</span>
              </span>
              <span className="leading-tight">
                <span className="block font-bold text-[15px]" style={{ fontFamily: 'var(--font-display)' }}>PhoneFix Pro</span>
                <span className="block text-white/45 text-[10px] tracking-[0.12em]">PHONES · ACCESSORIES · REPAIRS</span>
              </span>
            </Link>
            <p className="text-white/60 text-[12.5px] leading-relaxed max-w-[300px]">
              Genuine devices and same-day repairs, with honest pricing and a warranty on every fix.
            </p>
            <ul className="flex flex-col gap-1.5">
              {contacts.map((c) => {
                const content = (
                  <>
                    <span className="material-symbols-outlined text-[#ff5a6e]" style={{ fontSize: '15px' }}>{c.icon}</span>
                    {c.text}
                  </>
                )
                return (
                  <li key={c.icon} className="text-white/65 text-[12px]">
                    {c.href ? (
                      <a href={c.href} className="inline-flex items-center gap-2 hover:text-white transition-colors">{content}</a>
                    ) : (
                      <span className="inline-flex items-center gap-2">{content}</span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Links */}
          {linkColumns.map((col) => (
            <nav key={col.title} aria-label={col.title} className="flex flex-col gap-2">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#ff8a98] mb-0.5">{col.title}</h2>
              {col.links.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-white/65 hover:text-white text-[13px] w-fit transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', background: '#000' }}>
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-3 flex flex-col lg:flex-row items-center justify-between gap-3">
          <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5">
            {promises.map((p) => (
              <li key={p.label} className="flex items-center gap-1.5 text-white/60 text-[11.5px] font-medium">
                <span className="material-symbols-outlined text-[#ff5a6e]" style={{ fontSize: '15px' }}>{p.icon}</span>
                {p.label}
              </li>
            ))}
          </ul>
          <p className="text-white/45 text-[11.5px]">
            &copy; {new Date().getFullYear()} PhoneFix Pro. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
