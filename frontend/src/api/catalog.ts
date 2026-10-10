import api from './client'
import type { Category, Product } from '../lib/types'

export type ProductSort = 'latest' | 'price_asc' | 'price_desc' | 'name_asc'

export interface ProductQuery {
  q?: string
  category?: string
  type?: 'book' | 'other'
  min_price?: number
  max_price?: number
  sort?: ProductSort
  page?: number
  per_page?: number
}

export interface ProductListResponse {
  data: Product[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export interface ProductDetailResponse {
  data: Product
  related: Product[]
}

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get<{ data: Category[] }>('/categories')
  return data.data
}

export async function fetchProducts(query: ProductQuery = {}): Promise<ProductListResponse> {
  const { data } = await api.get<ProductListResponse>('/products', { params: query })
  return data
}

export async function fetchProduct(slug: string): Promise<ProductDetailResponse> {
  const { data } = await api.get<ProductDetailResponse>(`/products/${slug}`)
  return data
}
