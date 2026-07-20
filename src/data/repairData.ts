export const repairKPIs = [
  { id: 1, title: 'Active Repairs', value: 24, suffix: '', growth: 12.5, trend: 'up' as const, subtitle: 'vs yesterday', color: '#8b5cf6', bgGlow: 'rgba(139,92,246,0.12)', icon: 'FiTool', sparkline: [18, 22, 20, 28, 24, 30, 26, 32, 28, 35] },
  { id: 2, title: 'Devices Received Today', value: 8, suffix: '', growth: 14.3, trend: 'up' as const, subtitle: 'new today', color: '#4f6bff', bgGlow: 'rgba(79,107,255,0.12)', icon: 'FiSmartphone', sparkline: [3, 5, 4, 7, 6, 8, 5, 9, 7, 10] },
  { id: 3, title: 'In Progress', value: 15, suffix: '', growth: -5.2, trend: 'down' as const, subtitle: 'being repaired', color: '#f59e0b', bgGlow: 'rgba(245,158,11,0.12)', icon: 'FiClock', sparkline: [12, 14, 13, 16, 15, 18, 17, 20, 18, 15] },
  { id: 4, title: 'Waiting for Parts', value: 6, suffix: '', growth: -8.1, trend: 'down' as const, subtitle: 'parts on order', color: '#ef4444', bgGlow: 'rgba(239,68,68,0.12)', icon: 'FiPackage', sparkline: [8, 7, 9, 6, 8, 5, 7, 4, 6, 6] },
  { id: 5, title: 'Ready for Delivery', value: 9, suffix: '', growth: 18.9, trend: 'up' as const, subtitle: 'awaiting pickup', color: '#22c55e', bgGlow: 'rgba(34,197,94,0.12)', icon: 'FiCheckCircle', sparkline: [5, 7, 6, 9, 8, 11, 10, 13, 12, 14] },
  { id: 6, title: 'Delivered Today', value: 11, suffix: '', growth: 22.4, trend: 'up' as const, subtitle: 'completed', color: '#06b6d4', bgGlow: 'rgba(6,182,212,0.12)', icon: 'FiTruck', sparkline: [4, 6, 5, 8, 7, 10, 9, 12, 11, 14] },
  { id: 7, title: 'Pending Approval', value: 4, suffix: '', growth: -3.5, trend: 'down' as const, subtitle: 'customer pending', color: '#f97316', bgGlow: 'rgba(249,115,22,0.12)', icon: 'FiUsers', sparkline: [6, 5, 7, 4, 6, 3, 5, 2, 4, 4] },
  { id: 8, title: 'Technician Workload', value: 85, suffix: '%', growth: 4.2, trend: 'up' as const, subtitle: 'capacity used', color: '#14b8a6', bgGlow: 'rgba(20,184,166,0.12)', icon: 'FiUserCheck', sparkline: [72, 75, 78, 74, 80, 82, 78, 85, 82, 88] },
]

export const repairStatuses = ['Received', 'Diagnosing', 'Waiting for Parts', 'Repair In Progress', 'Quality Check', 'Ready for Delivery', 'Delivered'] as const
export type RepairStatus = typeof repairStatuses[number]

export const deviceCategories = [
  'Mobile', 'Laptop', 'Tablet', 'Smart Watch', 'Desktop', 'Accessories', 'Smart TV', 'Printer',
]

export const issueCategories = [
  'Screen Replacement', 'Battery Replacement', 'Charging Port', 'Camera Issue', 'Speaker Issue',
  'Microphone Issue', 'Power Button', 'Software Issue', 'Water Damage', 'Motherboard Repair',
  'Data Recovery', 'Network Issue', 'Display Issue', 'Vibration Issue', 'Other',
]

export const deviceBrands = [
  'Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Realme', 'Vivo', 'Oppo', 'Nothing', 'Google', 'Motorola',
]

export interface RepairTechnician {
  id: number
  name: string
  avatar: string
  role: string
  active: boolean
  speciality: string
  efficiency: number
  repairs: number
  rating: number
  online: boolean
  color: string
}

export const repairTechnicians: RepairTechnician[] = [
  { id: 1, name: 'Rajesh Kumar', avatar: 'RK', role: 'Senior Technician', active: true, speciality: 'Hardware', efficiency: 96, repairs: 142, rating: 4.9, online: true, color: '#8b5cf6' },
  { id: 2, name: 'Priya Sharma', avatar: 'PS', role: 'Technician', active: true, speciality: 'Software', efficiency: 93, repairs: 128, rating: 4.8, online: true, color: '#4f6bff' },
  { id: 3, name: 'Amit Singh', avatar: 'AS', role: 'Technician', active: true, speciality: 'Display', efficiency: 88, repairs: 98, rating: 4.6, online: false, color: '#22c55e' },
  { id: 4, name: 'Sneha Patel', avatar: 'SP', role: 'Junior Technician', active: true, speciality: 'Battery', efficiency: 91, repairs: 85, rating: 4.7, online: true, color: '#f59e0b' },
  { id: 5, name: 'Vikram Reddy', avatar: 'VR', role: 'Technician', active: true, speciality: 'Water Damage', efficiency: 85, repairs: 112, rating: 4.5, online: true, color: '#ef4444' },
  { id: 6, name: 'Deepika Nair', avatar: 'DN', role: 'QC Specialist', active: true, speciality: 'Quality Check', efficiency: 98, repairs: 156, rating: 4.9, online: true, color: '#06b6d4' },
]

export interface RepairTicket {
  id: number
  repairId: string
  customerName: string
  customerMobile: string
  customerEmail: string
  deviceBrand: string
  deviceModel: string
  imei: string
  serialNumber: string
  deviceColor: string
  issueCategory: string
  description: string
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  status: RepairStatus
  accessoriesSubmitted: string[]
  devicePassword: string
  estimatedCost: number
  actualCost: number
  estimatedDays: number
  technicianId: number
  customerApproval: boolean
  createdAt: string
  updatedAt: string
  completedAt: string | null
  images: string[]
  notes: { text: string; by: string; time: string }[]
  partsUsed: { name: string; qty: number; cost: number }[]
}

export const repairTickets: RepairTicket[] = [
  {
    id: 1, repairId: 'RPR-1001', customerName: 'Arun Kumar', customerMobile: '+91 98765 43210', customerEmail: 'arun@email.com',
    deviceBrand: 'Apple', deviceModel: 'iPhone 15 Pro Max', imei: '358962874512369', serialNumber: 'F2LZR4G8H9',
    deviceColor: 'Natural Titanium', issueCategory: 'Screen Replacement',
    description: 'Cracked screen after drop. Touch not working on left side. Need full display assembly replacement.',
    priority: 'High', status: 'Repair In Progress',
    accessoriesSubmitted: ['Original Box', 'Charging Cable'], devicePassword: 'Provided',
    estimatedCost: 18500, actualCost: 18500, estimatedDays: 2, technicianId: 3,
    customerApproval: true, createdAt: '2026-04-08', updatedAt: '2026-04-09', completedAt: null,
    images: ['📱', '📱'], notes: [], partsUsed: [{ name: 'iPhone 15 Pro Max Display Assembly', qty: 1, cost: 12000 }],
  },
  {
    id: 2, repairId: 'RPR-1002', customerName: 'Meera Joshi', customerMobile: '+91 87654 32109', customerEmail: 'meera@email.com',
    deviceBrand: 'Samsung', deviceModel: 'Galaxy S24 Ultra', imei: '359874125632147', serialNumber: 'R9T2Y5H7K3',
    deviceColor: 'Titanium Gray', issueCategory: 'Battery Replacement',
    description: 'Battery draining fast. Only lasts 3-4 hours on moderate use. Swelling noticed on back panel.',
    priority: 'High', status: 'Diagnosing',
    accessoriesSubmitted: [], devicePassword: 'Not Required',
    estimatedCost: 4500, actualCost: 0, estimatedDays: 1, technicianId: 4,
    customerApproval: true, createdAt: '2026-04-09', updatedAt: '2026-04-09', completedAt: null,
    images: ['📱'], notes: [], partsUsed: [],
  },
  {
    id: 3, repairId: 'RPR-1003', customerName: 'Karan Patel', customerMobile: '+91 76543 21098', customerEmail: 'karan@email.com',
    deviceBrand: 'OnePlus', deviceModel: 'OnePlus 12', imei: '351248963257841', serialNumber: 'M4N7B2V6C1',
    deviceColor: 'Flowy Emerald', issueCategory: 'Charging Port',
    description: 'Charging port loose. Cable falls off easily. Wireless charging works but slow.',
    priority: 'Medium', status: 'Waiting for Parts',
    accessoriesSubmitted: ['Charger'], devicePassword: 'Provided',
    estimatedCost: 2800, actualCost: 2800, estimatedDays: 3, technicianId: 1,
    customerApproval: true, createdAt: '2026-04-07', updatedAt: '2026-04-08', completedAt: null,
    images: ['📱'], notes: [], partsUsed: [{ name: 'USB-C Charging Port Flex', qty: 1, cost: 1200 }],
  },
  {
    id: 4, repairId: 'RPR-1004', customerName: 'Neha Gupta', customerMobile: '+91 65432 10987', customerEmail: 'neha@email.com',
    deviceBrand: 'Apple', deviceModel: 'iPhone 14', imei: '358741236985214', serialNumber: 'K1L5P9X3M7',
    deviceColor: 'Midnight', issueCategory: 'Camera Issue',
    description: 'Rear camera shows black screen. Front camera works fine. Likely hardware issue.',
    priority: 'Medium', status: 'Quality Check',
    accessoriesSubmitted: ['Original Box'], devicePassword: 'Provided',
    estimatedCost: 8500, actualCost: 8200, estimatedDays: 2, technicianId: 1,
    customerApproval: true, createdAt: '2026-04-06', updatedAt: '2026-04-09', completedAt: null,
    images: ['📱', '📱'], notes: [], partsUsed: [{ name: 'iPhone 14 Rear Camera Module', qty: 1, cost: 5500 }],
  },
  {
    id: 5, repairId: 'RPR-1005', customerName: 'Rohit Verma', customerMobile: '+91 54321 09876', customerEmail: 'rohit@email.com',
    deviceBrand: 'Samsung', deviceModel: 'Galaxy S23', imei: '352147896325874', serialNumber: 'H3G6J9L2N5',
    deviceColor: 'Phantom Black', issueCategory: 'Water Damage',
    description: 'Phone dropped in water. Not turning on. Rice method tried but no success. Moisture indicator red.',
    priority: 'Urgent', status: 'Repair In Progress',
    accessoriesSubmitted: [], devicePassword: 'Not Required',
    estimatedCost: 12000, actualCost: 0, estimatedDays: 4, technicianId: 5,
    customerApproval: false, createdAt: '2026-04-05', updatedAt: '2026-04-09', completedAt: null,
    images: ['📱', '📱', '📱'], notes: [], partsUsed: [{ name: 'Moisture Seal Kit', qty: 1, cost: 800 }],
  },
  {
    id: 6, repairId: 'RPR-1006', customerName: 'Priya Sharma', customerMobile: '+91 43210 98765', customerEmail: 'priya@email.com',
    deviceBrand: 'Apple', deviceModel: 'AirPods Pro 2', imei: 'N/A', serialNumber: 'N/A',
    deviceColor: 'White', issueCategory: 'Speaker Issue',
    description: 'Right earbud no sound. Charging case works fine. Reset attempted but not resolved.',
    priority: 'Low', status: 'Received',
    accessoriesSubmitted: ['Charging Case', 'Eartips'], devicePassword: 'N/A',
    estimatedCost: 3500, actualCost: 0, estimatedDays: 2, technicianId: 2,
    customerApproval: true, createdAt: '2026-04-09', updatedAt: '2026-04-09', completedAt: null,
    images: ['🎧'], notes: [], partsUsed: [],
  },
  {
    id: 7, repairId: 'RPR-1007', customerName: 'Amit Singh', customerMobile: '+91 32109 87654', customerEmail: 'amits@email.com',
    deviceBrand: 'Xiaomi', deviceModel: 'Redmi Note 13 Pro', imei: '369852147852369', serialNumber: 'P2Q5R8S1T4',
    deviceColor: 'Forest Green', issueCategory: 'Software Issue',
    description: 'Phone stuck in boot loop after MIUI update. Can access recovery mode. Need ROM reflash.',
    priority: 'Medium', status: 'Diagnosing',
    accessoriesSubmitted: [], devicePassword: 'Provided',
    estimatedCost: 1500, actualCost: 0, estimatedDays: 1, technicianId: 2,
    customerApproval: true, createdAt: '2026-04-09', updatedAt: '2026-04-09', completedAt: null,
    images: ['📱'], notes: [], partsUsed: [],
  },
  {
    id: 8, repairId: 'RPR-1008', customerName: 'Sneha Reddy', customerMobile: '+91 21098 76543', customerEmail: 'snehar@email.com',
    deviceBrand: 'Apple', deviceModel: 'iPhone 13', imei: '347896521478963', serialNumber: 'V7B8N9M1K2',
    deviceColor: 'Starlight', issueCategory: 'Microphone Issue',
    description: 'During calls, other person cannot hear. Voice memos recording is silent. Bottom mic suspected.',
    priority: 'Low', status: 'Ready for Delivery',
    accessoriesSubmitted: ['Original Box'], devicePassword: 'Provided',
    estimatedCost: 3200, actualCost: 2800, estimatedDays: 1, technicianId: 1,
    customerApproval: true, createdAt: '2026-04-07', updatedAt: '2026-04-09', completedAt: null,
    images: ['📱'], notes: [], partsUsed: [{ name: 'Bottom Microphone Flex', qty: 1, cost: 1200 }],
  },
  {
    id: 9, repairId: 'RPR-1009', customerName: 'Vikram Patel', customerMobile: '+91 10987 65432', customerEmail: 'vikramp@email.com',
    deviceBrand: 'OnePlus', deviceModel: 'OnePlus 11R', imei: '365214789632147', serialNumber: 'C3D6F9G2H5',
    deviceColor: 'Sonic Black', issueCategory: 'Motherboard Repair',
    description: 'Phone dead after water splash. No power. No charging LED. Motherboard suspected short circuit.',
    priority: 'Urgent', status: 'Waiting for Parts',
    accessoriesSubmitted: ['Charger', 'Cable'], devicePassword: 'Not Required',
    estimatedCost: 15000, actualCost: 15000, estimatedDays: 5, technicianId: 5,
    customerApproval: false, createdAt: '2026-04-04', updatedAt: '2026-04-08', completedAt: null,
    images: ['📱', '📱'], notes: [], partsUsed: [{ name: 'Power IC Chip', qty: 1, cost: 3500 }],
  },
  {
    id: 10, repairId: 'RPR-1010', customerName: 'Ananya Gupta', customerMobile: '+91 99887 76655', customerEmail: 'ananya@email.com',
    deviceBrand: 'Samsung', deviceModel: 'Galaxy A55', imei: '358741236547896', serialNumber: 'X2Y4Z6A8B1',
    deviceColor: 'Awesome White', issueCategory: 'Display Issue',
    description: 'Screen flickering and green tint on left side. Phone not dropped. Happened suddenly.',
    priority: 'High', status: 'Received',
    accessoriesSubmitted: ['Phone Only'], devicePassword: 'Provided',
    estimatedCost: 6500, actualCost: 0, estimatedDays: 2, technicianId: 3,
    customerApproval: true, createdAt: '2026-04-09', updatedAt: '2026-04-09', completedAt: null,
    images: ['📱'], notes: [], partsUsed: [],
  },
]

export const repairActivityFeed = [
  { id: 1, text: 'New repair ticket #RPR-1010 created for Galaxy A55', time: '10 min ago', type: 'created', user: 'Admin' },
  { id: 2, text: 'Priya Sharma started diagnosing #RPR-1007 - Redmi Note 13 Pro', time: '25 min ago', type: 'diagnosis', user: 'Priya' },
  { id: 3, text: '#RPR-1004 iPhone 14 passed Quality Check', time: '45 min ago', type: 'qc', user: 'Deepika' },
  { id: 4, text: '#RPR-1008 iPhone 13 marked Ready for Delivery', time: '1 hour ago', type: 'ready', user: 'Rajesh' },
  { id: 5, text: 'Parts ordered for #RPR-1003 OnePlus 12 charging port', time: '2 hours ago', type: 'parts', user: 'Admin' },
  { id: 6, text: '#RPR-1005 Galaxy S23 water damage repair started', time: '3 hours ago', type: 'progress', user: 'Vikram' },
  { id: 7, text: 'Customer Karan approved repair estimate for #RPR-1003', time: '4 hours ago', type: 'approval', user: 'System' },
  { id: 8, text: '#RPR-1002 Galaxy S24 Ultra battery replacement - diagnosing complete', time: '5 hours ago', type: 'diagnosis', user: 'Sneha' },
]

export const partsInventory = [
  { id: 1, name: 'iPhone 15 Pro Max Display Assembly', category: 'Display', stock: 5, price: 12000, supplier: 'Mobile Parts Co.' },
  { id: 2, name: 'Samsung S24 Ultra Battery', category: 'Battery', stock: 8, price: 3200, supplier: 'Tech Supplies Inc.' },
  { id: 3, name: 'USB-C Charging Port Flex', category: 'Charging', stock: 15, price: 1200, supplier: 'PartsHub' },
  { id: 4, name: 'iPhone 14 Rear Camera Module', category: 'Camera', stock: 4, price: 5500, supplier: 'Mobile Parts Co.' },
  { id: 5, name: 'Bottom Microphone Flex', category: 'Audio', stock: 12, price: 1200, supplier: 'PartsHub' },
  { id: 6, name: 'Power IC Chip', category: 'Motherboard', stock: 20, price: 3500, supplier: 'ChipMart' },
  { id: 7, name: 'Moisture Seal Kit', category: 'Seal', stock: 30, price: 800, supplier: 'Tech Supplies Inc.' },
  { id: 8, name: 'iPhone 15 Pro Max Battery', category: 'Battery', stock: 6, price: 4500, supplier: 'Mobile Parts Co.' },
  { id: 9, name: 'Samsung S24 Ultra Display', category: 'Display', stock: 3, price: 14000, supplier: 'PartsHub' },
  { id: 10, name: 'OnePlus 12 Battery', category: 'Battery', stock: 7, price: 2800, supplier: 'Tech Supplies Inc.' },
]

export const repairAnalytics = {
  monthlyRepairs: [
    { month: 'Jan', completed: 85, received: 92, revenue: 285000 },
    { month: 'Feb', completed: 72, received: 78, revenue: 242000 },
    { month: 'Mar', completed: 98, received: 105, revenue: 356000 },
    { month: 'Apr', completed: 88, received: 94, revenue: 312000 },
    { month: 'May', completed: 112, received: 118, revenue: 425000 },
    { month: 'Jun', completed: 105, received: 110, revenue: 398000 },
  ],
  issueDistribution: [
    { name: 'Screen Repair', value: 35, color: '#8b5cf6' },
    { name: 'Battery', value: 22, color: '#4f6bff' },
    { name: 'Software', value: 18, color: '#22c55e' },
    { name: 'Camera', value: 12, color: '#f59e0b' },
    { name: 'Charging', value: 8, color: '#ef4444' },
    { name: 'Other', value: 5, color: '#06b6d4' },
  ],
  technicianPerformance: [
    { name: 'Rajesh', completed: 28, pending: 2, efficiency: 96 },
    { name: 'Priya', completed: 24, pending: 4, efficiency: 93 },
    { name: 'Amit', completed: 18, pending: 5, efficiency: 88 },
    { name: 'Sneha', completed: 15, pending: 3, efficiency: 91 },
    { name: 'Vikram', completed: 22, pending: 6, efficiency: 85 },
  ],
  turnaroundTime: [2.5, 3.2, 2.8, 4.1, 3.5, 2.9, 3.8, 2.2, 3.0, 2.6, 3.4, 2.7],
}

export const repairNavItems = [
  { id: 'repair-dashboard', label: 'Repair Dashboard', icon: 'FiTool', path: '/repair-dashboard' },
  { id: 'new-repair', label: 'New Repair Ticket', icon: 'FiPlus', path: '/new-repair' },
  { id: 'technician-panel', label: 'Technician Panel', icon: 'FiUserCheck', path: '/technician-panel' },
  { id: 'device-tracking', label: 'Device Tracking', icon: 'FiSmartphone', path: '/device-tracking' },
  { id: 'repair-history', label: 'Repair History', icon: 'FiFileText', path: '/repair-history' },
  { id: 'repair-analytics', label: 'Repair Analytics', icon: 'FiBarChart2', path: '/repair-analytics' },
]
