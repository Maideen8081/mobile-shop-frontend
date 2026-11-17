import { Search, Mic, Camera } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function MobileSearchBar() {
  const navigate = useNavigate()
  return (
    <div className="px-3.5 mt-3 pb-1">
      <button
        onClick={() => navigate('/search')}
        className="flex items-center gap-2.5 w-full h-12 bg-white rounded-2xl px-4 active:scale-[0.99] transition shadow-[0_6px_18px_rgba(29,37,34,0.12)] border border-[#ece9e2]"
        aria-label="Search"
      >
        <Search size={20} className="text-[#0f3b2c] flex-shrink-0" />
        <span className="flex-1 text-left text-body-sm text-[#5d6762] truncate font-medium">
          Search products, brands, categories...
        </span>
        <span className="flex items-center gap-2.5 pl-1">
          <Mic size={19} className="text-[#0f3b2c] flex-shrink-0" />
          <span className="w-px h-5 bg-[#ece9e2]" />
          <Camera size={19} className="text-[#5d6762] flex-shrink-0" />
        </span>
      </button>
    </div>
  )
}
