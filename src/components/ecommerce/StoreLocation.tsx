import SectionHeading, { Accent } from '../ui/SectionHeading'

/** Store location shown on the home page, just above the footer. */
const STORE = {
  name: 'PhoneFix Pro',
  address: 'Chennai, Tamil Nadu',
  phone: '+91 98765 43210',
  phoneHref: 'tel:+919876543210',
  email: 'support@phonefixpro.com',
  // Map search text. Swap in the full street address once the shop has one.
  mapQuery: 'Chennai, Tamil Nadu',
}

const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(STORE.mapQuery)}`
// The keyless embed URL: no Maps API key or billing account needed.
const mapEmbed = `https://www.google.com/maps?q=${encodeURIComponent(STORE.mapQuery)}&z=12&output=embed`

const details = [
  { icon: 'location_on', label: 'Address', value: `${STORE.name}, ${STORE.address}` },
  { icon: 'call', label: 'Phone', value: STORE.phone, href: STORE.phoneHref },
  { icon: 'mail', label: 'Email', value: STORE.email, href: `mailto:${STORE.email}` },
]

export default function StoreLocation({ compact = false }: { compact?: boolean }) {
  return (
    <section
      aria-labelledby="store-location-title"
      className={compact ? 'px-4 pt-8 pb-6' : 'py-20 px-6 md:px-12 bg-surface'}
    >
      <div className="max-w-[1200px] mx-auto">
        {compact ? (
          <h2 id="store-location-title" className="text-lg font-bold text-on-surface mb-4">
            Visit our <span className="text-pf-red">store</span>
          </h2>
        ) : (
          <div id="store-location-title">
            <SectionHeading
              className="mb-12"
              align="center"
              eyebrow="Our Location"
              icon="storefront"
              title={<>Visit Our <Accent>Store</Accent></>}
              subtitle="Walk in for new phones, accessories and same-day repairs. Find us on the map below."
            />
          </div>
        )}

        <div className="grid md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] overflow-hidden rounded-3xl bg-white shadow-[0_24px_60px_-28px_rgba(27,18,16,0.35)] ring-1 ring-black/5">
          <div className={`flex flex-col ${compact ? 'p-5 gap-4' : 'p-8 md:p-10 gap-6'}`}>
            <span className="self-start inline-flex items-center gap-2 rounded-xl bg-[#1b1210] text-white px-4 py-2.5 text-sm font-semibold">
              <span className="material-symbols-outlined text-base text-[#ff5a6e]" aria-hidden="true">storefront</span>
              {STORE.name} · Chennai
            </span>

            <dl className="flex flex-col gap-4">
              {details.map((d) => (
                <div key={d.label} className="flex gap-3">
                  <span className="material-symbols-outlined text-xl text-pf-red mt-0.5" aria-hidden="true">{d.icon}</span>
                  <div className="min-w-0">
                    <dt className="text-xs font-medium uppercase tracking-wider text-on-surface-variant">{d.label}</dt>
                    <dd className="mt-0.5 text-base font-semibold text-on-surface break-words">
                      {d.href ? <a href={d.href} className="hover:text-pf-red transition-colors">{d.value}</a> : d.value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>

            <a
              href={mapsLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto self-start inline-flex items-center gap-2 rounded-xl bg-[#D91E36] hover:bg-[#a3122a] text-white px-6 py-3.5 text-sm font-bold shadow-[0_10px_24px_-10px_rgba(217,30,54,0.7)] transition-colors"
            >
              <span className="material-symbols-outlined text-lg" aria-hidden="true">directions</span>
              Open in Google Maps
            </a>
          </div>

          <div className={`relative bg-[#eef0f3] ${compact ? 'h-60' : 'min-h-[320px] md:min-h-[420px]'}`}>
            <iframe
              title={`Map showing ${STORE.name}, ${STORE.address}`}
              src={mapEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
