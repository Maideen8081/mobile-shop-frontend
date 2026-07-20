export interface WarrantyRecord {
  id: number
  warrantyId: string
  productName: string
  productBrand: string
  productImage: string
  customerName: string
  customerMobile: string
  customerEmail: string
  imei: string
  serialNumber: string
  invoiceNumber: string
  purchaseDate: string
  warrantyStart: string
  warrantyEnd: string
  remainingDays: number
  warrantyProvider: 'Brand' | 'Seller' | 'Extended'
  status: 'Active' | 'Expiring Soon' | 'Expired' | 'Claimed' | 'Under Review'
  coverageType: string
  claimCount: number
  lastClaimDate: string | null
}

export interface WarrantyClaim {
  id: number
  claimId: string
  warrantyId: number
  customerName: string
  customerMobile: string
  productName: string
  productBrand: string
  imei: string
  issue: string
  description: string
  status: 'Submitted' | 'Under Verification' | 'Brand Review' | 'Approved' | 'Rejected' | 'Replacement Initiated' | 'Completed'
  priority: 'Low' | 'Medium' | 'High' | 'Critical'
  submittedDate: string
  verifiedDate: string | null
  approvedDate: string | null
  completedDate: string | null
  estimatedDays: number
  damagePhotos: string[]
  resolution: 'Repair' | 'Replacement' | 'Refund' | null
  assignedTo: string
  notes: { text: string; by: string; time: string }[]
}

export interface BrandWarranty {
  id: number
  brand: string
  logo: string
  policyName: string
  defaultDuration: number
  coverageDetails: string
  claimSuccessRate: number
  averageSla: number
  activeWarranties: number
  totalClaims: number
  color: string
}

export const warrantyKPIs = [
  { id: 1, title: 'Active Warranties', value: 1842, prefix: '', growth: 12.5, trend: 'up' as const, subtitle: 'vs last month', color: '#4f6bff', bgGlow: 'rgba(79,107,255,0.12)', icon: 'FiShield', sparkline: [42, 48, 45, 52, 50, 55, 53, 58, 56, 62] },
  { id: 2, title: 'Expiring Soon', value: 48, prefix: '', growth: -8.2, trend: 'down' as const, subtitle: 'within 30 days', color: '#f59e0b', bgGlow: 'rgba(245,158,11,0.12)', icon: 'FiClock', sparkline: [12, 10, 14, 9, 11, 7, 10, 6, 8, 7] },
  { id: 3, title: 'Warranty Claims', value: 24, prefix: '', growth: 18.7, trend: 'up' as const, subtitle: 'pending review', color: '#ef4444', bgGlow: 'rgba(239,68,68,0.12)', icon: 'FiFileText', sparkline: [8, 12, 10, 15, 13, 18, 16, 20, 18, 22] },
  { id: 4, title: 'Claims Approved', value: 156, prefix: '', growth: 22.3, trend: 'up' as const, subtitle: 'this quarter', color: '#22c55e', bgGlow: 'rgba(34,197,94,0.12)', icon: 'FiCheckCircle', sparkline: [18, 22, 20, 28, 24, 30, 26, 32, 28, 35] },
  { id: 5, title: 'Claims Rejected', value: 18, prefix: '', growth: -5.1, trend: 'down' as const, subtitle: 'this quarter', color: '#ef4444', bgGlow: 'rgba(239,68,68,0.12)', icon: 'FiXCircle', sparkline: [5, 4, 6, 3, 5, 2, 4, 2, 3, 2] },
  { id: 6, title: 'Brand Coverage', value: 92, suffix: '%', growth: 3.4, trend: 'up' as const, subtitle: 'of products', color: '#8b5cf6', bgGlow: 'rgba(139,92,246,0.12)', icon: 'FiAward', sparkline: [82, 84, 86, 85, 88, 87, 90, 89, 91, 92] },
  { id: 7, title: 'Revenue Protected', value: 28450000, prefix: '₹', growth: 15.8, trend: 'up' as const, subtitle: 'total coverage value', color: '#06b6d4', bgGlow: 'rgba(6,182,212,0.12)', icon: 'FiDollarSign', sparkline: [22, 30, 28, 38, 35, 45, 42, 52, 48, 58] },
  { id: 8, title: 'Expired Warranties', value: 324, prefix: '', growth: 6.2, trend: 'up' as const, subtitle: 'total expired', color: '#64748b', bgGlow: 'rgba(100,116,139,0.12)', icon: 'FiCalendar', sparkline: [15, 18, 16, 22, 20, 25, 23, 28, 26, 30] },
]

export const warrantyRecords: WarrantyRecord[] = [
  { id: 1, warrantyId: 'WRN-1001', productName: 'iPhone 15 Pro Max', productBrand: 'Apple', productImage: '📱', customerName: 'Arun Kumar', customerMobile: '+91 98765 43210', customerEmail: 'arun@email.com', imei: '358962874512369', serialNumber: 'F2LZR4G8H9', invoiceNumber: 'INV-2024-001', purchaseDate: '2025-10-15', warrantyStart: '2025-10-15', warrantyEnd: '2027-10-15', remainingDays: 523, warrantyProvider: 'Brand', status: 'Active', coverageType: 'Standard Manufacturer Warranty', claimCount: 0, lastClaimDate: null },
  { id: 2, warrantyId: 'WRN-1002', productName: 'Galaxy S24 Ultra', productBrand: 'Samsung', productImage: '📱', customerName: 'Meera Joshi', customerMobile: '+91 87654 32109', customerEmail: 'meera@email.com', imei: '359874125632147', serialNumber: 'R9T2Y5H7K3', invoiceNumber: 'INV-2024-002', purchaseDate: '2025-08-20', warrantyStart: '2025-08-20', warrantyEnd: '2026-08-20', remainingDays: 102, warrantyProvider: 'Brand', status: 'Expiring Soon', coverageType: 'Standard Manufacturer Warranty', claimCount: 1, lastClaimDate: '2026-03-15' },
  { id: 3, warrantyId: 'WRN-1003', productName: 'OnePlus 12', productBrand: 'OnePlus', productImage: '📱', customerName: 'Karan Patel', customerMobile: '+91 76543 21098', customerEmail: 'karan@email.com', imei: '351248963257841', serialNumber: 'M4N7B2V6C1', invoiceNumber: 'INV-2024-003', purchaseDate: '2025-06-10', warrantyStart: '2025-06-10', warrantyEnd: '2026-06-10', remainingDays: 31, warrantyProvider: 'Seller', status: 'Expiring Soon', coverageType: 'Seller Extended Warranty', claimCount: 0, lastClaimDate: null },
  { id: 4, warrantyId: 'WRN-1004', productName: 'iPhone 14', productBrand: 'Apple', productImage: '📱', customerName: 'Neha Gupta', customerMobile: '+91 65432 10987', customerEmail: 'neha@email.com', imei: '358741236985214', serialNumber: 'K1L5P9X3M7', invoiceNumber: 'INV-2024-004', purchaseDate: '2024-11-05', warrantyStart: '2024-11-05', warrantyEnd: '2025-11-05', remainingDays: -185, warrantyProvider: 'Brand', status: 'Expired', coverageType: 'Standard Manufacturer Warranty', claimCount: 0, lastClaimDate: null },
  { id: 5, warrantyId: 'WRN-1005', productName: 'Galaxy S23', productBrand: 'Samsung', productImage: '📱', customerName: 'Rohit Verma', customerMobile: '+91 54321 09876', customerEmail: 'rohit@email.com', imei: '352147896325874', serialNumber: 'H3G6J9L2N5', invoiceNumber: 'INV-2024-005', purchaseDate: '2025-01-20', warrantyStart: '2025-01-20', warrantyEnd: '2027-01-20', remainingDays: 255, warrantyProvider: 'Brand', status: 'Active', coverageType: 'Standard Manufacturer Warranty', claimCount: 1, lastClaimDate: '2026-02-10' },
  { id: 6, warrantyId: 'WRN-1006', productName: 'AirPods Pro 2', productBrand: 'Apple', productImage: '🎧', customerName: 'Priya Sharma', customerMobile: '+91 43210 98765', customerEmail: 'priya@email.com', imei: 'N/A', serialNumber: 'A2B3C4D5E6', invoiceNumber: 'INV-2024-006', purchaseDate: '2025-12-01', warrantyStart: '2025-12-01', warrantyEnd: '2026-12-01', remainingDays: 205, warrantyProvider: 'Brand', status: 'Active', coverageType: 'Standard Manufacturer Warranty', claimCount: 0, lastClaimDate: null },
  { id: 7, warrantyId: 'WRN-1007', productName: 'Redmi Note 13 Pro', productBrand: 'Xiaomi', productImage: '📱', customerName: 'Amit Singh', customerMobile: '+91 32109 87654', customerEmail: 'amits@email.com', imei: '369852147852369', serialNumber: 'P2Q5R8S1T4', invoiceNumber: 'INV-2024-007', purchaseDate: '2025-09-15', warrantyStart: '2025-09-15', warrantyEnd: '2026-09-15', remainingDays: 128, warrantyProvider: 'Brand', status: 'Under Review', coverageType: 'Standard Manufacturer Warranty', claimCount: 2, lastClaimDate: '2026-04-01' },
  { id: 8, warrantyId: 'WRN-1008', productName: 'iPhone 13', productBrand: 'Apple', productImage: '📱', customerName: 'Sneha Reddy', customerMobile: '+91 21098 76543', customerEmail: 'snehar@email.com', imei: '347896521478963', serialNumber: 'V7B8N9M1K2', invoiceNumber: 'INV-2024-008', purchaseDate: '2024-07-10', warrantyStart: '2024-07-10', warrantyEnd: '2025-07-10', remainingDays: -304, warrantyProvider: 'Brand', status: 'Expired', coverageType: 'Standard Manufacturer Warranty', claimCount: 0, lastClaimDate: null },
  { id: 9, warrantyId: 'WRN-1009', productName: 'OnePlus 11R', productBrand: 'OnePlus', productImage: '📱', customerName: 'Vikram Patel', customerMobile: '+91 10987 65432', customerEmail: 'vikramp@email.com', imei: '365214789632147', serialNumber: 'C3D6F9G2H5', invoiceNumber: 'INV-2024-009', purchaseDate: '2025-04-18', warrantyStart: '2025-04-18', warrantyEnd: '2027-04-18', remainingDays: 343, warrantyProvider: 'Extended', status: 'Active', coverageType: 'Extended Care+ Plan', claimCount: 0, lastClaimDate: null },
  { id: 10, warrantyId: 'WRN-1010', productName: 'Galaxy A55', productBrand: 'Samsung', productImage: '📱', customerName: 'Ananya Gupta', customerMobile: '+91 99887 76655', customerEmail: 'ananya@email.com', imei: '358741236547896', serialNumber: 'X2Y4Z6A8B1', invoiceNumber: 'INV-2024-010', purchaseDate: '2026-02-01', warrantyStart: '2026-02-01', warrantyEnd: '2028-02-01', remainingDays: 632, warrantyProvider: 'Brand', status: 'Active', coverageType: 'Standard Manufacturer Warranty', claimCount: 1, lastClaimDate: '2026-03-20' },
  { id: 11, warrantyId: 'WRN-1011', productName: 'iPad Air M2', productBrand: 'Apple', productImage: '📱', customerName: 'Ravi Shankar', customerMobile: '+91 88776 65544', customerEmail: 'ravi@email.com', imei: '365214789632148', serialNumber: 'L9M8N7P6Q5', invoiceNumber: 'INV-2024-011', purchaseDate: '2025-11-20', warrantyStart: '2025-11-20', warrantyEnd: '2027-11-20', remainingDays: 559, warrantyProvider: 'Brand', status: 'Active', coverageType: 'Standard Manufacturer Warranty', claimCount: 0, lastClaimDate: null },
  { id: 12, warrantyId: 'WRN-1012', productName: 'Galaxy Watch 6', productBrand: 'Samsung', productImage: '⌚', customerName: 'Divya Kaur', customerMobile: '+91 77665 54433', customerEmail: 'divya@email.com', imei: '352147896325875', serialNumber: 'W1E2R3T4Y5', invoiceNumber: 'INV-2024-012', purchaseDate: '2025-05-15', warrantyStart: '2025-05-15', warrantyEnd: '2026-05-15', remainingDays: 5, warrantyProvider: 'Seller', status: 'Expiring Soon', coverageType: 'Seller Extended Warranty', claimCount: 0, lastClaimDate: null },
]

export const warrantyClaims: WarrantyClaim[] = [
  { id: 1, claimId: 'CLM-2001', warrantyId: 1, customerName: 'Arun Kumar', customerMobile: '+91 98765 43210', productName: 'iPhone 15 Pro Max', productBrand: 'Apple', imei: '358962874512369', issue: 'Display Flickering', description: 'Screen flickers intermittently, appears after iOS update.', status: 'Submitted', priority: 'High', submittedDate: '2026-05-08', verifiedDate: null, approvedDate: null, completedDate: null, estimatedDays: 7, damagePhotos: ['📱', '📱'], resolution: null, assignedTo: 'Rajesh', notes: [] },
  { id: 2, claimId: 'CLM-2002', warrantyId: 2, customerName: 'Meera Joshi', customerMobile: '+91 87654 32109', productName: 'Galaxy S24 Ultra', productBrand: 'Samsung', imei: '359874125632147', issue: 'Battery Swelling', description: 'Battery swelling noticed. Back panel lifting. Risk of damage.', status: 'Under Verification', priority: 'Critical', submittedDate: '2026-05-05', verifiedDate: '2026-05-06', approvedDate: null, completedDate: null, estimatedDays: 5, damagePhotos: ['📱', '📱', '📱'], resolution: null, assignedTo: 'Priya', notes: [{ text: 'Photos reviewed - visible swelling confirmed', by: 'Priya', time: '2026-05-06' }] },
  { id: 3, claimId: 'CLM-2003', warrantyId: 3, customerName: 'Karan Patel', customerMobile: '+91 76543 21098', productName: 'OnePlus 12', productBrand: 'OnePlus', imei: '351248963257841', issue: 'Charging Port Failure', description: 'USB-C port not working. Wireless charging works.', status: 'Brand Review', priority: 'Medium', submittedDate: '2026-04-28', verifiedDate: '2026-04-30', approvedDate: null, completedDate: null, estimatedDays: 10, damagePhotos: ['📱'], resolution: null, assignedTo: 'Amit', notes: [{ text: 'Verified issue with charging port', by: 'Amit', time: '2026-04-30' }, { text: 'Sent to OnePlus for brand review', by: 'Admin', time: '2026-05-02' }] },
  { id: 4, claimId: 'CLM-2004', warrantyId: 4, customerName: 'Neha Gupta', customerMobile: '+91 65432 10987', productName: 'iPhone 14', productBrand: 'Apple', imei: '358741236985214', issue: 'Camera Malfunction', description: 'Rear camera shows black screen. Front camera works.', status: 'Approved', priority: 'Medium', submittedDate: '2026-04-20', verifiedDate: '2026-04-22', approvedDate: '2026-04-25', completedDate: null, estimatedDays: 7, damagePhotos: ['📱'], resolution: 'Repair', assignedTo: 'Rajesh', notes: [{ text: 'Camera module confirmed faulty', by: 'Rajesh', time: '2026-04-22' }, { text: 'Apple approved repair', by: 'Admin', time: '2026-04-25' }] },
  { id: 5, claimId: 'CLM-2005', warrantyId: 5, customerName: 'Rohit Verma', customerMobile: '+91 54321 09876', productName: 'Galaxy S23', productBrand: 'Samsung', imei: '352147896325874', issue: 'Water Damage', description: 'Phone exposed to moisture. Speaker not working.', status: 'Rejected', priority: 'High', submittedDate: '2026-03-15', verifiedDate: '2026-03-18', approvedDate: null, completedDate: '2026-03-20', estimatedDays: 0, damagePhotos: ['📱', '📱'], resolution: null, assignedTo: 'Vikram', notes: [{ text: 'Water damage detected - warranty void', by: 'Vikram', time: '2026-03-18' }, { text: 'Claim rejected - liquid damage not covered', by: 'Admin', time: '2026-03-20' }] },
  { id: 6, claimId: 'CLM-2006', warrantyId: 6, customerName: 'Priya Sharma', customerMobile: '+91 43210 98765', productName: 'AirPods Pro 2', productBrand: 'Apple', imei: 'N/A', issue: 'Right Earbud No Sound', description: 'Right earbud produces no audio. Reset tried.', status: 'Replacement Initiated', priority: 'Medium', submittedDate: '2026-04-10', verifiedDate: '2026-04-12', approvedDate: '2026-04-14', completedDate: null, estimatedDays: 5, damagePhotos: ['🎧'], resolution: 'Replacement', assignedTo: 'Sneha', notes: [{ text: 'Hardware fault confirmed', by: 'Sneha', time: '2026-04-12' }, { text: 'Replacement approved by Apple', by: 'Admin', time: '2026-04-14' }, { text: 'Replacement unit shipped', by: 'Admin', time: '2026-04-16' }] },
  { id: 7, claimId: 'CLM-2007', warrantyId: 7, customerName: 'Amit Singh', customerMobile: '+91 32109 87654', productName: 'Redmi Note 13 Pro', productBrand: 'Xiaomi', imei: '369852147852369', issue: 'Boot Loop After Update', description: 'Phone stuck in boot loop after MIUI update.', status: 'Completed', priority: 'Medium', submittedDate: '2026-03-28', verifiedDate: '2026-03-30', approvedDate: '2026-04-01', completedDate: '2026-04-03', estimatedDays: 6, damagePhotos: ['📱'], resolution: 'Repair', assignedTo: 'Priya', notes: [{ text: 'Software corruption confirmed', by: 'Priya', time: '2026-03-30' }, { text: 'Firmware reflash completed', by: 'Priya', time: '2026-04-03' }] },
  { id: 8, claimId: 'CLM-2008', warrantyId: 8, customerName: 'Sneha Reddy', customerMobile: '+91 21098 76543', productName: 'iPhone 13', productBrand: 'Apple', imei: '347896521478963', issue: 'Microphone Not Working', description: 'Bottom microphone not working during calls.', status: 'Completed', priority: 'Low', submittedDate: '2026-03-10', verifiedDate: '2026-03-12', approvedDate: '2026-03-14', completedDate: '2026-03-16', estimatedDays: 6, damagePhotos: ['📱'], resolution: 'Repair', assignedTo: 'Rajesh', notes: [{ text: 'Microphone flex damaged', by: 'Rajesh', time: '2026-03-12' }, { text: 'Replacement completed under warranty', by: 'Rajesh', time: '2026-03-16' }] },
]

export const brandWarranties: BrandWarranty[] = [
  { id: 1, brand: 'Apple', logo: '🍎', policyName: 'Apple Limited Warranty', defaultDuration: 365, coverageDetails: 'Manufacturing defects, hardware failures. Excludes accidental damage, water damage.', claimSuccessRate: 94, averageSla: 5, activeWarranties: 624, totalClaims: 89, color: '#000000' },
  { id: 2, brand: 'Samsung', logo: '📱', policyName: 'Samsung Standard Warranty', defaultDuration: 365, coverageDetails: 'Manufacturing defects, battery issues, display problems. Excludes physical damage.', claimSuccessRate: 91, averageSla: 6, activeWarranties: 512, totalClaims: 76, color: '#1428A0' },
  { id: 3, brand: 'OnePlus', logo: '⚡', policyName: 'OnePlus Warranty Program', defaultDuration: 365, coverageDetails: 'Hardware defects, charging port issues, software glitches. Excludes screen cracks.', claimSuccessRate: 88, averageSla: 7, activeWarranties: 298, totalClaims: 45, color: '#EB0028' },
  { id: 4, brand: 'Xiaomi', logo: '🪐', policyName: 'Xiaomi Warranty Policy', defaultDuration: 365, coverageDetails: 'Manufacturing defects, battery, charging. Excludes unauthorized repairs.', claimSuccessRate: 85, averageSla: 8, activeWarranties: 245, totalClaims: 38, color: '#FF6900' },
  { id: 5, brand: 'Vivo', logo: '📷', policyName: 'Vivo Standard Warranty', defaultDuration: 365, coverageDetails: 'Hardware defects, camera issues, battery problems. Excludes physical damage.', claimSuccessRate: 87, averageSla: 7, activeWarranties: 98, totalClaims: 15, color: '#415CFF' },
  { id: 6, brand: 'Oppo', logo: '📸', policyName: 'Oppo Warranty Service', defaultDuration: 365, coverageDetails: 'Manufacturing defects, charging, display. Excludes water damage.', claimSuccessRate: 86, averageSla: 7, activeWarranties: 85, totalClaims: 12, color: '#1A6B37' },
]

export const warrantyAnalytics = {
  claimsTrend: [
    { month: 'Jan', submitted: 18, approved: 14, rejected: 2 },
    { month: 'Feb', submitted: 22, approved: 17, rejected: 3 },
    { month: 'Mar', submitted: 28, approved: 22, rejected: 4 },
    { month: 'Apr', submitted: 20, approved: 16, rejected: 2 },
    { month: 'May', submitted: 25, approved: 20, rejected: 3 },
    { month: 'Jun', submitted: 30, approved: 24, rejected: 4 },
  ],
  brandWiseClaims: [
    { name: 'Apple', value: 35, color: '#000000' },
    { name: 'Samsung', value: 28, color: '#1428A0' },
    { name: 'OnePlus', value: 18, color: '#EB0028' },
    { name: 'Xiaomi', value: 12, color: '#FF6900' },
    { name: 'Others', value: 7, color: '#64748b' },
  ],
  expiryDistribution: [
    { name: 'Active (>90 days)', value: 65, color: '#22c55e' },
    { name: 'Expiring Soon (30-90d)', value: 18, color: '#f59e0b' },
    { name: 'Critical (<30 days)', value: 8, color: '#ef4444' },
    { name: 'Expired', value: 9, color: '#64748b' },
  ],
  claimApprovalRatio: 82.5,
  warrantyRevenueProtected: 28450000,
}

export const expiryAlerts = [
  { id: 1, customerName: 'Divya Kaur', product: 'Galaxy Watch 6', expiryDate: '2026-05-15', remainingDays: 5, mobile: '+91 77665 54433', email: 'divya@email.com', reminded: false, extendOffer: true },
  { id: 2, customerName: 'Karan Patel', product: 'OnePlus 12', expiryDate: '2026-06-10', remainingDays: 31, mobile: '+91 76543 21098', email: 'karan@email.com', reminded: true, extendOffer: true },
  { id: 3, customerName: 'Meera Joshi', product: 'Galaxy S24 Ultra', expiryDate: '2026-08-20', remainingDays: 102, mobile: '+91 87654 32109', email: 'meera@email.com', reminded: false, extendOffer: false },
  { id: 4, customerName: 'Amit Singh', product: 'Redmi Note 13 Pro', expiryDate: '2026-09-15', remainingDays: 128, mobile: '+91 32109 87654', email: 'amits@email.com', reminded: false, extendOffer: true },
  { id: 5, customerName: 'Ravi Kumar', product: 'iPhone 14', expiryDate: '2026-06-25', remainingDays: 46, mobile: '+91 99887 76655', email: 'ravik@email.com', reminded: true, extendOffer: true },
]

export const warrantyNavItems = [
  { id: 'warranty-dashboard', label: 'Warranty Dashboard', icon: 'FiShield', path: '/warranty-dashboard' },
  { id: 'warranty-tracking', label: 'Warranty Tracking', icon: 'FiSearch', path: '/warranty-tracking' },
  { id: 'warranty-claims', label: 'Warranty Claims', icon: 'FiFileText', path: '/warranty-claims' },
  { id: 'expiry-alerts', label: 'Expiry Alerts', icon: 'FiClock', path: '/expiry-alerts' },
  { id: 'brand-warranty', label: 'Brand Warranty Records', icon: 'FiAward', path: '/brand-warranty' },
  { id: 'warranty-analytics', label: 'Warranty Analytics', icon: 'FiBarChart2', path: '/warranty-analytics' },
]
