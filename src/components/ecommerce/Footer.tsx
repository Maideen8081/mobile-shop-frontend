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

export default function EcommerceFooter() {
  return (
    <footer className="bg-[#141414] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="h-1 w-full bg-gradient-to-r from-[#CB202D] via-[#E53E4E] to-[#CB202D]" />

      <div className="max-w-[1440px] mx-auto px-6 md:px-12 pt-10 pb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-6">
          <div className="col-span-2 flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <span className="text-lg font-extrabold text-white bg-[#CB202D] px-3 py-1.5 rounded-xl">PF</span>
              <span className="text-lg font-extrabold text-white">PhoneFix Pro</span>
            </div>
            <p className="text-sm text-white/60 leading-relaxed max-w-xs">
              Luminous Precision in Every Repair. Premium devices and expert repairs — trusted by thousands.
            </p>
            <div className="flex flex-col gap-2 text-sm text-white/60">
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[16px] text-[#CB202D]">call</span>
                +91 98765 43210
              </div>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[16px] text-[#CB202D]">mail</span>
                support@phonefixpro.com
              </div>
              <div className="flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[16px] text-[#CB202D]">location_on</span>
                Bengaluru, Karnataka, India
              </div>
            </div>
            <div className="flex gap-3 mt-1">
              {socialIcons.map((icon) => (
                <span
                  key={icon}
                  className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 hover:bg-[#CB202D] hover:text-white hover:border-[#CB202D] transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">{icon}</span>
                </span>
              ))}
            </div>
          </div>

          {linkColumns.map((col) => (
            <div key={col.title} className="flex flex-col gap-3.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-widest">{col.title}</h4>
              <div className="w-8 h-0.5 bg-[#CB202D] rounded-full" />
              {col.links.map((link) => (
                <Link
                  key={link.label}
                  to={link.to}
                  className="text-sm text-white/60 hover:text-[#E53E4E] hover:translate-x-1 transition-all w-fit"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 p-5 rounded-2xl bg-white/5 border border-white/10">
          <div>
            <h5 className="text-white font-bold text-base">Stay in the loop</h5>
            <p className="text-sm text-white/50 mt-1">Get exclusive deals and new arrivals in your inbox.</p>
          </div>
          <form onSubmit={(e) => e.preventDefault()} className="flex w-full md:w-auto gap-2">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 md:w-72 px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#CB202D]"
            />
            <button className="px-6 py-3 rounded-xl bg-[#CB202D] text-white text-sm font-bold hover:bg-[#A81D2A] transition-colors cursor-pointer">
              Subscribe
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/40">&copy; {new Date().getFullYear()} PhoneFix Pro. All rights reserved. Luminous Precision.</p>
          <div className="flex items-center gap-5 text-xs text-white/40">
            <Link to="#" className="hover:text-[#CB202D] transition-colors">Privacy</Link>
            <Link to="#" className="hover:text-[#CB202D] transition-colors">Terms</Link>
            <Link to="#" className="hover:text-[#CB202D] transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
