import { Link, useLocation } from 'react-router-dom'
import SiteTopNav from '../components/ecommerce/SiteTopNav'
import { usePageMeta } from '../hooks/usePageMeta'
import { BUSINESS, POLICY_LINKS } from '../config/business'

/*
 * Store policies required by Indian payment gateways (privacy, terms, refunds,
 * shipping). Plain starting text: have it reviewed before relying on it.
 */

type Section = { heading: string; body: string[] }
type Policy = { title: string; description: string; sections: Section[] }

const contact = () =>
  [`email ${BUSINESS.email}`, BUSINESS.phoneDisplay && `call ${BUSINESS.phoneDisplay}`].filter(Boolean).join(' or ')

const POLICIES: Record<string, Policy> = {
  '/privacy-policy': {
    title: 'Privacy Policy',
    description: 'How PhoneFix collects, uses and protects your personal information.',
    sections: [
      { heading: 'What we collect', body: [
        'Account details you give us: name, email, mobile number and delivery addresses.',
        'Order, repair and trade-in details, including device model, IMEI or serial number when you book a repair.',
        'Basic technical data such as browser type and pages visited, used to keep the site working and secure.',
      ] },
      { heading: 'How we use it', body: [
        'To process orders, repairs and trade-ins, deliver products and contact you about them.',
        'To send offers only if you opt in. You can switch promotional messages off at any time in your profile.',
      ] },
      { heading: 'Sharing', body: [
        'We share only what is needed with delivery partners and payment providers to complete your order. We do not sell your data.',
      ] },
      { heading: 'Your choices', body: [
        `You can view and update your details in your account, or ask us to delete your account: ${contact()}.`,
      ] },
    ],
  },
  '/terms': {
    title: 'Terms & Conditions',
    description: 'The terms that apply when you shop, book repairs or trade in at PhoneFix.',
    sections: [
      { heading: 'Orders and prices', body: [
        'All prices are in Indian Rupees and include GST. The GST share is shown on your invoice.',
        'An order is confirmed when you receive an order number. We may cancel an order if an item is out of stock or mispriced, and you will not be charged.',
        'Cash on Delivery is available on all orders.',
      ] },
      { heading: 'Cancellations', body: [
        'You can cancel an unpaid order from My Orders until it ships. For paid orders, contact support for a refund.',
      ] },
      { heading: 'Repairs', body: [
        `Repairs carry a ${BUSINESS.repairWarrantyMonths}-month warranty on the parts and work we did. It does not cover new physical or liquid damage.`,
        'We give a quote before starting work and only proceed with your approval.',
      ] },
      { heading: 'Trade-ins', body: [
        'Online trade-in values are estimates. The final value is confirmed after we inspect the device.',
      ] },
    ],
  },
  '/refund-policy': {
    title: 'Returns & Refund Policy',
    description: 'How returns, replacements and refunds work at PhoneFix.',
    sections: [
      { heading: 'Returns', body: [
        `Unused products in their original packaging can be returned within ${BUSINESS.returnDays} days of delivery.`,
        'Items that arrive damaged or faulty are replaced or refunded. Tell us within 48 hours of delivery with photos.',
      ] },
      { heading: 'Refunds', body: [
        'Approved refunds go back to the original payment method within 5–7 business days. Cash on Delivery orders are refunded by bank transfer or UPI.',
      ] },
      { heading: 'How to request one', body: [`Open the order in My Orders and contact support, or ${contact()}.`] },
    ],
  },
  '/shipping-policy': {
    title: 'Shipping Policy',
    description: 'Delivery times and charges for PhoneFix orders.',
    sections: [
      { heading: 'Delivery charges', body: [
        `Delivery is free on orders of ₹${BUSINESS.freeDeliveryOver.toLocaleString('en-IN')} or more. Smaller orders have a ₹49 delivery charge.`,
      ] },
      { heading: 'Delivery times', body: [
        'Most orders are delivered within 3–5 business days. If an order is delayed, its tracking page says so and we contact you.',
      ] },
    ],
  },
}

export default function PolicyPage() {
  const { pathname } = useLocation()
  const policy = POLICIES[pathname] ?? POLICIES['/terms']
  usePageMeta({ title: policy.title, description: policy.description })

  return (
    <div className="min-h-screen bg-[#f7f6f2] text-[#0f3b2c]">
      <SiteTopNav />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-extrabold">{policy.title}</h1>
        <p className="mt-2 text-[#6b6b70]">{policy.description}</p>
        {policy.sections.map((s) => (
          <section key={s.heading} className="mt-8">
            <h2 className="text-lg font-bold">{s.heading}</h2>
            <ul className="mt-2 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-[#0b2e22]">
              {s.body.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </section>
        ))}
        <nav aria-label="Store policies" className="mt-12 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#0f3b2c]/10 pt-6 text-sm font-semibold">
          {POLICY_LINKS.map((l) => <Link key={l.to} to={l.to} className="underline-offset-4 hover:underline">{l.label}</Link>)}
        </nav>
      </main>
    </div>
  )
}
