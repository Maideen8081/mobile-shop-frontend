import { Link } from 'react-router-dom'

const linkColumns = [
  {
    title: 'Services',
    links: [
      { label: 'Screen Repair', to: '/repairs' },
      { label: 'Battery Life', to: '/repairs' },
      { label: 'Water Damage', to: '/repairs' },
      { label: 'Data Recovery', to: '/repairs' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', to: '/about' },
      { label: 'Privacy Policy', to: '#' },
      { label: 'Terms of Service', to: '#' },
      { label: 'Careers', to: '#' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Track Repair', to: '#' },
      { label: 'Contact', to: '/about' },
      { label: 'FAQ', to: '#' },
      { label: 'Shipping Info', to: '#' },
    ],
  },
]

export default function EcommerceFooter() {
  return (
    <footer className="bg-surface border-t border-outline-variant/50">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span
                className="text-lg font-extrabold text-[#00391c] bg-[#00ff88] px-3 py-1.5 rounded-xl"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                PF
              </span>
              <span
                className="text-lg font-extrabold text-on-surface"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                PhoneFix Pro
              </span>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed" style={{ fontFamily: "'Inter', sans-serif" }}>
              Luminous Precision in Every Repair. Premium devices and expert repairs — trusted by thousands.
            </p>
            <div className="flex gap-3">
              {['public', 'share', 'mail'].map((icon) => (
                <div
                  key={icon}
                  className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:bg-[#00ff88]/20 hover:text-[#00ff88] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">{icon}</span>
                </div>
              ))}
            </div>
          </div>
          {linkColumns.map((col) => (
            <div key={col.title} className="flex flex-col gap-3.5">
              <h4
                className="text-xs font-bold text-[#00391c] uppercase tracking-widest"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                {col.title}
              </h4>
              {col.links.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-sm text-on-surface-variant hover:text-[#00ff88] transition-colors w-fit"
                  style={{ fontFamily: "'Inter', sans-serif" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-12 pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-on-surface-variant/50" style={{ fontFamily: "'Inter', sans-serif" }}>
            &copy; 2024 PhoneFix Pro. All rights reserved. Luminous Precision.
          </p>
          <div className="flex items-center gap-4 text-xs text-on-surface-variant/50">
            <Link to="#" className="hover:text-[#00ff88] transition-colors">Privacy</Link>
            <Link to="#" className="hover:text-[#00ff88] transition-colors">Terms</Link>
            <Link to="#" className="hover:text-[#00ff88] transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
