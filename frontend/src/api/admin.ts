import api from './client'
import type { Order, Product } from '../lib/types'

export interface Paginated<T> {
  data: T[]
  meta: { current_page: number; last_page: number; total: number }
}

export interface DashboardStats {
  total_orders: number
  total_revenue: number
  total_products: number
  low_stock_products: number
  total_customers: number
  orders_by_status: Record<string, number>
  recent_orders: Order[]
}

export async function fetchDashboard(): Promise<DashboardStats> {
  const { data } = await api.get<{ data: DashboardStats }>('/admin/dashboard')
  return data.data
}

export interface ProductInput {
  name: string
  category_id: number
  type: 'book' | 'other'
  price: number
  weight_gram?: number
  stock?: number
  status?: 'active' | 'inactive'
  description?: string
  images?: string[]
  book_detail?: {
    isbn?: string
    author?: string
    publisher?: string
    year?: number
    pages?: number
    language?: string
  }
}

export async function fetchAdminProducts(params: {
  q?: string
  type?: string
  status?: string
  page?: number
} = {}): Promise<Paginated<Product>> {
  const { data } = await api.get<Paginated<Product>>('/admin/products', { params })
  return data
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const { data } = await api.post<{ data: Product }>('/admin/products', input)
  return data.data
}

export async function updateProduct(id: number, input: Partial<ProductInput>): Promise<Product> {
  const { data } = await api.put<{ data: Product }>(`/admin/products/${id}`, input)
  return data.data
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/admin/products/${id}`)
}

export async function toggleProduct(id: number): Promise<Product> {
  const { data } = await api.post<{ data: Product }>(`/admin/products/${id}/toggle`)
  return data.data
}

export async function fetchAdminOrders(params: {
  status?: string
  q?: string
  page?: number
} = {}): Promise<Paginated<Order>> {
  const { data } = await api.get<Paginated<Order>>('/admin/orders', { params })
  return data
}

export async function fetchAdminOrder(code: string): Promise<Order> {
  const { data } = await api.get<{ data: Order }>(`/admin/orders/${code}`)
  return data.data
}

export async function confirmOrderPayment(code: string): Promise<Order> {
  const { data } = await api.post<{ data: Order }>(`/admin/orders/${code}/confirm-payment`)
  return data.data
}

export async function createOrderShipment(code: string): Promise<Order> {
  const { data } = await api.post<{ data: Order }>(`/admin/orders/${code}/create-shipment`)
  return data.data
}

export async function changeOrderStatus(code: string, status: string): Promise<Order> {
  const { data } = await api.post<{ data: Order }>(`/admin/orders/${code}/status`, { status })
  return data.data
}
