const partners = ['Apple Authorized', 'Samsung Certified', 'Google Pixel Partner', 'OnePlus Verified']

export default function Partners() {
  return (
    <section className="mt-7 overflow-hidden bg-white border-y border-[#EEF1F4] py-4">
      <div className="flex animate-marquee whitespace-nowrap items-center">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex items-center gap-8 mx-6">
            {partners.map((p) => (
              <span key={p + dup} className="text-[18px] font-extrabold text-[#0F172A]/15 uppercase tracking-tighter select-none">{p}</span>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
