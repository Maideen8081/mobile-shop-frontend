export interface Product {
  id: number
  name: string
  brand: string
  category: string
  price: number
  oldPrice: number
  discount: number
  rating: number
  reviews: number
  emoji: string
  badge?: string
  colors?: string[]
  storage?: string[]
  ram?: string[]
  inStock: boolean
  isNew?: boolean
  emi?: string
  exchange?: string
  description?: string
  highlights?: string[]
  specs?: Record<string, string>
}

export const products: Product[] = [
  { id: 1, name: 'iPhone 15 Pro Max 256GB', brand: 'Apple', category: 'Smartphones', price: 119900, oldPrice: 134900, discount: 22, rating: 4.9, reviews: 128, emoji: '📱', badge: 'Best Seller', colors: ['#1a1a2e', '#e8e8e8', '#c9a96e'], storage: ['256GB', '512GB', '1TB'], ram: ['8GB'], inStock: true, isNew: false, emi: '₹4,996/mo', exchange: 'Up to ₹60,000 off', description: 'The most powerful iPhone ever. A17 Pro chip, 48MP camera system, titanium design.', highlights: ['A17 Pro Chip', '48MP Camera', 'Titanium Design', 'All-Day Battery'], specs: { 'Chip': 'A17 Pro', 'Display': '6.7" OLED', 'Camera': '48MP + 12MP + 12MP', 'Battery': '29 hrs video' } },
  { id: 2, name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', category: 'Smartphones', price: 99999, oldPrice: 124999, discount: 20, rating: 4.8, reviews: 96, emoji: '📲', badge: 'New Arrival', colors: ['#1a1a2e', '#c9a96e', '#e8e8e8'], storage: ['256GB', '512GB', '1TB'], ram: ['12GB'], inStock: true, isNew: true, emi: '₹4,166/mo', exchange: 'Up to ₹50,000 off', description: 'Galaxy AI is here. The ultimate Galaxy with built-in S Pen.', highlights: ['Galaxy AI', 'S Pen', '200MP Camera', 'Snapdragon 8 Gen 3'], specs: { 'Chip': 'Snapdragon 8 Gen 3', 'Display': '6.8" Dynamic AMOLED', 'Camera': '200MP + 50MP + 12MP + 10MP', 'Battery': '5000 mAh' } },
  { id: 3, name: 'OnePlus 12 5G 256GB', brand: 'OnePlus', category: 'Smartphones', price: 64999, oldPrice: 69999, discount: 15, rating: 4.5, reviews: 67, emoji: '📱', badge: 'Under ₹70k', colors: ['#1a1a2e', '#2d5a27'], storage: ['256GB', '512GB'], ram: ['12GB', '16GB'], inStock: true, isNew: true, emi: '₹2,708/mo', exchange: 'Up to ₹25,000 off', description: 'OnePlus 12. Powered by Snapdragon 8 Gen 3. 50MP camera with Hasselblad.', highlights: ['Snapdragon 8 Gen 3', 'Hasselblad Camera', '100W Charging', '2K Display'], specs: { 'Chip': 'Snapdragon 8 Gen 3', 'Display': '6.82" 2K AMOLED', 'Camera': '50MP + 48MP + 64MP', 'Battery': '5400 mAh' } },
  { id: 4, name: 'Xiaomi 14 Pro', brand: 'Xiaomi', category: 'Smartphones', price: 49999, oldPrice: 59999, discount: 17, rating: 4.4, reviews: 234, emoji: '📱', badge: 'Popular', colors: ['#1a1a2e', '#e8e8e8'], storage: ['256GB', '512GB'], ram: ['12GB'], inStock: true, isNew: false, emi: '₹2,083/mo', exchange: 'Up to ₹20,000 off', description: 'Professional imaging. Leica optics. Snapdragon 8 Gen 3.', highlights: ['Leica Optics', 'Snapdragon 8 Gen 3', '120W HyperCharge', 'IP68'], specs: { 'Chip': 'Snapdragon 8 Gen 3', 'Display': '6.73" LTPO AMOLED', 'Camera': '50MP + 50MP + 50MP', 'Battery': '4880 mAh' } },
  { id: 5, name: 'Realme GT 6', brand: 'Realme', category: 'Smartphones', price: 29999, oldPrice: 36999, discount: 19, rating: 4.3, reviews: 456, emoji: '📱', badge: 'Best Value', storage: ['128GB', '256GB'], ram: ['8GB', '12GB'], inStock: true, emi: '₹1,250/mo', exchange: 'Up to ₹12,000 off', description: 'Flagship killer. 120W charging. 150° Ultra Wide Camera.', highlights: ['120W Charging', '150° Ultra Wide', '120Hz AMOLED', 'Snapdragon 8s Gen 3'] },
  { id: 6, name: 'Apple AirPods Pro 2', brand: 'Apple', category: 'Earbuds', price: 24900, oldPrice: 29900, discount: 17, rating: 4.8, reviews: 890, emoji: '🎧', badge: 'Top Rated', colors: ['#ffffff'], storage: [], ram: [], inStock: true, isNew: false, emi: '₹1,038/mo', description: 'Adaptive Audio. Active Noise Cancellation. USB-C.', highlights: ['Adaptive Audio', 'Active Noise Cancellation', 'USB-C', 'Find My'] },
  { id: 7, name: 'Samsung Galaxy Watch 6', brand: 'Samsung', category: 'Smartwatches', price: 29999, oldPrice: 39999, discount: 25, rating: 4.6, reviews: 345, emoji: '⌚', badge: 'Sale', colors: ['#1a1a2e', '#e8e8e8'], storage: [], ram: [], inStock: true, isNew: false, emi: '₹1,250/mo', description: 'Samsung Galaxy Watch6. Your wellness partner.', highlights: ['Body Composition', 'Sleep Tracking', 'Sapphire Crystal', 'Wear OS'] },
  { id: 8, name: 'boAt Airdopes 141 Pro', brand: 'boAt', category: 'Earbuds', price: 1299, oldPrice: 2999, discount: 57, rating: 4.4, reviews: 3200, emoji: '🎧', badge: 'Almost Sold Out', colors: ['#1a1a2e', '#2d5a27', '#e8e8e8'], storage: [], ram: [], inStock: true, emi: '₹54/mo', description: 'boAt Airdopes 141 Pro with 50H playtime.', highlights: ['50H Playtime', '13mm Drivers', 'ENx Technology', 'IPX5'] },
  { id: 9, name: 'Spigen iPhone 15 Pro Case', brand: 'Spigen', category: 'Accessories', price: 1499, oldPrice: 1999, discount: 25, rating: 4.9, reviews: 1400, emoji: '🛡️', badge: 'Popular', colors: ['#ffffff', '#1a1a2e', '#ff6b6b'], storage: [], ram: [], inStock: true, description: 'Ultra Hybrid clear case. Military-grade protection.', highlights: ['Military Grade', 'Wireless Charging', 'Crystal Clear', '10ft Drop Protection'] },
  { id: 10, name: 'OnePlus Buds 3', brand: 'OnePlus', category: 'Earbuds', price: 3999, oldPrice: 5499, discount: 27, rating: 4.5, reviews: 678, emoji: '🎧', badge: 'New', colors: ['#1a1a2e', '#e8e8e8'], storage: [], ram: [], inStock: true, isNew: true, description: 'OnePlus Buds 3. Dual drivers. 49dB ANC.', highlights: ['Dual Drivers', '49dB ANC', '44H Battery', 'IP55'] },
]

export const categories = [
  { name: 'Mobiles', icon: '📱', count: '120+', color: '#7C3AED' },
  { name: 'Smart Watches', icon: '⌚', count: '45+', color: '#06B6D4' },
  { name: 'Laptops', icon: '💻', count: '60+', color: '#8B5CF6' },
  { name: 'Accessories', icon: '🎧', count: '200+', color: '#F59E0B' },
  { name: 'Earbuds', icon: '🎵', count: '80+', color: '#22C55E' },
  { name: 'Tablets', icon: '📟', count: '35+', color: '#0EA5E9' },
  { name: 'Gaming', icon: '🎮', count: '50+', color: '#EF4444' },
  { name: 'Speakers', icon: '🔊', count: '70+', color: '#9333EA' },
  { name: 'Chargers', icon: '🔋', count: '100+', color: '#F59E0B' },
]

export const brands = [
  { name: 'Apple', color: '#1a1a2e', icon: '🍎' },
  { name: 'Samsung', color: '#1428A0', icon: '📱' },
  { name: 'Xiaomi', color: '#FF6900', icon: '📱' },
  { name: 'OnePlus', color: '#EB0028', icon: '📱' },
  { name: 'Vivo', color: '#415FFF', icon: '📱' },
  { name: 'Oppo', color: '#1A6B3C', icon: '📱' },
  { name: 'Realme', color: '#FFD100', icon: '📱' },
  { name: 'Motorola', color: '#007AFF', icon: '📱' },
]

export const whyChooseUs = [
  { icon: '🚚', title: 'Fast Delivery', desc: 'Free delivery on orders above ₹999. Same day delivery in select cities.' },
  { icon: '✅', title: 'Genuine Products', desc: '100% authentic products with manufacturer warranty and bill.' },
  { icon: '🔄', title: 'Easy Returns', desc: '7-day hassle-free return policy. Pickup from your doorstep.' },
  { icon: '🔒', title: 'Secure Payment', desc: 'SSL encrypted. All major cards, UPI, Net Banking accepted.' },
  { icon: '🛡️', title: '1 Year Warranty', desc: 'All products come with manufacturer warranty and service center support.' },
  { icon: '💬', title: '24/7 Support', desc: 'Round-the-clock customer support via chat, email, and phone.' },
]

export const reviews = [
  { name: 'Priya Sharma', initials: 'PS', rating: 5, text: 'Absolutely love my new iPhone 15 Pro Max! The delivery was super fast and the price was the best I could find anywhere.', avatar: null },
  { name: 'Rahul Verma', initials: 'RV', rating: 5, text: 'Got my Galaxy S24 Ultra at ₹10,000 less than retail. Genuine product with full warranty. Highly recommended!', avatar: null },
  { name: 'Ananya Reddy', initials: 'AR', rating: 5, text: 'The earbuds I ordered were delivered within 24 hours. Great packaging and genuine product. Will shop again!', avatar: null },
  { name: 'Vikram Singh', initials: 'VS', rating: 4, text: 'Excellent collection of mobile accessories. Found a case that wasn\'t available anywhere else. Very impressed.', avatar: null },
  { name: 'Neha Gupta', initials: 'NG', rating: 5, text: 'Bought a OnePlus 12 for my brother. The exchange offer saved us ₹25,000! Amazing deal and smooth process.', avatar: null },
]

export const featuredCollections = [
  { title: 'iPhone 15 Series', sub: 'Starting ₹59,999', emoji: '📱', gradient: 'from-[#7C3AED] via-[#6D28D9] to-[#4C1D95]', btn: 'Shop iPhones', badge: 'New' },
  { title: 'Gaming Phones', sub: 'Up to 24GB RAM', emoji: '🎮', gradient: 'from-[#DC2626] via-[#B91C1C] to-[#991B1B]', btn: 'Explore Gaming', badge: 'Hot' },
  { title: 'Budget Phones', sub: 'Starting ₹6,999', emoji: '📱', gradient: 'from-[#059669] via-[#047857] to-[#065F46]', btn: 'View Budget', badge: 'Value' },
  { title: 'Premium Audio', sub: 'Up to 60% Off', emoji: '🎧', gradient: 'from-[#2563EB] via-[#1D4ED8] to-[#1E40AF]', btn: 'Shop Audio', badge: 'Sale' },
]

export interface OnlineProduct {
  id: number
  name: string
  brand: string
  category: string
  price: number
  oldPrice: number
  discountPercent: number
  rating: number
  reviews: number
  emoji: string
  image: string
  published: boolean
  flashSale: boolean
}

export const onlineProducts: OnlineProduct[] = [
  { id: 1, name: 'iPhone 15 Pro Max 256GB', brand: 'Apple', category: 'Smartphone', price: 119900, oldPrice: 134900, discountPercent: 11, rating: 4.9, reviews: 128, emoji: '📱', image: '📱', published: true, flashSale: true },
  { id: 2, name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', category: 'Smartphone', price: 99999, oldPrice: 124999, discountPercent: 20, rating: 4.8, reviews: 96, emoji: '📲', image: '📲', published: true, flashSale: false },
  { id: 3, name: 'boAt Airdopes 141 Pro', brand: 'boAt', category: 'Audio', price: 1299, oldPrice: 2999, discountPercent: 57, rating: 4.4, reviews: 3200, emoji: '🎧', image: '🎧', published: true, flashSale: true },
  { id: 4, name: 'Apple AirPods Pro 2', brand: 'Apple', category: 'Audio', price: 24900, oldPrice: 29900, discountPercent: 17, rating: 4.8, reviews: 890, emoji: '🎧', image: '🎧', published: true, flashSale: false },
  { id: 5, name: 'Samsung Galaxy Watch 6', brand: 'Samsung', category: 'Wearable', price: 29999, oldPrice: 39999, discountPercent: 25, rating: 4.6, reviews: 345, emoji: '⌚', image: '⌚', published: false, flashSale: false },
  { id: 6, name: 'iPad Air M2', brand: 'Apple', category: 'Tablet', price: 59900, oldPrice: 69900, discountPercent: 14, rating: 4.7, reviews: 234, emoji: '📟', image: '📟', published: true, flashSale: true },
]

export interface InventoryItem {
  id: number
  name: string
  sku: string
  category: string
  stock: number
  synced: boolean
  lastSync: string
}

export const inventoryItems: InventoryItem[] = [
  { id: 1, name: 'iPhone 15 Pro Max 256GB', sku: 'APL-IP15PM-256', category: 'Smartphones', stock: 45, synced: true, lastSync: '15 Apr 2026, 10:30 AM' },
  { id: 2, name: 'Samsung Galaxy S24 Ultra', sku: 'SAM-S24U-512', category: 'Smartphones', stock: 32, synced: true, lastSync: '15 Apr 2026, 10:30 AM' },
  { id: 3, name: 'boAt Airdopes 141 Pro', sku: 'BOAT-AD141P', category: 'Audio', stock: 120, synced: true, lastSync: '15 Apr 2026, 10:30 AM' },
  { id: 4, name: 'Apple AirPods Pro 2', sku: 'APL-AIRP2', category: 'Audio', stock: 28, synced: false, lastSync: '12 Apr 2026, 02:15 PM' },
  { id: 5, name: 'Samsung Galaxy Watch 6', sku: 'SAM-GW6-44', category: 'Wearables', stock: 15, synced: true, lastSync: '15 Apr 2026, 10:30 AM' },
  { id: 6, name: 'OnePlus 12 5G 256GB', sku: 'OP-12-256', category: 'Smartphones', stock: 0, synced: true, lastSync: '14 Apr 2026, 04:00 PM' },
  { id: 7, name: 'Spigen iPhone 15 Case', sku: 'SPG-IP15-UC', category: 'Accessories', stock: 200, synced: false, lastSync: '10 Apr 2026, 09:45 AM' },
  { id: 8, name: 'Xiaomi 14 Pro', sku: 'XMI-14P-256', category: 'Smartphones', stock: 18, synced: true, lastSync: '15 Apr 2026, 10:30 AM' },
]

export interface OnlineOrder {
  id: number
  orderId: string
  customerName: string
  customerMobile: string
  total: number
  subtotal?: number
  shipping?: number
  tax?: number
  discount?: number
  couponCode?: string
  deliveryStatus: string
  paymentStatus: string
  paymentMethod: string
  products: { name: string; qty: number; price?: number }[]
  deliveryPartner: string
  trackingId: string
  deliveryAddress: string
  estDelivery: string
  deliveredAt?: string
}

export const onlineOrders: OnlineOrder[] = [
  { id: 1, orderId: 'ORD-2026-001', customerName: 'Rahul Sharma', customerMobile: '+91 98765 43210', total: 119900, deliveryStatus: 'Delivered', paymentStatus: 'Paid', paymentMethod: 'Credit Card', products: [{ name: 'iPhone 15 Pro Max 256GB', qty: 1 }], deliveryPartner: 'BlueDart', trackingId: 'BD-3847291', deliveryAddress: '42, MG Road, Bangalore - 560001', estDelivery: '12 Apr 2026', deliveredAt: '11 Apr 2026, 03:45 PM' },
  { id: 2, orderId: 'ORD-2026-002', customerName: 'Priya Patel', customerMobile: '+91 87654 32109', total: 1299, deliveryStatus: 'Out for Delivery', paymentStatus: 'Paid', paymentMethod: 'UPI', products: [{ name: 'boAt Airdopes 141 Pro', qty: 2 }], deliveryPartner: 'Delhivery', trackingId: 'DL-5628390', deliveryAddress: '15, Park Street, Mumbai - 400001', estDelivery: '16 Apr 2026' },
  { id: 3, orderId: 'ORD-2026-003', customerName: 'Amit Singh', customerMobile: '+91 76543 21098', total: 24900, deliveryStatus: 'Shipped', paymentStatus: 'Paid', paymentMethod: 'Net Banking', products: [{ name: 'Apple AirPods Pro 2', qty: 1 }], deliveryPartner: 'FedEx', trackingId: 'FX-9012345', deliveryAddress: '88, Connaught Place, New Delhi - 110001', estDelivery: '18 Apr 2026' },
  { id: 4, orderId: 'ORD-2026-004', customerName: 'Neha Gupta', customerMobile: '+91 65432 10987', total: 29999, deliveryStatus: 'Packed', paymentStatus: 'Pending', paymentMethod: 'COD', products: [{ name: 'Samsung Galaxy Watch 6', qty: 1 }], deliveryPartner: 'BlueDart', trackingId: 'BD-4728190', deliveryAddress: '7, Jubilee Hills, Hyderabad - 500033', estDelivery: '19 Apr 2026' },
  { id: 5, orderId: 'ORD-2026-005', customerName: 'Vikram Joshi', customerMobile: '+91 54321 09876', total: 64999, deliveryStatus: 'Order Placed', paymentStatus: 'Pending', paymentMethod: 'COD', products: [{ name: 'OnePlus 12 5G 256GB', qty: 1 }], deliveryPartner: 'Delhivery', trackingId: 'DL-6738490', deliveryAddress: '21, Koregaon Park, Pune - 411001', estDelivery: '20 Apr 2026' },
  { id: 6, orderId: 'ORD-2026-006', customerName: 'Ananya Reddy', customerMobile: '+91 43210 98765', total: 99999, deliveryStatus: 'Cancelled', paymentStatus: 'Refunded', paymentMethod: 'Credit Card', products: [{ name: 'Samsung Galaxy S24 Ultra', qty: 1 }], deliveryPartner: 'FedEx', trackingId: 'FX-7834561', deliveryAddress: '55, Nungambakkam, Chennai - 600034', estDelivery: 'N/A', deliveredAt: '13 Apr 2026, 10:00 AM' },
  { id: 7, orderId: 'ORD-2026-007', customerName: 'Arun Verma', customerMobile: '+91 32109 87654', total: 49999, deliveryStatus: 'Delivered', paymentStatus: 'Paid', paymentMethod: 'UPI', products: [{ name: 'Xiaomi 14 Pro', qty: 1 }], deliveryPartner: 'BlueDart', trackingId: 'BD-1928374', deliveryAddress: '12, BTM Layout, Bangalore - 560076', estDelivery: '10 Apr 2026', deliveredAt: '09 Apr 2026, 02:30 PM' },
  { id: 8, orderId: 'ORD-2026-008', customerName: 'Kavita Nair', customerMobile: '+91 21098 76543', total: 1499, deliveryStatus: 'Delivered', paymentStatus: 'Paid', paymentMethod: 'Debit Card', products: [{ name: 'Spigen iPhone 15 Pro Case', qty: 1 }, { name: 'boAt Airdopes 141 Pro', qty: 1 }], deliveryPartner: 'Delhivery', trackingId: 'DL-5627381', deliveryAddress: '3, Banjara Hills, Hyderabad - 500034', estDelivery: '08 Apr 2026', deliveredAt: '07 Apr 2026, 11:15 AM' },
  { id: 9, orderId: 'ORD-2026-009', customerName: 'Rohit Malhotra', customerMobile: '+91 10987 65432', total: 3999, deliveryStatus: 'Shipped', paymentStatus: 'Paid', paymentMethod: 'UPI', products: [{ name: 'OnePlus Buds 3', qty: 1 }], deliveryPartner: 'FedEx', trackingId: 'FX-8901234', deliveryAddress: '9, Sector 62, Noida - 201301', estDelivery: '17 Apr 2026' },
  { id: 10, orderId: 'ORD-2026-010', customerName: 'Sneha Kapoor', customerMobile: '+91 99887 76655', total: 89898, deliveryStatus: 'Out for Delivery', paymentStatus: 'Paid', paymentMethod: 'Net Banking', products: [{ name: 'iPhone 15 Pro Max 256GB', qty: 1 }, { name: 'Spigen iPhone 15 Pro Case', qty: 1 }], deliveryPartner: 'BlueDart', trackingId: 'BD-6473829', deliveryAddress: '25, Andheri West, Mumbai - 400053', estDelivery: '16 Apr 2026' },
]

export interface RepairBooking {
  id: number
  bookingId: string
  customerName: string
  deviceBrand: string
  deviceModel: string
  issue: string
  status: string
  bookingDate: string
  timeSlot: string
  assignedTechnician?: string
}

export const repairBookings: RepairBooking[] = [
  { id: 1, bookingId: 'RB-2026-001', customerName: 'Rahul Sharma', deviceBrand: 'Apple', deviceModel: 'iPhone 15 Pro Max', issue: 'Battery draining fast, needs replacement', status: 'Pending', bookingDate: '15 Apr 2026', timeSlot: '10:00 - 12:00' },
  { id: 2, bookingId: 'RB-2026-002', customerName: 'Priya Patel', deviceBrand: 'Samsung', deviceModel: 'Galaxy S24 Ultra', issue: 'Screen cracked after drop', status: 'Approved', bookingDate: '14 Apr 2026', timeSlot: '14:00 - 16:00', assignedTechnician: 'Rajesh Kumar' },
  { id: 3, bookingId: 'RB-2026-003', customerName: 'Amit Singh', deviceBrand: 'OnePlus', deviceModel: 'OnePlus 12', issue: 'Charging port not working', status: 'Assigned', bookingDate: '13 Apr 2026', timeSlot: '11:00 - 13:00', assignedTechnician: 'Suresh Verma' },
  { id: 4, bookingId: 'RB-2026-004', customerName: 'Neha Gupta', deviceBrand: 'Xiaomi', deviceModel: '14 Pro', issue: 'Camera glass broken', status: 'Picked Up', bookingDate: '12 Apr 2026', timeSlot: '16:00 - 18:00', assignedTechnician: 'Amit Singh' },
  { id: 5, bookingId: 'RB-2026-005', customerName: 'Vikram Joshi', deviceBrand: 'Realme', deviceModel: 'GT 6', issue: 'Software update failure, phone stuck in boot loop', status: 'In Progress', bookingDate: '11 Apr 2026', timeSlot: '09:00 - 11:00', assignedTechnician: 'Vijay Kumar' },
  { id: 6, bookingId: 'RB-2026-006', customerName: 'Ananya Reddy', deviceBrand: 'Apple', deviceModel: 'iPhone 15 Pro', issue: 'Face ID not working after screen replacement', status: 'Completed', bookingDate: '08 Apr 2026', timeSlot: '10:00 - 12:00', assignedTechnician: 'Priya Sharma' },
  { id: 7, bookingId: 'RB-2026-007', customerName: 'Arun Verma', deviceBrand: 'Samsung', deviceModel: 'Galaxy Watch 6', issue: 'Battery not lasting more than 6 hours', status: 'Completed', bookingDate: '07 Apr 2026', timeSlot: '15:00 - 17:00', assignedTechnician: 'Rajesh Kumar' },
  { id: 8, bookingId: 'RB-2026-008', customerName: 'Kavita Nair', deviceBrand: 'boAt', deviceModel: 'Airdopes 141 Pro', issue: 'Left earbud not charging', status: 'Cancelled', bookingDate: '06 Apr 2026', timeSlot: '11:00 - 12:00' },
  { id: 9, bookingId: 'RB-2026-009', customerName: 'Rohit Malhotra', deviceBrand: 'OnePlus', deviceModel: 'Buds 3', issue: 'Connectivity issues with Bluetooth', status: 'Pending', bookingDate: '15 Apr 2026', timeSlot: '14:00 - 16:00' },
  { id: 10, bookingId: 'RB-2026-010', customerName: 'Sneha Kapoor', deviceBrand: 'Apple', deviceModel: 'iPhone 14 Pro', issue: 'Back glass shattered', status: 'Approved', bookingDate: '14 Apr 2026', timeSlot: '10:00 - 12:00', assignedTechnician: 'Suresh Verma' },
  { id: 11, bookingId: 'RB-2026-011', customerName: 'Deepak Gupta', deviceBrand: 'Vivo', deviceModel: 'V30 Pro', issue: 'Overheating while charging', status: 'Pending', bookingDate: '15 Apr 2026', timeSlot: '16:00 - 18:00' },
  { id: 12, bookingId: 'RB-2026-012', customerName: 'Meera Iyer', deviceBrand: 'Oppo', deviceModel: 'Reno 11 Pro', issue: 'IMEI corrupted after flash', status: 'In Progress', bookingDate: '10 Apr 2026', timeSlot: '09:00 - 11:00', assignedTechnician: 'Vijay Kumar' },
]

export interface WebsiteAnalyticsData {
  visitors: { day: string; visitors: number; pageViews: number }[]
  deviceBreakdown: { name: string; value: number; color: string }[]
  topPages: { page: string; views: number; bounceRate: number }[]
}

export const websiteAnalyticsData: WebsiteAnalyticsData = {
  visitors: [
    { day: 'Mon', visitors: 1240, pageViews: 4200 },
    { day: 'Tue', visitors: 1380, pageViews: 4800 },
    { day: 'Wed', visitors: 1560, pageViews: 5300 },
    { day: 'Thu', visitors: 1420, pageViews: 4900 },
    { day: 'Fri', visitors: 1850, pageViews: 6100 },
    { day: 'Sat', visitors: 2200, pageViews: 7800 },
    { day: 'Sun', visitors: 1980, pageViews: 6900 },
  ],
  deviceBreakdown: [
    { name: 'Mobile', value: 65, color: '#4f6bff' },
    { name: 'Desktop', value: 22, color: '#8b5cf6' },
    { name: 'Tablet', value: 10, color: '#22c55e' },
    { name: 'Other', value: 3, color: '#f59e0b' },
  ],
  topPages: [
    { page: '/shop', views: 12800, bounceRate: 28 },
    { page: '/products/iphone-15', views: 8400, bounceRate: 22 },
    { page: '/offers', views: 6200, bounceRate: 35 },
    { page: '/checkout', views: 4100, bounceRate: 18 },
    { page: '/repair-booking', views: 3200, bounceRate: 42 },
  ],
}

export interface EcommerceKPI {
  id: number
  title: string
  value: number
  prefix?: string
  suffix?: string
  growth: number
  trend: 'up' | 'down'
  subtitle: string
  color: string
  bgGlow: string
  icon: string
}

export const ecommerceKPIs: EcommerceKPI[] = [
  { id: 1, title: 'Total Orders', value: 2847, prefix: '', suffix: '', growth: 12.5, trend: 'up', subtitle: 'vs last month', color: '#4f6bff', bgGlow: 'rgba(79,107,255,0.12)', icon: 'FiShoppingCart' },
  { id: 2, title: 'Revenue', value: 4250000, prefix: '₹', suffix: '', growth: 8.3, trend: 'up', subtitle: 'vs last month', color: '#22c55e', bgGlow: 'rgba(34,197,94,0.12)', icon: 'FiTrendingUp' },
  { id: 3, title: 'In Transit', value: 184, prefix: '', suffix: '', growth: 3.2, trend: 'up', subtitle: 'active deliveries', color: '#f59e0b', bgGlow: 'rgba(245,158,11,0.12)', icon: 'FiTruck' },
  { id: 4, title: 'Returns', value: 38, prefix: '', suffix: '', growth: 5.1, trend: 'down', subtitle: 'vs last month', color: '#ef4444', bgGlow: 'rgba(239,68,68,0.12)', icon: 'FiRefreshCw' },
]

export interface EcommerceNavItem {
  id: string
  label: string
  icon: string
  path: string
}

export const ecommerceNavItems: EcommerceNavItem[] = [
  { id: 'ecom-dashboard', label: 'Dashboard', icon: 'FiShoppingCart', path: '/ecommerce-dashboard' },
  { id: 'online-orders', label: 'Online Orders', icon: 'FiShoppingBag', path: '/online-orders' },
  { id: 'delivery-tracking', label: 'Delivery Tracking', icon: 'FiTruck', path: '/delivery-tracking' },
  { id: 'online-store', label: 'Online Store', icon: 'FiGrid', path: '/online-store' },
  { id: 'inventory', label: 'Product Sync', icon: 'FiRefreshCw', path: '/product-sync' },
  { id: 'analytics', label: 'Analytics', icon: 'FiTrendingUp', path: '/analytics' },
  { id: 'repair-booking', label: 'Repair Booking', icon: 'FiTool', path: '/repair-booking' },
]
