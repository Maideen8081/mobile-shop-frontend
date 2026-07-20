export const kpiCards = [
  { id: 1, title: "Today's Sales", value: 28450, prefix: '₹', growth: 12.5, trend: 'up' as const, subtitle: 'vs yesterday', color: '#8b5cf6', bgGlow: 'rgba(139,92,246,0.12)', icon: 'FiShoppingBag', sparkline: [18, 25, 20, 35, 28, 42, 38, 50, 45, 55] },
  { id: 2, title: "Today's Repairs", value: 18, suffix: '', growth: 8.2, trend: 'up' as const, subtitle: '94% completion', color: '#4f6bff', bgGlow: 'rgba(79,107,255,0.12)', icon: 'FiTool', sparkline: [8, 12, 10, 15, 13, 18, 16, 20, 18, 22] },
  { id: 3, title: 'Pending Repairs', value: 7, suffix: '', growth: -3.1, trend: 'down' as const, subtitle: '2 urgent alerts', color: '#f59e0b', bgGlow: 'rgba(245,158,11,0.12)', icon: 'FiClock', sparkline: [12, 10, 14, 9, 11, 7, 10, 6, 8, 7] },
  { id: 4, title: 'Total Revenue', value: 5842000, prefix: '₹', growth: 18.7, trend: 'up' as const, subtitle: 'this month', color: '#22c55e', bgGlow: 'rgba(34,197,94,0.12)', icon: 'FiDollarSign', sparkline: [22, 30, 28, 38, 35, 45, 42, 52, 48, 58] },
  { id: 5, title: 'Net Profit', value: 1428000, prefix: '₹', growth: 22.3, trend: 'up' as const, subtitle: 'margin 24.5%', color: '#06b6d4', bgGlow: 'rgba(6,182,212,0.12)', icon: 'FiTrendingUp', sparkline: [15, 22, 20, 28, 25, 35, 32, 40, 38, 45] },
  { id: 6, title: 'Total Stock', value: 3842, suffix: '', growth: 2.1, trend: 'up' as const, subtitle: '152 categories', color: '#8b5cf6', bgGlow: 'rgba(139,92,246,0.12)', icon: 'FiPackage', sparkline: [38, 42, 40, 45, 43, 48, 46, 50, 48, 52] },
  { id: 7, title: 'Low Stock Alerts', value: 12, suffix: '', growth: 5.4, trend: 'up' as const, subtitle: 'critical: 4 items', color: '#ef4444', bgGlow: 'rgba(239,68,68,0.12)', icon: 'FiAlertTriangle', sparkline: [20, 18, 22, 16, 19, 14, 17, 12, 15, 12] },
  { id: 8, title: 'Customer Rating', value: 4.8, suffix: '', growth: 0.3, trend: 'up' as const, subtitle: 'from 1,247 reviews', color: '#f59e0b', bgGlow: 'rgba(245,158,11,0.12)', icon: 'FiStar', sparkline: [4.2, 4.3, 4.5, 4.4, 4.6, 4.7, 4.5, 4.8, 4.7, 4.8] },
]

export const salesChartData = [
  { name: 'Mon', sales: 42000, revenue: 38000, profit: 8500 },
  { name: 'Tue', sales: 38000, revenue: 32000, profit: 7200 },
  { name: 'Wed', sales: 51000, revenue: 46000, profit: 10800 },
  { name: 'Thu', sales: 46000, revenue: 41000, profit: 9500 },
  { name: 'Fri', sales: 58000, revenue: 52000, profit: 12400 },
  { name: 'Sat', sales: 72000, revenue: 65000, profit: 16200 },
  { name: 'Sun', sales: 63000, revenue: 57000, profit: 13800 },
]

export const revenueProfitData = [
  { month: 'Jan', revenue: 420000, profit: 98000, cost: 322000 },
  { month: 'Feb', revenue: 380000, profit: 85000, cost: 295000 },
  { month: 'Mar', revenue: 510000, profit: 120000, cost: 390000 },
  { month: 'Apr', revenue: 460000, profit: 105000, cost: 355000 },
  { month: 'May', revenue: 580000, profit: 142000, cost: 438000 },
  { month: 'Jun', revenue: 720000, profit: 185000, cost: 535000 },
  { month: 'Jul', revenue: 630000, profit: 158000, cost: 472000 },
  { month: 'Aug', revenue: 680000, profit: 172000, cost: 508000 },
  { month: 'Sep', revenue: 750000, profit: 195000, cost: 555000 },
  { month: 'Oct', revenue: 820000, profit: 218000, cost: 602000 },
  { month: 'Nov', revenue: 780000, profit: 201000, cost: 579000 },
  { month: 'Dec', revenue: 920000, profit: 245000, cost: 675000 },
]

export const categoryData = [
  { name: 'Smartphones', value: 45, color: '#8b5cf6' },
  { name: 'Accessories', value: 25, color: '#4f6bff' },
  { name: 'Tablets', value: 15, color: '#22c55e' },
  { name: 'Wearables', value: 10, color: '#f59e0b' },
  { name: 'Audio', value: 5, color: '#ef4444' },
]

export const repairStatusData = [
  { name: 'Completed', value: 145, color: '#22c55e' },
  { name: 'In Progress', value: 52, color: '#8b5cf6' },
  { name: 'Pending', value: 28, color: '#f59e0b' },
  { name: 'Cancelled', value: 8, color: '#ef4444' },
]

export const customerGrowthData = [
  { month: 'Jan', new: 85, returning: 42 },
  { month: 'Feb', new: 72, returning: 38 },
  { month: 'Mar', new: 98, returning: 55 },
  { month: 'Apr', new: 88, returning: 48 },
  { month: 'May', new: 112, returning: 62 },
  { month: 'Jun', new: 135, returning: 78 },
  { month: 'Jul', new: 120, returning: 70 },
  { month: 'Aug', new: 145, returning: 85 },
  { month: 'Sep', new: 158, returning: 92 },
  { month: 'Oct', new: 172, returning: 105 },
  { month: 'Nov', new: 165, returning: 98 },
  { month: 'Dec', new: 195, returning: 120 },
]

export const topSellingProducts = [
  { id: 1, name: 'iPhone 15 Pro Max', brand: 'Apple', sold: 245, revenue: 34200000, stock: 18, trend: 'up' as const, image: '📱', rating: 4.8, growth: '+12%' },
  { id: 2, name: 'Samsung Galaxy S24 Ultra', brand: 'Samsung', sold: 212, revenue: 25440000, stock: 25, trend: 'up' as const, image: '📱', rating: 4.7, growth: '+8%' },
  { id: 3, name: 'OnePlus 12', brand: 'OnePlus', sold: 178, revenue: 12460000, stock: 42, trend: 'up' as const, image: '📱', rating: 4.6, growth: '+15%' },
  { id: 4, name: 'AirPods Pro 2', brand: 'Apple', sold: 156, revenue: 3120000, stock: 85, trend: 'up' as const, image: '🎧', rating: 4.9, growth: '+5%' },
  { id: 5, name: 'Galaxy Watch 6', brand: 'Samsung', sold: 98, revenue: 2940000, stock: 33, trend: 'down' as const, image: '⌚', rating: 4.4, growth: '-2%' },
  { id: 6, name: 'iPad Air M2', brand: 'Apple', sold: 87, revenue: 15660000, stock: 12, trend: 'up' as const, image: '📱', rating: 4.8, growth: '+10%' },
]

export const lowStockItems = [
  { id: 1, name: 'iPhone 15 Pro Max', sku: 'APL-IP15PM', stock: 3, threshold: 10, critical: true, image: '📱' },
  { id: 2, name: 'Samsung Buds 2 Pro', sku: 'SAM-BUDS2P', stock: 5, threshold: 15, critical: false, image: '🎧' },
  { id: 3, name: 'USB-C Charger 65W', sku: 'ACC-USB65', stock: 2, threshold: 20, critical: true, image: '🔌' },
  { id: 4, name: 'iPhone 15 Screen Guard', sku: 'APL-SG15', stock: 8, threshold: 25, critical: false, image: '🛡️' },
  { id: 5, name: 'Type-C Cable 2M', sku: 'ACC-TC2M', stock: 4, threshold: 30, critical: true, image: '🔗' },
]

export const technicians = [
  { id: 1, name: 'Rajesh Kumar', avatar: 'RK', repairs: 142, rating: 4.9, efficiency: 96, active: true, speciality: 'Hardware' },
  { id: 2, name: 'Priya Sharma', avatar: 'PS', repairs: 128, rating: 4.8, efficiency: 93, active: true, speciality: 'Software' },
  { id: 3, name: 'Amit Singh', avatar: 'AS', repairs: 98, rating: 4.6, efficiency: 88, active: true, speciality: 'Display' },
  { id: 4, name: 'Sneha Patel', avatar: 'SP', repairs: 85, rating: 4.7, efficiency: 91, active: false, speciality: 'Battery' },
  { id: 5, name: 'Vikram Reddy', avatar: 'VR', repairs: 112, rating: 4.5, efficiency: 85, active: true, speciality: 'Water Damage' },
]

export const recentActivities = [
  { id: 1, text: 'New sale completed: iPhone 15 Pro Max (256GB)', time: '2 min ago', type: 'sale', user: 'Rajesh' },
  { id: 2, text: 'Repair request #R-1042 created - Samsung S24 screen', time: '8 min ago', type: 'repair', user: 'Priya' },
  { id: 3, text: 'Product restocked: AirPods Pro 2 (50 units)', time: '15 min ago', type: 'stock', user: 'Amit' },
  { id: 4, text: 'New review: 5★ - Excellent service!', time: '28 min ago', type: 'feedback', user: 'Sneha' },
  { id: 5, text: 'Technician assigned: Water damage repair #R-1039', time: '42 min ago', type: 'assign', user: 'Admin' },
  { id: 6, text: 'Payment received: ₹1,24,500 from bulk order', time: '1 hour ago', type: 'payment', user: 'Rajesh' },
  { id: 7, text: 'Low stock alert: iPhone 15 Pro Max (only 3 left)', time: '1.5 hours ago', type: 'alert', user: 'System' },
  { id: 8, text: 'Invoice #INV-4523 generated for customer', time: '2 hours ago', type: 'invoice', user: 'Priya' },
]

export const quickActions = [
  { id: 1, label: 'Add Sale', icon: '💰', color: '#8b5cf6', desc: 'Record new sale' },
  { id: 2, label: 'Create Repair', icon: '🔧', color: '#4f6bff', desc: 'New repair ticket' },
  { id: 3, label: 'Add Product', icon: '📦', color: '#22c55e', desc: 'Inventory update' },
  { id: 4, label: 'Add Customer', icon: '👤', color: '#f59e0b', desc: 'New customer' },
  { id: 5, label: 'Generate Invoice', icon: '📄', color: '#ef4444', desc: 'Create invoice' },
  { id: 6, label: 'Send Offer', icon: '🎉', color: '#06b6d4', desc: 'Promotional offer' },
]

export const feedbackData = [
  { id: 1, name: 'Arun Kumar', avatar: 'AK', rating: 5, text: 'Excellent service! Fixed my iPhone screen in just 2 hours.', product: 'iPhone 15 Screen Repair', time: '2 hours ago', sentiment: 'positive' as const },
  { id: 2, name: 'Meera Joshi', avatar: 'MJ', rating: 4, text: 'Great collection of accessories. Found the perfect case!', product: 'Samsung S24 Case', time: '5 hours ago', sentiment: 'positive' as const },
  { id: 3, name: 'Karan Patel', avatar: 'KP', rating: 5, text: "Best prices! Got my OnePlus 12 at ₹8k less than MRP.", product: 'OnePlus 12 Purchase', time: '1 day ago', sentiment: 'positive' as const },
  { id: 4, name: 'Neha Gupta', avatar: 'NG', rating: 3, text: "Repair took longer than expected, but quality was good.", product: 'Battery Replacement', time: '2 days ago', sentiment: 'neutral' as const },
  { id: 5, name: 'Rohit Verma', avatar: 'RV', rating: 5, text: "Trusted store for years. Never disappointed!", product: 'General Service', time: '3 days ago', sentiment: 'positive' as const },
]

export const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'FiHome', path: '/dashboard' },
  { id: 'products', label: 'Products', icon: 'FiPackage', path: '/products' },
  { id: 'categories', label: 'Categories', icon: 'FiFolder', path: '/categories' },
]

export const aiInsights = [
  { id: 1, text: 'iPhone 15 Pro Max sales up 24% this week — consider restocking.', type: 'insight' },
  { id: 2, text: 'Repair completion rate dropped 3%. Review technician workload.', type: 'warning' },
  { id: 3, text: 'Galaxy S24 Ultra trending — increase marketing budget.', type: 'insight' },
  { id: 4, text: 'Customer satisfaction at 94% — highest this quarter.', type: 'success' },
]

export const notifications = [
  { id: 1, text: 'New order #ORD-8952 received', time: '5 min ago', read: false },
  { id: 2, text: 'Payment of ₹45,000 confirmed', time: '12 min ago', read: false },
  { id: 3, text: 'Stock alert: Screen guards low', time: '30 min ago', read: false },
  { id: 4, text: 'Technician Priya marked available', time: '1 hour ago', read: true },
  { id: 5, text: 'Daily report generated', time: '2 hours ago', read: true },
]
