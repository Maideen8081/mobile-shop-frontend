import WishlistPage from '../pages/WishlistPage'
import MobileWishlist from '../components/mobile/MobileWishlist'
import { useIsMobile } from '../components/mobile/helpers'

export default function WishlistGate() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileWishlist /> : <WishlistPage />
}
