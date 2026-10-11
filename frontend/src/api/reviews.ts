import api from './client'
import type { Review } from '../lib/types'

export async function fetchReviews(slug: string): Promise<Review[]> {
  const { data } = await api.get<{ data: Review[] }>(`/products/${slug}/reviews`)
  return data.data
}

export interface ReviewInput {
  order_id: number
  product_id: number
  rating: number
  comment?: string
}

export async function createReview(input: ReviewInput): Promise<Review> {
  const { data } = await api.post<{ data: Review }>('/reviews', input)
  return data.data
}
