import api from './api'

const BASE = '/api/v1/admin'

export interface DashboardKpis {
  todaySales: number
  todaySalesGrowth: number | null
  monthRevenue: number
  monthRevenueGrowth: number | null
  ordersTotal: number
  ordersOpen: number
  ordersToday: number
  repairsOpen: number
  repairsUrgent: number
  repairsToday: number
  repairsReady: number
  customersTotal: number
  customersNewThisMonth: number
  productsPublished: number
  stockUnits: number
  lowStockCount: number
  outOfStockCount: number
  tradeInsPending: number
}

export interface DashboardData {
  generatedAt: string
  kpis: DashboardKpis
  salesTrend: { date: string; revenue: number; orders: number }[]
  revenueTrend: { month: string; revenue: number; orders: number }[]
  ordersByStatus: { status: string; label: string; count: number }[]
  repairsByStatus: { status: string; label: string; count: number }[]
  categories: { name: string; products: number }[]
  topProducts: { name: string; units: number; revenue: number }[]
  lowStock: { id: number; product: string; variant: string; stock: number; threshold: number }[]
  recentOrders: {
    orderNumber: string
    customer: string
    total: number
    status: string
    statusLabel: string
    paymentStatus: string
    createdAt: string
  }[]
  recentRepairs: {
    id: number
    ticketNumber: string
    customer: string
    device: string
    status: string
    statusLabel: string
    priority: string
    createdAt: string
  }[]
}

export interface AdminCustomer {
  id: number
  name: string
  email: string
  mobile: string
  isActive: boolean
  isVerified: boolean
  dateJoined: string
  ordersCount: number
  totalSpent: number
  repairsCount: number
  lastOrderAt: string | null
}

export interface AdminCustomerDetail extends AdminCustomer {
  addresses: {
    id: number
    fullName: string
    mobile: string
    line: string
    city: string
    state: string
    pincode: string
    type: string
    isDefault: boolean
  }[]
  orders: {
    orderNumber: string
    total: number
    status: string
    statusLabel: string
    paymentStatus: string
    items: number
    createdAt: string
  }[]
  repairs: { id: number; ticketNumber: string; device: string; status: string; statusLabel: string; createdAt: string }[]
}

export interface CustomerPage {
  results: AdminCustomer[]
  count: number
  page: number
  pageSize: number
  summary: { total: number; active: number; newThisMonth: number; withOrders: number }
}

export interface CustomerQuery {
  search?: string
  status?: '' | 'active' | 'inactive'
  sort?: 'newest' | 'oldest' | 'spent' | 'orders' | 'name'
  page?: number
  page_size?: number
}

const unwrap = <T>(r: { data: { data: T } }) => r.data.data

export const adminService = {
  dashboard: () => api.get(`${BASE}/dashboard/`).then(unwrap<DashboardData>),

  customers: (query: CustomerQuery) => api.get(`${BASE}/customers/`, { params: query }).then(unwrap<CustomerPage>),

  customer: (id: number) => api.get(`${BASE}/customers/${id}/`).then(unwrap<AdminCustomerDetail>),

  setCustomerActive: (id: number, isActive: boolean) =>
    api.patch(`${BASE}/customers/${id}/`, { is_active: isActive }).then(unwrap<AdminCustomer>),
}
