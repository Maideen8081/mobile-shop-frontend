export const storeKPIs = [
  { id: 1, title: 'Monthly Revenue', value: 1285000, prefix: '₹', growth: 15.3, trend: 'up' as const, subtitle: 'vs last month', color: '#22c55e', bgGlow: 'rgba(34,197,94,0.12)', icon: 'FiTrendingUp', sparkline: [42, 38, 52, 48, 62, 58, 72, 68, 78, 72, 85, 82] },
  { id: 2, title: 'Monthly Expenses', value: 684000, prefix: '₹', growth: -4.2, trend: 'down' as const, subtitle: 'vs last month', color: '#ef4444', bgGlow: 'rgba(239,68,68,0.12)', icon: 'FiCreditCard', sparkline: [32, 28, 38, 34, 42, 38, 48, 44, 52, 48, 56, 52] },
  { id: 3, title: 'Net Profit', value: 601000, prefix: '₹', growth: 22.8, trend: 'up' as const, subtitle: 'margin 46.7%', color: '#4f6bff', bgGlow: 'rgba(79,107,255,0.12)', icon: 'FiDollarSign', sparkline: [18, 22, 28, 24, 35, 32, 42, 38, 48, 45, 52, 50] },
  { id: 4, title: 'Pending Bills', value: 8, suffix: '', growth: -12.5, trend: 'down' as const, subtitle: '3 overdue', color: '#f59e0b', bgGlow: 'rgba(245,158,11,0.12)', icon: 'FiClock', sparkline: [14, 12, 16, 10, 13, 8, 11, 6, 9, 5, 8, 8] },
  { id: 5, title: 'Staff Salary Exp', value: 245000, prefix: '₹', growth: 0, trend: 'up' as const, subtitle: '12 employees', color: '#8b5cf6', bgGlow: 'rgba(139,92,246,0.12)', icon: 'FiUsers', sparkline: [20, 20, 22, 22, 24, 24, 24, 24, 26, 26, 28, 28] },
  { id: 6, title: 'Maintenance Cost', value: 42500, prefix: '₹', growth: -8.3, trend: 'down' as const, subtitle: 'this month', color: '#06b6d4', bgGlow: 'rgba(6,182,212,0.12)', icon: 'FiTool', sparkline: [8, 12, 6, 15, 10, 18, 14, 22, 16, 25, 20, 28] },
  { id: 7, title: 'Rent Due Status', value: 1, suffix: ' due', growth: 0, trend: 'up' as const, subtitle: 'next: May 5th', color: '#f97316', bgGlow: 'rgba(249,115,22,0.12)', icon: 'FiHome', sparkline: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] },
  { id: 8, title: 'GST/Tax Summary', value: 89500, prefix: '₹', growth: 5.6, trend: 'up' as const, subtitle: 'quarterly payable', color: '#14b8a6', bgGlow: 'rgba(20,184,166,0.12)', icon: 'FiFileText', sparkline: [12, 15, 18, 14, 20, 22, 25, 28, 32, 35, 38, 42] },
]

export const expenseCategories = [
  'Shop Rent', 'Electricity Bill', 'Water Bill', 'Internet/WiFi',
  'Staff Salary', 'Maintenance', 'Cleaning', 'Furniture',
  'Mobile Accessories Purchase', 'Supplier Payment', 'Transport Charges',
  'Marketing', 'Tax/GST', 'Repair Equipment', 'Miscellaneous',
]

export const paymentMethods = ['Cash', 'Bank Transfer', 'UPI', 'Credit Card', 'Cheque']

export const expenseList = [
  { id: 1, name: 'Monthly Shop Rent - April', category: 'Shop Rent', amount: 85000, date: '2026-04-01', method: 'Bank Transfer', status: 'Paid', description: 'Rent for April 2026 - Ground Floor' },
  { id: 2, name: 'EB Bill - March', category: 'Electricity Bill', amount: 12450, date: '2026-03-28', method: 'UPI', status: 'Paid', description: 'Electricity consumption for March' },
  { id: 3, name: 'Water Supply Charges', category: 'Water Bill', amount: 3200, date: '2026-03-25', method: 'Cash', status: 'Paid', description: 'Monthly water supply bill' },
  { id: 4, name: 'ACT Fibernet - April', category: 'Internet/WiFi', amount: 2500, date: '2026-04-05', method: 'UPI', status: 'Pending', description: '100Mbps business plan' },
  { id: 5, name: 'Staff Salaries - March', category: 'Staff Salary', amount: 245000, date: '2026-03-31', method: 'Bank Transfer', status: 'Paid', description: 'Salaries for 12 employees' },
  { id: 6, name: 'AC Service & Repair', category: 'Maintenance', amount: 8500, date: '2026-03-22', method: 'Cash', status: 'Paid', description: 'AC gas refill and servicing' },
  { id: 7, name: 'Office Desk Purchase', category: 'Furniture', amount: 18500, date: '2026-03-18', method: 'Bank Transfer', status: 'Paid', description: '2 new workstations' },
  { id: 8, name: 'iPhone 16 Screen Protectors', category: 'Mobile Accessories Purchase', amount: 45000, date: '2026-04-02', method: 'Credit Card', status: 'Pending', description: 'Bulk purchase of screen guards' },
  { id: 9, name: 'Samsung Parts Supplier', category: 'Supplier Payment', amount: 78000, date: '2026-03-30', method: 'Bank Transfer', status: 'Paid', description: 'Display panels and batteries' },
  { id: 10, name: 'Google Ads Campaign', category: 'Marketing', amount: 15000, date: '2026-04-04', method: 'Credit Card', status: 'Pending', description: 'April marketing campaign' },
  { id: 11, name: 'GST Quarterly Filing', category: 'Tax/GST', amount: 89500, date: '2026-04-10', method: 'Bank Transfer', status: 'Pending', description: 'Q1 2026 GST payment' },
  { id: 12, name: 'Screwdriver Kit Set', category: 'Repair Equipment', amount: 4500, date: '2026-03-20', method: 'UPI', status: 'Paid', description: 'Professional repair tool kit' },
  { id: 13, name: 'Cleaning Staff Payment', category: 'Cleaning', amount: 6000, date: '2026-03-28', method: 'Cash', status: 'Paid', description: 'Monthly cleaning service' },
  { id: 14, name: 'Courier Charges', category: 'Transport Charges', amount: 3500, date: '2026-04-03', method: 'Cash', status: 'Pending', description: 'Customer delivery charges' },
  { id: 15, name: 'Misc - Tea & Snacks', category: 'Miscellaneous', amount: 2800, date: '2026-03-26', method: 'Cash', status: 'Paid', description: 'Office refreshments' },
  { id: 16, name: 'Generator Diesel', category: 'Electricity Bill', amount: 8500, date: '2026-04-06', method: 'Cash', status: 'Pending', description: 'Generator fuel for backup' },
]

export const revenueExpenseData = [
  { month: 'Jan', revenue: 850000, expenses: 480000, profit: 370000 },
  { month: 'Feb', revenue: 780000, expenses: 450000, profit: 330000 },
  { month: 'Mar', revenue: 920000, expenses: 520000, profit: 400000 },
  { month: 'Apr', revenue: 1050000, expenses: 580000, profit: 470000 },
  { month: 'May', revenue: 1120000, expenses: 620000, profit: 500000 },
  { month: 'Jun', revenue: 1285000, expenses: 684000, profit: 601000 },
]

export const expenseBreakdown = [
  { name: 'Shop Rent', value: 85000, color: '#8b5cf6' },
  { name: 'Staff Salary', value: 245000, color: '#4f6bff' },
  { name: 'Electricity', value: 20950, color: '#f59e0b' },
  { name: 'Supplier Pmt', value: 78000, color: '#22c55e' },
  { name: 'Marketing', value: 15000, color: '#ef4444' },
  { name: 'Other', value: 48050, color: '#06b6d4' },
]

export const rentHistory = [
  { month: 'Jan', amount: 85000, paid: true, date: 'Jan 5, 2026' },
  { month: 'Feb', amount: 85000, paid: true, date: 'Feb 5, 2026' },
  { month: 'Mar', amount: 85000, paid: true, date: 'Mar 5, 2026' },
  { month: 'Apr', amount: 85000, paid: true, date: 'Apr 3, 2026' },
  { month: 'May', amount: 85000, paid: false, date: 'Due May 5' },
  { month: 'Jun', amount: 85000, paid: false, date: 'Due Jun 5' },
]

export const staffSalaries = [
  { id: 1, name: 'Rajesh Kumar', role: 'Senior Technician', salary: 35000, bonus: 5000, date: '2026-03-31', status: 'Paid' },
  { id: 2, name: 'Priya Sharma', role: 'Technician', salary: 28000, bonus: 3000, date: '2026-03-31', status: 'Paid' },
  { id: 3, name: 'Amit Singh', role: 'Technician', salary: 25000, bonus: 2500, date: '2026-03-31', status: 'Paid' },
  { id: 4, name: 'Sneha Patel', role: 'Sales Associate', salary: 22000, bonus: 2000, date: '2026-03-31', status: 'Paid' },
  { id: 5, name: 'Vikram Reddy', role: 'Sales Associate', salary: 20000, bonus: 1500, date: '2026-03-31', status: 'Paid' },
  { id: 6, name: 'Deepika Nair', role: 'Store Manager', salary: 45000, bonus: 8000, date: '2026-03-31', status: 'Paid' },
  { id: 7, name: 'Manoj Kumar', role: 'Delivery Staff', salary: 15000, bonus: 1000, date: '2026-03-31', status: 'Paid' },
  { id: 8, name: 'Kavita Singh', role: 'Customer Support', salary: 18000, bonus: 1500, date: '2026-03-31', status: 'Paid' },
  { id: 9, name: 'Rahul Verma', role: 'Technician', salary: 25000, bonus: 2000, date: '2026-03-31', status: 'Paid' },
  { id: 10, name: 'Ananya Gupta', role: 'Accountant', salary: 30000, bonus: 4000, date: '2026-03-31', status: 'Paid' },
  { id: 11, name: 'Suresh Babu', role: 'Security', salary: 12000, bonus: 0, date: '2026-03-31', status: 'Paid' },
  { id: 12, name: 'Lakshmi Devi', role: 'Cleaning Staff', salary: 10000, bonus: 0, date: '2026-03-31', status: 'Paid' },
]

export const businessActivities = [
  { id: 1, text: 'Monthly rent ₹85,000 paid for April', time: '2 hours ago', type: 'rent', user: 'Admin' },
  { id: 2, text: 'Staff salaries processed - ₹2,45,000 disbursed', time: '5 hours ago', type: 'salary', user: 'Admin' },
  { id: 3, text: 'Electricity bill ₹12,450 paid via UPI', time: '1 day ago', type: 'payment', user: 'Admin' },
  { id: 4, text: 'New expense added: Google Ads ₹15,000', time: '2 days ago', type: 'expense', user: 'Admin' },
  { id: 5, text: 'GST quarterly report generated - ₹89,500 payable', time: '3 days ago', type: 'tax', user: 'System' },
  { id: 6, text: 'AC maintenance completed - ₹8,500', time: '4 days ago', type: 'maintenance', user: 'Vendor' },
  { id: 7, text: 'Invoice #INV-4563 uploaded - Samsung parts', time: '5 days ago', type: 'invoice', user: 'Admin' },
  { id: 8, text: 'Supplier payment of ₹78,000 processed', time: '6 days ago', type: 'payment', user: 'Admin' },
  { id: 9, text: 'New repair equipment purchased - ₹4,500', time: '1 week ago', type: 'expense', user: 'Admin' },
  { id: 10, text: 'Monthly profit & loss report generated', time: '1 week ago', type: 'report', user: 'System' },
]

export const storeNavItems = [
  { id: 'store', label: 'Store Management', icon: 'FiHome', path: '/store-management' },
  { id: 'expenses', label: 'Expense Tracking', icon: 'FiCreditCard', path: '/expenses' },
  { id: 'rent', label: 'Shop Rent', icon: 'FiHome', path: '/rent' },
  { id: 'electricity', label: 'Electricity Bills', icon: 'FiZap', path: '/electricity' },
  { id: 'salary', label: 'Staff Salary', icon: 'FiUsers', path: '/salary' },
  { id: 'maintenance', label: 'Maintenance Costs', icon: 'FiTool', path: '/maintenance' },
  { id: 'suppliers', label: 'Supplier Payments', icon: 'FiTruck', path: '/suppliers' },
  { id: 'financial-reports', label: 'Financial Reports', icon: 'FiFileText', path: '/financial-reports' },
  { id: 'pnl', label: 'Profit & Loss', icon: 'FiTrendingUp', path: '/pnl' },
  { id: 'tax', label: 'Tax & GST', icon: 'FiFile', path: '/tax' },
  { id: 'analytics', label: 'Store Analytics', icon: 'FiBarChart2', path: '/store-analytics' },
  { id: 'business-settings', label: 'Business Settings', icon: 'FiSettings', path: '/business-settings' },
]
