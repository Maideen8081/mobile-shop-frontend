import ProductDetail from '../pages/ProductDetail'
import MobileProductDetail from '../components/mobile/MobileProductDetail'
import { useIsMobile } from '../components/mobile/helpers'

export default function ProductDetailGate() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileProductDetail /> : <ProductDetail />
}
