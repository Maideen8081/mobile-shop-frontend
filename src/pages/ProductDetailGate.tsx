import { Component, type ReactNode } from 'react'
import ProductDetail from '../pages/ProductDetail'
import MobileProductDetail from '../components/mobile/MobileProductDetail'
import { useIsMobile } from '../components/mobile/helpers'

class GateErrorBoundary extends Component<{ children: ReactNode }> {
  state = { hasError: false, error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white max-w-[480px] mx-auto flex flex-col items-center justify-center p-8 text-center font-sans">
          <p className="text-[15px] font-bold text-[#1F2937] mb-2">Something went wrong</p>
          <p className="text-[13px] text-[#6B7280] mb-6">Please try refreshing the page.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2.5 rounded-full text-white text-[13px] font-bold" style={{ background: 'linear-gradient(135deg,#CB202D,#A81D2A)' }}>Refresh</button>
        </div>
      )
    }
    return this.props.children
  }
}

function GateInner() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileProductDetail /> : <ProductDetail />
}

export default function ProductDetailGate() {
  return (
    <GateErrorBoundary>
      <GateInner />
    </GateErrorBoundary>
  )
}
