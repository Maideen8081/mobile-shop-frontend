import CollectionPage from '../pages/CollectionPage'
import MobileCollection from '../components/mobile/MobileCollection'
import { useIsMobile } from '../components/mobile/helpers'

export default function CollectionGate() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileCollection /> : <CollectionPage />
}
