import { Link } from 'react-router-dom'

const linkColumns = [
  {
    title: 'Shop',
    links: [
      { label: 'All Products', to: '/collection/all' },
      { label: 'Phones', to: '/phones' },
      { label: 'Accessories', to: '/accessories' },
      { label: 'Wishlist', to: '/wishlist' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Screen Repair', to: '/repairs' },
      { label: 'Battery Replacement', to: '/repairs' },
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
      { label: 'My Orders', to: '/orders' },
      { label: 'Track Repair', to: '/my-repairs' },
      { label: 'Contact', to: '/about' },
      { label: 'FAQ', to: '#' },
    ],
  },
]

const socialIcons = ['public', 'share', 'mail']

interface EcommerceFooterProps {
  compact?: boolean
}

export default function EcommerceFooter({ compact = false }: EcommerceFooterProps) {
  return (
    <footer className="bg-[#141414] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="h-1 w-full bg-gradient-to-r from-pf-red via-pf-red to-pf-red" />

      <div
        className={`max-w-[1440px] mx-auto px-6 md:px-12 ${compact ? 'pt-6 pb-4' : 'pt-10 pb-6'}`}
      >
        <div
          className={`grid grid-cols-2 md:grid-cols-5 ${compact ? 'gap-5 md:gap-4' : 'gap-8 md:gap-6'}`}
        >
          <div className={`col-span-2 flex flex-col ${compact ? 'gap-3' : 'gap-5'}`}>
            <div className="flex items-center gap-3">
              <span
                className={`font-extrabold text-white bg-pf-red px-3 py-1.5 rounded-lg ${compact ? 'text-base' : 'text-lg'}`}
              >
                PF
              </span>
              <span className={`font-extrabold text-white ${compact ? 'text-base' : 'text-lg'}`}>
                PhoneFix Pro
              </span>
            </div>
            <p
              className={`text-white/60 leading-relaxed max-w-xs ${compact ? 'text-xs' : 'text-sm'}`}
            >
              Luminous Precision in Every Repair. Premium devices and expert repairs — trusted by
              thousands.
            </p>
            <div
              className={`flex flex-col ${compact ? 'gap-1 text-xs' : 'gap-2 text-sm'} text-white/60`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className="material-symbols-outlined text-pf-red"
                  style={{ fontSize: compact ? '14px' : '16px' }}
                >
                  call
                </span>
                +91 98765 43210
              </div>
              <div className="flex items-center gap-2.5">
                <span
                  className="material-symbols-outlined text-pf-red"
                  style={{ fontSize: compact ? '14px' : '16px' }}
                >
                  mail
                </span>
                support@phonefixpro.com
              </div>
              <div className="flex items-center gap-2.5">
                <span
                  className="material-symbols-outlined text-pf-red"
                  style={{ fontSize: compact ? '14px' : '16px' }}
                >
                  location_on
                </span>
                Bengaluru, Karnataka, India
              </div>
            </div>
            <div className={`flex ${compact ? 'gap-2 mt-0.5' : 'gap-3 mt-1'}`}>
              {socialIcons.map((icon) => (
                <span
                  key={icon}
                  className={`rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/80 hover:bg-pf-red hover:text-white hover:border-pf-red transition-all cursor-pointer ${compact ? 'w-8 h-8' : 'w-10 h-10'}`}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: compact ? '16px' : '18px' }}
                  >
                    {icon}
                  </span>
                </span>
              ))}
            </div>
          </div>

          {linkColumns.map((col) => (
            <div key={col.title} className={`flex flex-col ${compact ? 'gap-2' : 'gap-3.5'}`}>
              <h3 className="font-bold text-white uppercase tracking-widest text-xs">
                {col.title}
              </h3>
              <div className={`bg-pf-red rounded-full ${compact ? 'w-6 h-0.5' : 'w-8 h-0.5'}`} />
              {col.links.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className={`text-white/60 hover:text-pf-red hover:translate-x-1 transition-all w-fit ${compact ? 'text-xs' : 'text-sm'}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div
          className={`${compact ? 'mt-5 p-3.5' : 'mt-8 p-5'} flex flex-col md:flex-row items-start md:items-center justify-between gap-4 rounded-2xl bg-white/5 border border-white/10`}
        >
          <div>
            <h4 className={`font-bold text-white ${compact ? 'text-sm' : 'text-base'}`}>
              Stay in the loop
            </h4>
            <p className={`text-white/60 mt-0.5 ${compact ? 'text-xs' : 'text-sm'}`}>
              Get exclusive deals and new arrivals in your inbox.
            </p>
          </div>
          <form onSubmit={(e) => e.preventDefault()} className="flex w-full md:w-auto gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className={`flex-1 md:w-72 px-3.5 rounded-lg bg-white/10 border border-white/15 text-white placeholder:text-white/60 outline-none focus:border-pf-red ${compact ? 'py-2 text-xs' : 'py-3 text-sm'}`}
            />
            <button
              className={`rounded-lg bg-pf-red text-white font-bold hover:bg-pf-red-dark transition-colors cursor-pointer ${compact ? 'px-4 py-2 text-xs' : 'px-6 py-3 text-sm'}`}
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div
          className={`max-w-[1440px] mx-auto px-6 md:px-12 ${compact ? 'py-3' : 'py-4'} flex flex-col sm:flex-row items-center justify-between gap-3`}
        >
          <p className="text-xs text-white/60">
            &copy; {new Date().getFullYear()} PhoneFix Pro. All rights reserved. Luminous Precision.
          </p>
          <div className="flex items-center gap-5 text-xs text-white/60">
            <Link to="#" className="hover:text-pf-red transition-colors">
              Privacy
            </Link>
            <Link to="#" className="hover:text-pf-red transition-colors">
              Terms
            </Link>
            <Link to="#" className="hover:text-pf-red transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
