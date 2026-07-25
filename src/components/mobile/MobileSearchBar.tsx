import { Search, Mic, Camera } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function MobileSearchBar() {
  const navigate = useNavigate()
  return (
    <div className="px-3.5 mt-3 pb-1">
      <button
        onClick={() => navigate('/search')}
        className="flex items-center gap-2.5 w-full h-12 bg-white rounded-2xl px-4 active:scale-[0.99] transition shadow-[0_6px_18px_rgba(15,23,42,0.12)] border border-[#EEF1F4]"
        aria-label="Search"
      >
        <Search size={20} className="text-[#CB202D] flex-shrink-0" />
        <span className="flex-1 text-left text-[14px] text-[#6B7280] truncate font-medium">
          Search products, brands, categories...
        </span>
        <span className="flex items-center gap-2.5 pl-1">
          <Mic size={19} className="text-[#CB202D] flex-shrink-0" />
          <span className="w-px h-5 bg-[#EEF1F4]" />
          <Camera size={19} className="text-[#6B7280] flex-shrink-0" />
        </span>
      </button>
    </div>
  )
}
