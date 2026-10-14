import SupportChatPage from '../pages/SupportChatPage'
import MobileSupportChat from '../components/mobile/MobileSupportChat'
import { useIsMobile } from '../components/mobile/helpers'

export default function SupportChatGate() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileSupportChat /> : <SupportChatPage />
}
