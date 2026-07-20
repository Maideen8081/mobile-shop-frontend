import CartPage from '../pages/CartPage'
import MobileCart from '../components/mobile/MobileCart'
import { useIsMobile } from '../components/mobile/helpers'

export default function CartGate() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileCart /> : <CartPage />
}
