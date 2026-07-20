import LandingPage from '../pages/LandingPage'
import MobileHome from '../components/mobile/MobileHome'
import { useIsMobile } from '../components/mobile/helpers'

export default function LandingGate() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileHome /> : <LandingPage />
}
