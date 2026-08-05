import SearchPage from '../pages/SearchPage'
import MobileSearch from '../components/mobile/MobileSearch'
import { useIsMobile } from '../components/mobile/helpers'

export default function SearchPageGate() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileSearch /> : <SearchPage />
}
