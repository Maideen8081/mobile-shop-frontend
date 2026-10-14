import WebsiteExperience from '../pages/WebsiteExperience'
import MobileWebsiteExperience from '../components/mobile/MobileWebsiteExperience'
import { useIsMobile } from '../components/mobile/helpers'

export default function WebsiteGate() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileWebsiteExperience /> : <WebsiteExperience />
}
