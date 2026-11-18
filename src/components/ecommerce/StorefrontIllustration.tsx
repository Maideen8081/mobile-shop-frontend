import { Heart, Search, ShoppingBag } from 'lucide-react'

const illustrations = {
  cart: { image: '/products/phone-10t.png', Icon: ShoppingBag },
  wishlist: { image: '/products/headphones-anc.png', Icon: Heart },
  search: { image: '/products/earbuds-pro.png', Icon: Search },
}

export default function StorefrontIllustration({ kind }: { kind: keyof typeof illustrations }) {
  const { image, Icon } = illustrations[kind]

  return (
    <div className="storefront-illustration" aria-hidden="true">
      <img src={image} alt="" width={88} height={88} />
      <span className="storefront-illustration-icon"><Icon size={19} strokeWidth={1.8} /></span>
    </div>
  )
}
