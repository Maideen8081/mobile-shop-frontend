const REVIEWS_KEY = 'product_reviews'

export interface Review {
  id: string
  productId: number
  userId: string
  userName: string
  rating: number
  comment: string
  orderId: string
  createdAt: string
}

export interface ProductRating {
  average: number
  count: number
  distribution: Record<number, number>
}

function getAll(): Review[] {
  try {
    return JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]')
  } catch {
    return []
  }
}

function saveAll(reviews: Review[]) {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews))
}

function getUserId(): string {
  try {
    const profile = JSON.parse(localStorage.getItem('user_profile') || '{}')
    return profile.email || profile.name || 'anonymous'
  } catch {
    return 'anonymous'
  }
}

function getUserName(): string {
  try {
    const profile = JSON.parse(localStorage.getItem('user_profile') || '{}')
    return profile.name || profile.email || 'User'
  } catch {
    return 'User'
  }
}

export const reviewService = {
  getByProduct(productId: number): Review[] {
    return getAll()
      .filter((r) => r.productId === productId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  create(productId: number, rating: number, comment: string, orderId: string): Review {
    const reviews = getAll()
    const review: Review = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      productId,
      userId: getUserId(),
      userName: getUserName(),
      rating,
      comment,
      orderId,
      createdAt: new Date().toISOString(),
    }
    reviews.push(review)
    saveAll(reviews)
    return review
  },

  hasUserReviewed(productId: number): boolean {
    const userId = getUserId()
    return getAll().some((r) => r.productId === productId && r.userId === userId)
  },

  getProductRating(productId: number): ProductRating {
    const reviews = getAll().filter((r) => r.productId === productId)
    if (reviews.length === 0) {
      return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } }
    }
    const total = reviews.reduce((sum, r) => sum + r.rating, 0)
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    reviews.forEach((r) => {
      distribution[r.rating] = (distribution[r.rating] || 0) + 1
    })
    return {
      average: Math.round((total / reviews.length) * 10) / 10,
      count: reviews.length,
      distribution,
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
