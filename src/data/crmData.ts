export interface Customer {
  id: number
  name: string
  mobile: string
  email: string
  avatar: string
  joinDate: string
  lastVisit: string
  totalPurchases: number
  totalSpent: number
  repairCount: number
  loyaltyPoints: number
  loyaltyTier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum'
  vip: boolean
  birthday: string
  city: string
  status: 'active' | 'inactive' | 'blocked'
  satisfactionScore: number
  tags: string[]
  preferredBrand: string
  totalReviews: number
  avgRating: number
  lastPurchaseDate: string
  lastPurchaseAmount: number
  pendingRepairs: number
  customerSince: string
}

export interface LoyaltyTier {
  id: string
  name: string
  minPoints: number
  maxPoints: number
  cashback: number
  color: string
  bgGradient: string
  benefits: string[]
  icon: string
}

export interface LoyaltyTransaction {
  id: number
  customerId: number
  customerName: string
  type: 'earned' | 'redeemed' | 'bonus' | 'referral'
  points: number
  description: string
  date: string
  balance: number
}

export interface Campaign {
  id: number
  title: string
  type: 'whatsapp' | 'sms' | 'offer' | 'festival' | 'flash_sale' | 'new_arrival'
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'cancelled'
  audience: string
  targetCustomers: number
  reached: number
  opened: number
  conversions: number
  message: string
  offerDetails: string
  scheduleDate: string
  createdAt: string
  budget: number
  roi: number
  media: string[]
}

export interface ReviewRequest {
  id: number
  customerId: number
  customerName: string
  customerMobile: string
  serviceType: 'purchase' | 'repair'
  serviceId: string
  sentDate: string
  status: 'pending' | 'completed' | 'declined'
  rating: number | null
  review: string | null
  respondedAt: string | null
  channel: 'whatsapp' | 'sms'
}

export interface BirthdayOffer {
  id: number
  customerId: number
  customerName: string
  customerMobile: string
  birthday: string
  offer: string
  couponCode: string
  discount: number
  sent: boolean
  sentDate: string | null
  claimed: boolean
  claimedDate: string | null
  autoSend: boolean
}

export interface CRMKPI {
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
  sparkline: number[]
}

export const crmKPIs: CRMKPI[] = [
  { id: 1, title: 'Total Customers', value: 2847, growth: 14.2, trend: 'up', subtitle: 'vs last month', color: '#8b5cf6', bgGlow: 'rgba(139,92,246,0.12)', icon: 'FiUsers', sparkline: [1800, 1950, 2100, 2280, 2400, 2550, 2680, 2750, 2800, 2847] },
  { id: 2, title: 'New Customers (Month)', value: 128, growth: 22.5, trend: 'up', subtitle: 'this month', color: '#4f6bff', bgGlow: 'rgba(79,107,255,0.12)', icon: 'FiUserPlus', sparkline: [65, 72, 88, 95, 85, 105, 98, 112, 120, 128] },
  { id: 3, title: 'Returning Customers', value: 68, suffix: '%', growth: 5.8, trend: 'up', subtitle: 'of total customers', color: '#22c55e', bgGlow: 'rgba(34,197,94,0.12)', icon: 'FiRefreshCw', sparkline: [52, 55, 58, 60, 62, 64, 65, 66, 67, 68] },
  { id: 4, title: 'VIP Customers', value: 142, growth: 18.3, trend: 'up', subtitle: 'platinum tier', color: '#f59e0b', bgGlow: 'rgba(245,158,11,0.12)', icon: 'FiStar', sparkline: [85, 92, 100, 108, 115, 122, 130, 135, 140, 142] },
  { id: 5, title: 'Loyalty Points Redeemed', value: 45200, growth: 32.1, trend: 'up', subtitle: 'this quarter', color: '#06b6d4', bgGlow: 'rgba(6,182,212,0.12)', icon: 'FiAward', sparkline: [12000, 18000, 22000, 28000, 32000, 35000, 38000, 41000, 43000, 45200] },
  { id: 6, title: 'Active Campaigns', value: 8, growth: 14.3, trend: 'up', subtitle: '3 scheduled', color: '#ef4444', bgGlow: 'rgba(239,68,68,0.12)', icon: 'FiSend', sparkline: [3, 4, 5, 4, 6, 5, 7, 6, 8, 8] },
  { id: 7, title: 'WhatsApp Reach', value: 18500, growth: 45.2, trend: 'up', subtitle: 'campaign reach', color: '#14b8a6', bgGlow: 'rgba(20,184,166,0.12)', icon: 'FiMessageCircle', sparkline: [5000, 7200, 8500, 10200, 11800, 13500, 14800, 16200, 17500, 18500] },
  { id: 8, title: 'Avg Customer Rating', value: 4.7, suffix: '', growth: 2.1, trend: 'up', subtitle: 'from 1,850 reviews', color: '#f97316', bgGlow: 'rgba(249,115,22,0.12)', icon: 'FiThumbsUp', sparkline: [4.2, 4.3, 4.3, 4.4, 4.5, 4.5, 4.6, 4.6, 4.7, 4.7] },
]

export const customers: Customer[] = [
  { id: 1, name: 'Arun Kumar', mobile: '+91 98765 43210', email: 'arun.k@email.com', avatar: 'AK', joinDate: '2024-01-15', lastVisit: '2026-05-07', totalPurchases: 24, totalSpent: 485000, repairCount: 3, loyaltyPoints: 4850, loyaltyTier: 'Platinum', vip: true, birthday: '1990-05-12', city: 'Mumbai', status: 'active', satisfactionScore: 98, tags: ['VIP', 'Frequent Buyer', 'Early Adopter'], preferredBrand: 'Apple', totalReviews: 8, avgRating: 4.9, lastPurchaseDate: '2026-05-01', lastPurchaseAmount: 18500, pendingRepairs: 0, customerSince: '2024-01-15' },
  { id: 2, name: 'Priya Sharma', mobile: '+91 87654 32109', email: 'priya.s@email.com', avatar: 'PS', joinDate: '2024-03-22', lastVisit: '2026-05-08', totalPurchases: 15, totalSpent: 225000, repairCount: 5, loyaltyPoints: 2250, loyaltyTier: 'Gold', vip: false, birthday: '1992-08-25', city: 'Delhi', status: 'active', satisfactionScore: 95, tags: ['Regular', 'Repair'], preferredBrand: 'Samsung', totalReviews: 5, avgRating: 4.7, lastPurchaseDate: '2026-04-28', lastPurchaseAmount: 4500, pendingRepairs: 1, customerSince: '2024-03-22' },
  { id: 3, name: 'Rohit Verma', mobile: '+91 76543 21098', email: 'rohit.v@email.com', avatar: 'RV', joinDate: '2024-06-10', lastVisit: '2026-04-30', totalPurchases: 8, totalSpent: 98000, repairCount: 1, loyaltyPoints: 980, loyaltyTier: 'Silver', vip: false, birthday: '1988-12-03', city: 'Bangalore', status: 'active', satisfactionScore: 88, tags: ['Occasional'], preferredBrand: 'OnePlus', totalReviews: 2, avgRating: 4.5, lastPurchaseDate: '2026-03-15', lastPurchaseAmount: 12000, pendingRepairs: 0, customerSince: '2024-06-10' },
  { id: 4, name: 'Neha Gupta', mobile: '+91 65432 10987', email: 'neha.g@email.com', avatar: 'NG', joinDate: '2024-02-05', lastVisit: '2026-05-06', totalPurchases: 18, totalSpent: 312000, repairCount: 2, loyaltyPoints: 3120, loyaltyTier: 'Gold', vip: false, birthday: '1995-04-18', city: 'Pune', status: 'active', satisfactionScore: 92, tags: ['Frequent Buyer', 'Accessories'], preferredBrand: 'Apple', totalReviews: 4, avgRating: 4.6, lastPurchaseDate: '2026-04-20', lastPurchaseAmount: 8500, pendingRepairs: 0, customerSince: '2024-02-05' },
  { id: 5, name: 'Vikram Patel', mobile: '+91 54321 09876', email: 'vikram.p@email.com', avatar: 'VP', joinDate: '2024-08-18', lastVisit: '2026-04-25', totalPurchases: 5, totalSpent: 52000, repairCount: 0, loyaltyPoints: 520, loyaltyTier: 'Bronze', vip: false, birthday: '1991-07-22', city: 'Ahmedabad', status: 'active', satisfactionScore: 82, tags: ['New'], preferredBrand: 'Xiaomi', totalReviews: 1, avgRating: 4.2, lastPurchaseDate: '2026-02-10', lastPurchaseAmount: 15000, pendingRepairs: 0, customerSince: '2024-08-18' },
  { id: 6, name: 'Ananya Gupta', mobile: '+91 99887 76655', email: 'ananya.g@email.com', avatar: 'AG', joinDate: '2024-04-12', lastVisit: '2026-05-08', totalPurchases: 12, totalSpent: 178000, repairCount: 1, loyaltyPoints: 1780, loyaltyTier: 'Silver', vip: false, birthday: '1993-11-08', city: 'Chennai', status: 'active', satisfactionScore: 90, tags: ['Regular'], preferredBrand: 'Samsung', totalReviews: 3, avgRating: 4.4, lastPurchaseDate: '2026-04-15', lastPurchaseAmount: 6500, pendingRepairs: 0, customerSince: '2024-04-12' },
  { id: 7, name: 'Rajesh Kumar', mobile: '+91 88776 65544', email: 'rajesh.k@email.com', avatar: 'RK', joinDate: '2023-11-05', lastVisit: '2026-05-05', totalPurchases: 32, totalSpent: 685000, repairCount: 6, loyaltyPoints: 6850, loyaltyTier: 'Platinum', vip: true, birthday: '1985-02-14', city: 'Mumbai', status: 'active', satisfactionScore: 97, tags: ['VIP', 'Frequent Buyer', 'Family'], preferredBrand: 'Apple', totalReviews: 12, avgRating: 4.8, lastPurchaseDate: '2026-04-25', lastPurchaseAmount: 32000, pendingRepairs: 1, customerSince: '2023-11-05' },
  { id: 8, name: 'Sneha Reddy', mobile: '+91 77665 54433', email: 'sneha.r@email.com', avatar: 'SR', joinDate: '2024-07-20', lastVisit: '2026-05-03', totalPurchases: 10, totalSpent: 142000, repairCount: 2, loyaltyPoints: 1420, loyaltyTier: 'Silver', vip: false, birthday: '1994-09-30', city: 'Hyderabad', status: 'active', satisfactionScore: 86, tags: ['Occasional'], preferredBrand: 'OnePlus', totalReviews: 2, avgRating: 4.3, lastPurchaseDate: '2026-03-28', lastPurchaseAmount: 3200, pendingRepairs: 0, customerSince: '2024-07-20' },
  { id: 9, name: 'Amit Singh', mobile: '+91 66554 43322', email: 'amit.s@email.com', avatar: 'AS', joinDate: '2024-09-01', lastVisit: '2026-04-20', totalPurchases: 3, totalSpent: 28000, repairCount: 0, loyaltyPoints: 280, loyaltyTier: 'Bronze', vip: false, birthday: '1996-06-15', city: 'Lucknow', status: 'inactive', satisfactionScore: 75, tags: ['New', 'Low Engagement'], preferredBrand: 'Realme', totalReviews: 0, avgRating: 0, lastPurchaseDate: '2025-12-20', lastPurchaseAmount: 8000, pendingRepairs: 0, customerSince: '2024-09-01' },
  { id: 10, name: 'Meera Joshi', mobile: '+91 55443 32211', email: 'meera.j@email.com', avatar: 'MJ', joinDate: '2024-05-08', lastVisit: '2026-05-07', totalPurchases: 20, totalSpent: 425000, repairCount: 4, loyaltyPoints: 4250, loyaltyTier: 'Platinum', vip: true, birthday: '1989-03-08', city: 'Pune', status: 'active', satisfactionScore: 96, tags: ['VIP', 'Frequent Buyer', 'Referrer'], preferredBrand: 'Apple', totalReviews: 7, avgRating: 4.9, lastPurchaseDate: '2026-05-05', lastPurchaseAmount: 28000, pendingRepairs: 0, customerSince: '2024-05-08' },
  { id: 11, name: 'Karan Patel', mobile: '+91 44332 21100', email: 'karan.p@email.com', avatar: 'KP', joinDate: '2024-10-15', lastVisit: '2026-04-28', totalPurchases: 6, totalSpent: 75000, repairCount: 1, loyaltyPoints: 750, loyaltyTier: 'Bronze', vip: false, birthday: '1992-01-20', city: 'Surat', status: 'active', satisfactionScore: 84, tags: ['Occasional'], preferredBrand: 'Vivo', totalReviews: 1, avgRating: 4.0, lastPurchaseDate: '2026-02-28', lastPurchaseAmount: 2800, pendingRepairs: 0, customerSince: '2024-10-15' },
  { id: 12, name: 'Deepika Nair', mobile: '+91 33221 10099', email: 'deepika.n@email.com', avatar: 'DN', joinDate: '2023-12-01', lastVisit: '2026-05-06', totalPurchases: 28, totalSpent: 520000, repairCount: 3, loyaltyPoints: 5200, loyaltyTier: 'Platinum', vip: true, birthday: '1991-10-05', city: 'Kochi', status: 'active', satisfactionScore: 99, tags: ['VIP', 'Frequent Buyer', 'Early Adopter'], preferredBrand: 'Apple', totalReviews: 10, avgRating: 5.0, lastPurchaseDate: '2026-05-03', lastPurchaseAmount: 45000, pendingRepairs: 0, customerSince: '2023-12-01' },
]

export const loyaltyTiers: LoyaltyTier[] = [
  { id: 'bronze', name: 'Bronze', minPoints: 0, maxPoints: 999, cashback: 1, color: '#cd7f32', bgGradient: 'from-amber-700/20 to-amber-600/10', benefits: ['Basic Support', 'Birthday Offers', 'SMS Updates'], icon: '🥉' },
  { id: 'silver', name: 'Silver', minPoints: 1000, maxPoints: 2999, cashback: 2, color: '#c0c0c0', bgGradient: 'from-gray-400/20 to-gray-300/10', benefits: ['Priority Support', 'Birthday Offers', 'SMS Updates', '5% Extra Discount'], icon: '🥈' },
  { id: 'gold', name: 'Gold', minPoints: 3000, maxPoints: 4999, cashback: 3, color: '#ffd700', bgGradient: 'from-yellow-500/20 to-amber-400/10', benefits: ['Priority Support', 'Birthday Offers', 'Free Delivery', '10% Extra Discount', 'Early Access'], icon: '🥇' },
  { id: 'platinum', name: 'Platinum', minPoints: 5000, maxPoints: Infinity, cashback: 5, color: '#e5e4e2', bgGradient: 'from-purple-400/20 via-blue-400/10 to-purple-300/10', benefits: ['24/7 Premium Support', 'Birthday Offers', 'Free Delivery', '15% Extra Discount', 'Early Access', 'Free Accessories', 'Exclusive Events'], icon: '💎' },
]

export const loyaltyTransactions: LoyaltyTransaction[] = [
  { id: 1, customerId: 1, customerName: 'Arun Kumar', type: 'earned', points: 500, description: 'iPhone 15 Pro Max Purchase', date: '2026-05-01', balance: 4850 },
  { id: 2, customerId: 1, customerName: 'Arun Kumar', type: 'redeemed', points: 1000, description: '₹500 Discount on Screen Replacement', date: '2026-04-15', balance: 4350 },
  { id: 3, customerId: 7, customerName: 'Rajesh Kumar', type: 'earned', points: 1200, description: 'MacBook Air M3 Purchase', date: '2026-04-25', balance: 6850 },
  { id: 4, customerId: 7, customerName: 'Rajesh Kumar', type: 'bonus', points: 500, description: 'Referral Bonus - Hired 2 friends', date: '2026-04-20', balance: 5650 },
  { id: 5, customerId: 10, customerName: 'Meera Joshi', type: 'earned', points: 800, description: 'iPad Air M2 Purchase', date: '2026-05-05', balance: 4250 },
  { id: 6, customerId: 10, customerName: 'Meera Joshi', type: 'redeemed', points: 2000, description: '₹1000 Discount on iPhone Case + Screen Guard', date: '2026-04-10', balance: 3450 },
  { id: 7, customerId: 12, customerName: 'Deepika Nair', type: 'earned', points: 1500, description: 'iPhone 16 Pro Max Purchase', date: '2026-05-03', balance: 5200 },
  { id: 8, customerId: 12, customerName: 'Deepika Nair', type: 'referral', points: 200, description: 'Referral - Friend joined loyalty', date: '2026-04-28', balance: 3700 },
  { id: 9, customerId: 2, customerName: 'Priya Sharma', type: 'earned', points: 350, description: 'Galaxy S24 Screen Repair', date: '2026-04-28', balance: 2250 },
  { id: 10, customerId: 4, customerName: 'Neha Gupta', type: 'redeemed', points: 500, description: '₹250 Discount on Charger', date: '2026-04-20', balance: 3120 },
  { id: 11, customerId: 12, customerName: 'Deepika Nair', type: 'earned', points: 300, description: 'AirPods Pro 2 Purchase', date: '2026-04-15', balance: 3500 },
  { id: 12, customerId: 1, customerName: 'Arun Kumar', type: 'bonus', points: 250, description: 'Birthday Bonus Points', date: '2026-05-12', balance: 4850 },
]

export const campaigns: Campaign[] = [
  { id: 1, title: 'iPhone 15 Summer Sale', type: 'whatsapp', status: 'running', audience: 'All Apple Customers', targetCustomers: 850, reached: 720, opened: 410, conversions: 85, message: '🔥 Exclusive Summer Sale! Get up to ₹15,000 off on iPhone 15 series. Visit PhoneHub today!', offerDetails: 'Up to ₹15,000 off + Free Screen Guard', scheduleDate: '2026-05-01', createdAt: '2026-04-28', budget: 25000, roi: 320, media: [] },
  { id: 2, title: 'Diwali Dhamaka Offers', type: 'festival', status: 'draft', audience: 'All Customers', targetCustomers: 2800, reached: 0, opened: 0, conversions: 0, message: '🪔 Happy Diwali! PhoneHub brings you festive offers on all smartphones & accessories.', offerDetails: 'Up to ₹20,000 off + Exchange Bonus', scheduleDate: '2026-10-20', createdAt: '2026-05-01', budget: 50000, roi: 0, media: [] },
  { id: 3, title: 'VIP Exclusive Flash Sale', type: 'flash_sale', status: 'completed', audience: 'Gold & Platinum Members', targetCustomers: 320, reached: 298, opened: 265, conversions: 98, message: '⚡ VIP Flash Sale Alert! 50+ products at unbeatable prices. First come, first served!', offerDetails: 'Up to 40% off on selected items', scheduleDate: '2026-04-15', createdAt: '2026-04-10', budget: 15000, roi: 520, media: [] },
  { id: 4, title: 'New Samsung Galaxy A56 Launch', type: 'new_arrival', status: 'running', audience: 'Samsung Fans', targetCustomers: 450, reached: 380, opened: 215, conversions: 42, message: '📱 New Launch! Samsung Galaxy A56 is here. Premium features at an amazing price.', offerDetails: '₹5,000 off on pre-orders', scheduleDate: '2026-05-05', createdAt: '2026-05-02', budget: 30000, roi: 180, media: [] },
  { id: 5, title: 'Repair Service Discount', type: 'sms', status: 'completed', audience: 'Customers with Old Repairs', targetCustomers: 180, reached: 165, opened: 120, conversions: 35, message: '🛠️ Get 20% off on all repair services this weekend. 2-hour express service available!', offerDetails: '20% off on all repairs', scheduleDate: '2026-04-20', createdAt: '2026-04-15', budget: 10000, roi: 250, media: [] },
  { id: 6, title: 'Birthday Month Special', type: 'offer', status: 'running', audience: 'May Birthday Customers', targetCustomers: 95, reached: 72, opened: 58, conversions: 22, message: '🎂 Happy Birthday! PhoneHub has a special gift for you. Claim your birthday discount now!', offerDetails: '₹2,000 off + Free Gift on purchase', scheduleDate: '2026-05-01', createdAt: '2026-04-25', budget: 8000, roi: 180, media: [] },
  { id: 7, title: 'Accessories Clearance Sale', type: 'whatsapp', status: 'draft', audience: 'All Customers', targetCustomers: 2800, reached: 0, opened: 0, conversions: 0, message: '🎉 Huge Clearance Sale! Up to 70% off on all accessories. Stocks limited - grab yours!', offerDetails: 'Up to 70% off', scheduleDate: '2026-06-01', createdAt: '2026-05-06', budget: 12000, roi: 0, media: [] },
  { id: 8, title: 'Refer & Earn', type: 'whatsapp', status: 'running', audience: 'All Active Customers', targetCustomers: 1500, reached: 890, opened: 445, conversions: 68, message: '👥 Refer a friend & earn ₹500 store credit! Your friend gets ₹250 off too!', offerDetails: '₹500 credit per referral', scheduleDate: '2026-04-01', createdAt: '2026-03-28', budget: 20000, roi: 280, media: [] },
]

export const reviewRequests: ReviewRequest[] = [
  { id: 1, customerId: 1, customerName: 'Arun Kumar', customerMobile: '+91 98765 43210', serviceType: 'purchase', serviceId: 'ORD-1001', sentDate: '2026-05-02', status: 'completed', rating: 5, review: 'Excellent service! Fast delivery and great product quality.', respondedAt: '2026-05-03', channel: 'whatsapp' },
  { id: 2, customerId: 2, customerName: 'Priya Sharma', customerMobile: '+91 87654 32109', serviceType: 'repair', serviceId: 'RPR-1002', sentDate: '2026-04-29', status: 'completed', rating: 4, review: 'Good repair service, phone working perfectly now.', respondedAt: '2026-04-30', channel: 'whatsapp' },
  { id: 3, customerId: 3, customerName: 'Rohit Verma', customerMobile: '+91 76543 21098', serviceType: 'purchase', serviceId: 'ORD-1002', sentDate: '2026-05-05', status: 'pending', rating: null, review: null, respondedAt: null, channel: 'whatsapp' },
  { id: 4, customerId: 4, customerName: 'Neha Gupta', customerMobile: '+91 65432 10987', serviceType: 'purchase', serviceId: 'ORD-1003', sentDate: '2026-04-21', status: 'pending', rating: null, review: null, respondedAt: null, channel: 'sms' },
  { id: 5, customerId: 7, customerName: 'Rajesh Kumar', customerMobile: '+91 88776 65544', serviceType: 'repair', serviceId: 'RPR-1005', sentDate: '2026-04-26', status: 'completed', rating: 5, review: 'Best repair shop in town! Quick and quality work.', respondedAt: '2026-04-27', channel: 'whatsapp' },
  { id: 6, customerId: 10, customerName: 'Meera Joshi', customerMobile: '+91 55443 32211', serviceType: 'purchase', serviceId: 'ORD-1004', sentDate: '2026-05-06', status: 'pending', rating: null, review: null, respondedAt: null, channel: 'whatsapp' },
  { id: 7, customerId: 12, customerName: 'Deepika Nair', customerMobile: '+91 33221 10099', serviceType: 'purchase', serviceId: 'ORD-1005', sentDate: '2026-05-04', status: 'pending', rating: null, review: null, respondedAt: null, channel: 'whatsapp' },
  { id: 8, customerId: 6, customerName: 'Ananya Gupta', customerMobile: '+91 99887 76655', serviceType: 'repair', serviceId: 'RPR-1008', sentDate: '2026-04-16', status: 'declined', rating: null, review: null, respondedAt: null, channel: 'sms' },
  { id: 9, customerId: 12, customerName: 'Deepika Nair', customerMobile: '+91 33221 10099', serviceType: 'repair', serviceId: 'RPR-1007', sentDate: '2026-04-28', status: 'completed', rating: 5, review: 'Amazing service! They explained everything clearly.', respondedAt: '2026-04-29', channel: 'whatsapp' },
  { id: 10, customerId: 5, customerName: 'Vikram Patel', customerMobile: '+91 54321 09876', serviceType: 'purchase', serviceId: 'ORD-1006', sentDate: '2026-05-07', status: 'pending', rating: null, review: null, respondedAt: null, channel: 'whatsapp' },
]

export const birthdayOffers: BirthdayOffer[] = [
  { id: 1, customerId: 1, customerName: 'Arun Kumar', customerMobile: '+91 98765 43210', birthday: '1990-05-12', offer: '₹2,000 off + Free Screen Guard', couponCode: 'BDAY-ARUN-12', discount: 2000, sent: true, sentDate: '2026-05-10', claimed: false, claimedDate: null, autoSend: true },
  { id: 2, customerId: 7, customerName: 'Rajesh Kumar', customerMobile: '+91 88776 65544', birthday: '1985-02-14', offer: '₹3,000 off + Free Gift', couponCode: 'BDAY-RAJESH-14', discount: 3000, sent: true, sentDate: '2026-02-12', claimed: true, claimedDate: '2026-02-14', autoSend: true },
  { id: 3, customerId: 10, customerName: 'Meera Joshi', customerMobile: '+91 55443 32211', birthday: '1989-03-08', offer: '₹2,500 off + Free Accessory', couponCode: 'BDAY-MEERA-08', discount: 2500, sent: true, sentDate: '2026-03-06', claimed: true, claimedDate: '2026-03-08', autoSend: true },
  { id: 4, customerId: 12, customerName: 'Deepika Nair', customerMobile: '+91 33221 10099', birthday: '1991-10-05', offer: '₹3,000 off + Free Gift', couponCode: 'BDAY-DEEPIKA-05', discount: 3000, sent: false, sentDate: null, claimed: false, claimedDate: null, autoSend: true },
  { id: 5, customerId: 3, customerName: 'Rohit Verma', customerMobile: '+91 76543 21098', birthday: '1988-12-03', offer: '₹1,000 off', couponCode: 'BDAY-ROHIT-03', discount: 1000, sent: false, sentDate: null, claimed: false, claimedDate: null, autoSend: false },
]

export const customerPurchaseHistory: Record<number, { id: number; product: string; variant: string; date: string; price: number; paymentMethod: string; invoice: string }[]> = {
  1: [
    { id: 1, product: 'iPhone 15 Pro Max', variant: '256GB Natural Titanium', date: '2026-05-01', price: 18500, paymentMethod: 'Credit Card', invoice: 'INV-2026-001' },
    { id: 2, product: 'AirPods Pro 2', variant: 'USB-C', date: '2026-04-10', price: 24900, paymentMethod: 'UPI', invoice: 'INV-2026-002' },
    { id: 3, product: 'MagSafe Charger', variant: 'White', date: '2026-03-20', price: 4500, paymentMethod: 'Cash', invoice: 'INV-2026-003' },
    { id: 4, product: 'iPhone 15 Pro Max Case', variant: 'Silicone - Black', date: '2026-03-01', price: 3500, paymentMethod: 'Credit Card', invoice: 'INV-2026-004' },
    { id: 5, product: 'Apple Watch Series 9', variant: '45mm Midnight', date: '2026-01-15', price: 8500, paymentMethod: 'UPI', invoice: 'INV-2026-005' },
  ],
  2: [
    { id: 6, product: 'Galaxy S24 Ultra', variant: '256GB Titanium Gray', date: '2026-04-28', price: 4500, paymentMethod: 'UPI', invoice: 'INV-2026-006' },
    { id: 7, product: 'Samsung Galaxy Watch 6', variant: '44mm Silver', date: '2026-03-15', price: 32000, paymentMethod: 'Credit Card', invoice: 'INV-2026-007' },
    { id: 8, product: 'Samsung Buds 2 Pro', variant: 'Graphite', date: '2026-02-20', price: 18500, paymentMethod: 'Cash', invoice: 'INV-2026-008' },
  ],
  7: [
    { id: 9, product: 'MacBook Air M3', variant: '15-inch Midnight', date: '2026-04-25', price: 32000, paymentMethod: 'Credit Card', invoice: 'INV-2026-009' },
    { id: 10, product: 'iPad Air M2', variant: '11-inch Starlight', date: '2026-03-10', price: 125000, paymentMethod: 'Finance', invoice: 'INV-2026-010' },
    { id: 11, product: 'iPhone 16 Pro Max Case', variant: 'Leather - Brown', date: '2026-02-05', price: 4500, paymentMethod: 'Cash', invoice: 'INV-2026-011' },
  ],
  10: [
    { id: 12, product: 'iPad Air M2', variant: '13-inch Purple', date: '2026-05-05', price: 28000, paymentMethod: 'UPI', invoice: 'INV-2026-012' },
    { id: 13, product: 'iPhone 16 Pro', variant: '256GB Desert Titanium', date: '2026-04-01', price: 85000, paymentMethod: 'Credit Card', invoice: 'INV-2026-013' },
    { id: 14, product: 'AirPods Max', variant: 'Space Gray', date: '2026-03-05', price: 22500, paymentMethod: 'Finance', invoice: 'INV-2026-014' },
  ],
  12: [
    { id: 15, product: 'iPhone 16 Pro Max', variant: '512GB Natural Titanium', date: '2026-05-03', price: 45000, paymentMethod: 'Credit Card', invoice: 'INV-2026-015' },
    { id: 16, product: 'AirPods Pro 2', variant: 'USB-C', date: '2026-04-15', price: 24900, paymentMethod: 'UPI', invoice: 'INV-2026-016' },
    { id: 17, product: 'MacBook Pro 14 M3', variant: 'Space Black', date: '2026-03-01', price: 185000, paymentMethod: 'Finance', invoice: 'INV-2026-017' },
  ],
}

export const customerRepairHistory: Record<number, { id: number; repairId: string; deviceModel: string; issue: string; status: string; technician: string; cost: number; date: string; completionDate: string | null }[]> = {
  1: [
    { id: 1, repairId: 'RPR-1001', deviceModel: 'iPhone 15 Pro Max', issue: 'Screen Replacement', status: 'Repair In Progress', technician: 'Amit Singh', cost: 18500, date: '2026-04-08', completionDate: null },
    { id: 2, repairId: 'RPR-1012', deviceModel: 'iPhone 14', issue: 'Battery Replacement', status: 'Delivered', technician: 'Sneha Patel', cost: 4500, date: '2026-02-15', completionDate: '2026-02-16' },
    { id: 3, repairId: 'RPR-1025', deviceModel: 'AirPods Pro', issue: 'Speaker Issue', status: 'Delivered', technician: 'Rajesh Kumar', cost: 3500, date: '2025-12-10', completionDate: '2025-12-11' },
  ],
  2: [
    { id: 4, repairId: 'RPR-1002', deviceModel: 'Galaxy S24 Ultra', issue: 'Battery Replacement', status: 'Diagnosing', technician: 'Sneha Patel', cost: 4500, date: '2026-04-09', completionDate: null },
    { id: 5, repairId: 'RPR-1030', deviceModel: 'Galaxy S23', issue: 'Charging Port', status: 'Delivered', technician: 'Rajesh Kumar', cost: 2800, date: '2026-01-20', completionDate: '2026-01-22' },
  ],
  7: [
    { id: 6, repairId: 'RPR-1005', deviceModel: 'Galaxy S23', issue: 'Water Damage', status: 'Repair In Progress', technician: 'Vikram Reddy', cost: 12000, date: '2026-04-05', completionDate: null },
    { id: 7, repairId: 'RPR-1040', deviceModel: 'iPhone 13', issue: 'Camera Issue', status: 'Delivered', technician: 'Rajesh Kumar', cost: 8500, date: '2026-02-28', completionDate: '2026-03-01' },
    { id: 8, repairId: 'RPR-1050', deviceModel: 'MacBook Air', issue: 'Software Issue', status: 'Delivered', technician: 'Priya Sharma', cost: 2500, date: '2025-11-15', completionDate: '2025-11-16' },
  ],
  10: [
    { id: 9, repairId: 'RPR-1060', deviceModel: 'iPhone 16 Pro', issue: 'Speaker Issue', status: 'Delivered', technician: 'Rajesh Kumar', cost: 3200, date: '2026-03-20', completionDate: '2026-03-21' },
    { id: 10, repairId: 'RPR-1070', deviceModel: 'iPad Air', issue: 'Charging Port', status: 'Delivered', technician: 'Amit Singh', cost: 2800, date: '2026-01-05', completionDate: '2026-01-07' },
  ],
  12: [
    { id: 11, repairId: 'RPR-1080', deviceModel: 'iPhone 16 Pro Max', issue: 'Screen Replacement', status: 'Delivered', technician: 'Amit Singh', cost: 18500, date: '2026-04-20', completionDate: '2026-04-22' },
    { id: 12, repairId: 'RPR-1090', deviceModel: 'MacBook Pro', issue: 'Motherboard Repair', status: 'Delivered', technician: 'Vikram Reddy', cost: 15000, date: '2026-02-10', completionDate: '2026-02-15' },
  ],
}

export const crmAnalytics = {
  customerGrowth: [
    { month: 'Jan', new: 85, returning: 42, churned: 8 },
    { month: 'Feb', new: 72, returning: 38, churned: 12 },
    { month: 'Mar', new: 98, returning: 55, churned: 6 },
    { month: 'Apr', new: 88, returning: 48, churned: 10 },
    { month: 'May', new: 112, returning: 62, churned: 5 },
    { month: 'Jun', new: 135, returning: 78, churned: 7 },
    { month: 'Jul', new: 120, returning: 70, churned: 9 },
    { month: 'Aug', new: 145, returning: 85, churned: 4 },
    { month: 'Sep', new: 158, returning: 92, churned: 6 },
    { month: 'Oct', new: 172, returning: 105, churned: 3 },
    { month: 'Nov', new: 165, returning: 98, churned: 5 },
    { month: 'Dec', new: 195, returning: 120, churned: 2 },
  ],
  revenueBySegment: [
    { name: 'Platinum', value: 42, color: '#8b5cf6' },
    { name: 'Gold', value: 28, color: '#4f6bff' },
    { name: 'Silver', value: 18, color: '#22c55e' },
    { name: 'Bronze', value: 12, color: '#f59e0b' },
  ],
  campaignPerformance: [
    { name: 'WhatsApp', sent: 18500, opened: 8900, converted: 1250 },
    { name: 'SMS', sent: 5200, opened: 2100, converted: 380 },
    { name: 'Email', sent: 3200, opened: 1400, converted: 220 },
    { name: 'In-App', sent: 2800, opened: 1800, converted: 340 },
  ],
  loyaltyUsage: [
    { month: 'Jan', earned: 8500, redeemed: 3200 },
    { month: 'Feb', earned: 7200, redeemed: 2800 },
    { month: 'Mar', earned: 10200, redeemed: 4500 },
    { month: 'Apr', earned: 8800, redeemed: 3800 },
    { month: 'May', earned: 12500, redeemed: 5200 },
    { month: 'Jun', earned: 11000, redeemed: 4800 },
  ],
  repeatPurchaseRate: [
    { month: 'Jan', rate: 42 },
    { month: 'Feb', rate: 45 },
    { month: 'Mar', rate: 48 },
    { month: 'Apr', rate: 46 },
    { month: 'May', rate: 52 },
    { month: 'Jun', rate: 55 },
  ],
}

export const customerActivityFeed = [
  { id: 1, text: 'Deepika Nair made a purchase of ₹45,000', time: '15 min ago', type: 'purchase', customer: 'Deepika Nair' },
  { id: 2, text: 'Arun Kumar redeemed 1000 loyalty points', time: '32 min ago', type: 'redeem', customer: 'Arun Kumar' },
  { id: 3, text: 'New customer registered: Vikram Patel', time: '1 hour ago', type: 'new', customer: 'Vikram Patel' },
  { id: 4, text: 'Meera Joshi submitted a 5★ review', time: '2 hours ago', type: 'review', customer: 'Meera Joshi' },
  { id: 5, text: 'Rajesh Kumar\'s repair completed - Galaxy S23', time: '3 hours ago', type: 'repair', customer: 'Rajesh Kumar' },
  { id: 6, text: 'Priya Sharma reached Gold loyalty tier', time: '4 hours ago', type: 'tier', customer: 'Priya Sharma' },
  { id: 7, text: 'Birthday offer sent to Arun Kumar', time: '5 hours ago', type: 'birthday', customer: 'Arun Kumar' },
  { id: 8, text: 'Ananya Gupta referred a friend', time: '6 hours ago', type: 'referral', customer: 'Ananya Gupta' },
]

export const crmNavItems = [
  { id: 'customer-dashboard', label: 'Customer Dashboard', icon: 'FiUsers', path: '/customer-dashboard' },
  { id: 'customer-list', label: 'Customers', icon: 'FiUserCheck', path: '/customer-list' },
  { id: 'loyalty-program', label: 'Loyalty Program', icon: 'FiAward', path: '/loyalty-program' },
  { id: 'campaigns', label: 'Campaigns', icon: 'FiSend', path: '/campaigns' },
  { id: 'whatsapp-marketing', label: 'WhatsApp Marketing', icon: 'FiMessageCircle', path: '/whatsapp-marketing' },
  { id: 'review-requests', label: 'Review Requests', icon: 'FiStar', path: '/review-requests' },
  { id: 'customer-analytics', label: 'Customer Analytics', icon: 'FiBarChart2', path: '/customer-analytics' },
  { id: 'birthday-offers', label: 'Birthday Offers', icon: 'FiGift', path: '/birthday-offers' },
  { id: 'vip-customers', label: 'VIP Customers', icon: 'FiShield', path: '/vip-customers' },
]
