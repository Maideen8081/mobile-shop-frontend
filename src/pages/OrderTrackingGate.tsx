import OrderTracking from '../pages/OrderTracking'
import MobileOrderTracking from '../components/mobile/MobileOrderTracking'
import { useIsMobile } from '../components/mobile/helpers'

export default function OrderTrackingGate() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileOrderTracking /> : <OrderTracking />
}
