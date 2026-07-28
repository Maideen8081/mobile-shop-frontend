import api from './api'

export interface Review {
  id: string
  productId: number
  userId: string
  userName: string
  rating: number
  comment: string
  orderId: string
  createdAt: string
  images: string[]
  isGuest?: boolean
}

export interface ProductRating {
  average: number
  count: number
  distribution: Record<number, number>
}

const REVIEW_URL = '/api/v1/reviews'

function mapApiReview(item: any): Review {
  return {
    id: String(item.id),
    productId: item.product,
    userId: String(item.user),
    userName: item.user_name,
    rating: item.star,
    comment: item.content,
    orderId: '',
    createdAt: item.created_at,
    images: item.images?.map((img: any) => img.image) || [],
  }
}

export const reviewService = {
  async getByProduct(productId: number): Promise<Review[]> {
    try {
      const res = await api.get(`${REVIEW_URL}/`, { params: { product: productId } })
      const body = res.data
      const items = body.data || []
      return items.map(mapApiReview)
    } catch {
      return []
    }
  },

  async create(productId: number, rating: number, comment: string, _orderId: string, files?: File[]): Promise<Review> {
    const res = await api.post(`${REVIEW_URL}/create/`, {
      product: productId,
      star: rating,
      content: comment,
    })
    const review = mapApiReview(res.data.data)
    if (files && files.length > 0) {
      const formData = new FormData()
      files.forEach((f) => formData.append('images', f))
      const imgRes = await api.post(`${REVIEW_URL}/${review.id}/images/upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      review.images = (imgRes.data.data || []).map((img: any) => img.image)
    }
    return review
  },

  async hasUserReviewed(productId: number): Promise<boolean> {
    try {
      const profile = localStorage.getItem('user_profile')
      let currentUserName = ''
      if (profile) {
        const p = JSON.parse(profile)
        currentUserName = (p.name || p.email || '').toLowerCase()
      }
      if (!currentUserName) return false
      const res = await api.get(`${REVIEW_URL}/`, { params: { product: productId } })
      const body = res.data
      const items = body.data || []
      return items.some((r: any) => (r.user_name || '').toLowerCase() === currentUserName)
    } catch {
      return false
    }
  },

  async getProductRating(productId: number): Promise<ProductRating> {
    try {
      const res = await api.get(`${REVIEW_URL}/`, { params: { product: productId } })
      const body = res.data
      const items = body.data || []
      const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      items.forEach((r: any) => {
        distribution[r.star] = (distribution[r.star] || 0) + 1
      })
      const count = items.length
      const average = count > 0
        ? Math.round((items.reduce((sum: number, r: any) => sum + r.star, 0) / count) * 10) / 10
        : 0
      return { average, count, distribution }
    } catch {
      return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
    }
  },

  hasDeliveredOrder(productId: number): { eligible: boolean; orderId: string } {
    try {
      const orders = JSON.parse(localStorage.getItem('order_history') || '[]')
      for (const order of orders) {
        if (order.status === 'delivered' || order.delivery_status === 'delivered') {
          const items = order.items || []
          const match = items.find((item: any) => {
            const pid = item.productId || item.product_id
            return Number(pid) === Number(productId)
          })
          if (match) {
            return { eligible: true, orderId: order.orderId || order.order_id || '' }
          }
        }
      }
    } catch {}
    return { eligible: false, orderId: '' }
  },
}
