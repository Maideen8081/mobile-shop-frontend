export const productStats = [
  { id: 1, label: 'Total Products', value: 186, icon: 'FiPackage', color: '#8b5cf6', bgGlow: 'rgba(139,92,246,0.12)' },
  { id: 2, label: 'Active Products', value: 162, icon: 'FiCheckCircle', color: '#22c55e', bgGlow: 'rgba(34,197,94,0.12)' },
  { id: 3, label: 'Trending', value: 24, icon: 'FiTrendingUp', color: '#4f6bff', bgGlow: 'rgba(79,107,255,0.12)' },
  { id: 4, label: 'Best Selling', value: 18, icon: 'FiAward', color: '#f59e0b', bgGlow: 'rgba(245,158,11,0.12)' },
  { id: 5, label: 'Low Stock', value: 7, icon: 'FiAlertTriangle', color: '#ef4444', bgGlow: 'rgba(239,68,68,0.12)' },
  { id: 6, label: 'Total Variants', value: 342, icon: 'FiLayers', color: '#06b6d4', bgGlow: 'rgba(6,182,212,0.12)' },
]

export interface Variant {
  id: string
  name: string
  ram: string
  storage: string
  battery: number
  color: string
  processor: string
  display: string
  camera: string
  price: number
  discountPrice: number
  stock: number
  lowStockAlert: number
  images: string[]
}

export interface Product {
  id: number
  name: string
  brand: string
  model: string
  category: string
  subcategory: string
  description: string
  features: string[]
  careInstructions: string[]
  variants: Variant[]
  images?: string[]
  trending: boolean
  newArrival: boolean
  bestSelling: boolean
  featured: boolean
  refurbished: boolean
  status: 'active' | 'inactive'
  rating: number
  sold: number
  created: string
  videoUrl?: string
}

export const ramOptions = ['4GB', '6GB', '8GB', '12GB', '16GB', '24GB', '32GB']
export const storageOptions = ['64GB', '128GB', '256GB', '512GB', '1TB']

export const productsData: Product[] = [
  {
    id: 1, name: 'iPhone 15 Pro Max', brand: 'Apple', model: 'A2849',
    category: 'Smartphones', subcategory: 'iOS Phones',
    description: 'The most powerful iPhone ever with A17 Pro chip, 48MP camera system, and titanium design.',
    features: ['A17 Pro Chip with 6-core GPU', '48MP Main | 12MP Ultra Wide | 12MP Telephoto', '120Hz ProMotion Display', 'Titanium Design', 'USB-C with USB 3', 'Action Button'],
    careInstructions: ['Use original 20W charger', 'Avoid water exposure beyond 6m depth', 'Use microfiber cloth for cleaning', 'Keep away from magnetic strips'],
    variants: [
      { id: 'v1', name: 'Natural Titanium 256GB', ram: '8GB', storage: '256GB', battery: 4441, color: 'Natural Titanium', processor: 'A17 Pro', display: '6.7" Super Retina XDR', camera: '48MP + 12MP + 12MP', price: 159900, discountPrice: 142900, stock: 8, lowStockAlert: 3, images: ['📱'] },
      { id: 'v2', name: 'Blue Titanium 512GB', ram: '8GB', storage: '512GB', battery: 4441, color: 'Blue Titanium', processor: 'A17 Pro', display: '6.7" Super Retina XDR', camera: '48MP + 12MP + 12MP', price: 179900, discountPrice: 162900, stock: 5, lowStockAlert: 3, images: ['📱'] },
      { id: 'v3', name: 'White Titanium 1TB', ram: '8GB', storage: '1TB', battery: 4441, color: 'White Titanium', processor: 'A17 Pro', display: '6.7" Super Retina XDR', camera: '48MP + 12MP + 12MP', price: 199900, discountPrice: 182900, stock: 3, lowStockAlert: 2, images: ['📱'] },
    ],
    trending: true, newArrival: true, bestSelling: true,     featured: true, refurbished: false, status: 'active',
    rating: 4.8, sold: 245, created: '2026-01-15', videoUrl: 'https://cdn.coverr.co/videos/coverr-close-up-of-a-smartphone-display-5682/1080p.mp4',
  },
  {
    id: 2, name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', model: 'SM-S928B',
    category: 'Smartphones', subcategory: 'Android Phones',
    description: 'Galaxy AI is here with the Galaxy S24 Ultra. Built with titanium and the Snapdragon 8 Gen 3.',
    features: ['Snapdragon 8 Gen 3 for Galaxy', '200MP Wide Camera', 'Galaxy AI Features', 'Built-in S Pen', 'Titanium Frame'],
    careInstructions: ['Use Samsung 45W charger', 'Avoid extreme temperatures', 'S Pen care: avoid dust', 'Clean with soft cloth'],
    variants: [
      { id: 'v4', name: 'Titanium Gray 256GB', ram: '12GB', storage: '256GB', battery: 5000, color: 'Titanium Gray', processor: 'Snapdragon 8 Gen 3', display: '6.8" Dynamic AMOLED 2X', camera: '200MP + 50MP + 12MP + 10MP', price: 134999, discountPrice: 114999, stock: 12, lowStockAlert: 5, images: ['📱'] },
      { id: 'v5', name: 'Titanium Black 512GB', ram: '12GB', storage: '512GB', battery: 5000, color: 'Titanium Black', processor: 'Snapdragon 8 Gen 3', display: '6.8" Dynamic AMOLED 2X', camera: '200MP + 50MP + 12MP + 10MP', price: 144999, discountPrice: 124999, stock: 8, lowStockAlert: 3, images: ['📱'] },
      { id: 'v6', name: 'Titanium Violet 1TB', ram: '12GB', storage: '1TB', battery: 5000, color: 'Titanium Violet', processor: 'Snapdragon 8 Gen 3', display: '6.8" Dynamic AMOLED 2X', camera: '200MP + 50MP + 12MP + 10MP', price: 164999, discountPrice: 144999, stock: 5, lowStockAlert: 2, images: ['📱'] },
    ],
    trending: true, newArrival: true, bestSelling: true,     featured: true, refurbished: false, status: 'active',
    rating: 4.7, sold: 212, created: '2026-01-20', videoUrl: 'https://cdn.coverr.co/videos/coverr-close-up-of-a-smartphone-display-5682/1080p.mp4',
  },
  {
    id: 3, name: 'OnePlus 12', brand: 'OnePlus', model: 'CPH2583',
    category: 'Smartphones', subcategory: 'Android Phones',
    description: 'Powered by the Snapdragon 8 Gen 3 with a 50MP Hasselblad triple camera system.',
    features: ['Snapdragon 8 Gen 3', 'Hasselblad 50MP Triple Camera', '100W SuperVOOC Charging', '5400mAh Battery', 'Aqua Touch Display'],
    careInstructions: ['Use 100W SuperVOOC charger', 'Avoid wireless charging with non-certified pads', 'Keep camera lenses clean'],
    variants: [
      { id: 'v7', name: 'Flowy Emerald 256GB', ram: '16GB', storage: '256GB', battery: 5400, color: 'Flowy Emerald', processor: 'Snapdragon 8 Gen 3', display: '6.82" ProXDR', camera: '50MP + 48MP + 64MP', price: 71999, discountPrice: 64999, stock: 22, lowStockAlert: 5, images: ['📱'] },
      { id: 'v8', name: 'Silky Black 512GB', ram: '16GB', storage: '512GB', battery: 5400, color: 'Silky Black', processor: 'Snapdragon 8 Gen 3', display: '6.82" ProXDR', camera: '50MP + 48MP + 64MP', price: 76999, discountPrice: 69999, stock: 20, lowStockAlert: 5, images: ['📱'] },
    ],
    trending: true, newArrival: false, bestSelling: true,     featured: false, refurbished: true, status: 'active',
    rating: 4.6, sold: 178, created: '2026-02-01', videoUrl: 'https://cdn.coverr.co/videos/coverr-close-up-of-a-smartphone-display-5682/1080p.mp4',
  },
  {
    id: 4, name: 'Xiaomi 14 Pro', brand: 'Xiaomi', model: '2312BPC50I',
    category: 'Smartphones', subcategory: 'Android Phones',
    description: 'Professional imaging flagship with Leica optics and Snapdragon 8 Gen 3.',
    features: ['Snapdragon 8 Gen 3', 'Leica Professional Optics', '50MP Triple Camera', '120W HyperCharge', 'IP68 Water Resistant'],
    careInstructions: ['Use 120W HyperCharge charger', 'Avoid water exposure', 'Clean Leica lenses regularly'],
    variants: [
      { id: 'v9', name: 'Black 512GB', ram: '12GB', storage: '512GB', battery: 4880, color: 'Black', processor: 'Snapdragon 8 Gen 3', display: '6.73" AMOLED 2K', camera: '50MP + 50MP + 50MP', price: 79999, discountPrice: 69999, stock: 20, lowStockAlert: 5, images: ['📱'] },
      { id: 'v10', name: 'White 512GB', ram: '12GB', storage: '512GB', battery: 4880, color: 'White', processor: 'Snapdragon 8 Gen 3', display: '6.73" AMOLED 2K', camera: '50MP + 50MP + 50MP', price: 79999, discountPrice: 69999, stock: 15, lowStockAlert: 5, images: ['📱'] },
    ],
    trending: false, newArrival: true, bestSelling: false,     featured: true, refurbished: false, status: 'active',
    rating: 4.5, sold: 92, created: '2026-02-20', videoUrl: 'https://cdn.coverr.co/videos/coverr-close-up-of-a-smartphone-display-5682/1080p.mp4',
  },
  {
    id: 5, name: 'Nothing Phone 3', brand: 'Nothing', model: 'NP3-001',
    category: 'Smartphones', subcategory: 'Android Phones',
    description: 'Pure Android experience with Glyph Interface and flagship camera system.',
    features: ['Glyph Interface', 'Snapdragon 8s Gen 3', '50MP Dual Camera', '45W Fast Charging', 'Nothing OS 3.0'],
    careInstructions: ['Use 45W PD charger', 'Avoid scratching Glyph lights', 'Keep buttons clean'],
    variants: [
      { id: 'v11', name: 'Black 256GB', ram: '12GB', storage: '256GB', battery: 5000, color: 'Black', processor: 'Snapdragon 8s Gen 3', display: '6.7" AMOLED 120Hz', camera: '50MP + 50MP', price: 44999, discountPrice: 39999, stock: 30, lowStockAlert: 10, images: ['📱'] },
      { id: 'v12', name: 'White 256GB', ram: '12GB', storage: '256GB', battery: 5000, color: 'White', processor: 'Snapdragon 8s Gen 3', display: '6.7" AMOLED 120Hz', camera: '50MP + 50MP', price: 44999, discountPrice: 39999, stock: 25, lowStockAlert: 10, images: ['📱'] },
    ],
    trending: true, newArrival: true, bestSelling: false, featured: false, status: 'active',
    rating: 4.3, sold: 67, created: '2026-03-05', videoUrl: 'https://cdn.coverr.co/videos/coverr-close-up-of-a-smartphone-display-5682/1080p.mp4',
  },
  {
    id: 6, name: 'Realme GT 6 Pro', brand: 'Realme', model: 'RMX3851',
    category: 'Smartphones', subcategory: 'Android Phones',
    description: 'Flagship killer with Snapdragon 8 Gen 3 and 120W ultra-fast charging.',
    features: ['Snapdragon 8 Gen 3', '120W SuperVOOC Charging', '5500mAh Battery', '50MP Sony LYT-808', '144Hz Display'],
    careInstructions: ['Use 120W charger only', 'Avoid overcharging', 'Clean USB port periodically'],
    variants: [
      { id: 'v13', name: 'Silver 512GB', ram: '16GB', storage: '512GB', battery: 5500, color: 'Silver', processor: 'Snapdragon 8 Gen 3', display: '6.78" AMOLED 1.5K', camera: '50MP + 50MP + 8MP', price: 49999, discountPrice: 44999, stock: 15, lowStockAlert: 5, images: ['📱'] },
      { id: 'v14', name: 'Green 512GB', ram: '16GB', storage: '512GB', battery: 5500, color: 'Green', processor: 'Snapdragon 8 Gen 3', display: '6.78" AMOLED 1.5K', camera: '50MP + 50MP + 8MP', price: 49999, discountPrice: 44999, stock: 13, lowStockAlert: 5, images: ['📱'] },
    ],
    trending: false, newArrival: false, bestSelling: true, featured: false, refurbished: true, status: 'active',
    rating: 4.4, sold: 134, created: '2026-03-10', videoUrl: 'https://cdn.coverr.co/videos/coverr-close-up-of-a-smartphone-display-5682/1080p.mp4',
  },
]

export const categories = ['Smartphones', 'Accessories', 'Tablets', 'Wearables', 'Audio', 'Smart Home', 'Services']
export const subcategories = ['iOS Phones', 'Android Phones', 'Refurbished', 'Chargers', 'Cables', 'Cases & Covers', 'iPads', 'Android Tablets', 'Smartwatches', 'Fitness Bands', 'Wireless Earbuds', 'Headphones', 'Speakers']
export const brands = ['Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Realme', 'Vivo', 'Oppo', 'Nothing', 'Google', 'Boat', 'Noise']
