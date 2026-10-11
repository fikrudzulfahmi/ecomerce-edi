import api from './client'
import type { AdminSettings, Banner, ChatMessage, Conversation, Order, Product, Voucher, VoucherType } from '../lib/types'

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
  type: 'book' | 'other' | 'ebook' | 'bundle'
  price: number
  weight_gram?: number
  stock?: number
  status?: 'active' | 'inactive'
  description?: string
  images?: string[]
  digital_file?: string | null
  bundle_physical_id?: number | null
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

export async function uploadFile(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<{ path: string }>('/admin/files', form)
  return data.path
}

export async function fetchVouchers(): Promise<Voucher[]> {
  const { data } = await api.get<{ data: Voucher[] }>('/admin/vouchers')
  return data.data
}

export interface VoucherInput {
  code: string
  name: string
  type: VoucherType
  value: number
  min_order?: number
  usage_limit?: number | null
  starts_at?: string | null
  expires_at?: string | null
  is_active?: boolean
}

export async function createVoucher(input: VoucherInput): Promise<Voucher> {
  const { data } = await api.post<{ data: Voucher }>('/admin/vouchers', input)
  return data.data
}

export async function updateVoucher(id: number, input: Partial<VoucherInput>): Promise<Voucher> {
  const { data } = await api.put<{ data: Voucher }>(`/admin/vouchers/${id}`, input)
  return data.data
}

export async function deleteVoucher(id: number): Promise<void> {
  await api.delete(`/admin/vouchers/${id}`)
}

export async function toggleVoucher(id: number): Promise<Voucher> {
  const { data } = await api.post<{ data: Voucher }>(`/admin/vouchers/${id}/toggle`)
  return data.data
}

export async function fetchSettings(): Promise<AdminSettings> {
  const { data } = await api.get<{ data: AdminSettings }>('/admin/settings')
  return data.data
}

export async function updateSettings(settings: AdminSettings): Promise<AdminSettings> {
  const { data } = await api.put<{ data: AdminSettings }>('/admin/settings', settings)
  return data.data
}

export async function fetchAdminBanners(): Promise<Banner[]> {
  const { data } = await api.get<{ data: Banner[] }>('/admin/banners')
  return data.data
}

export interface BannerInput {
  title?: string | null
  subtitle?: string | null
  image?: string | null
  link?: string | null
  sort_order?: number
  is_active?: boolean
}

export async function createBanner(input: BannerInput): Promise<Banner> {
  const { data } = await api.post<{ data: Banner }>('/admin/banners', input)
  return data.data
}

export async function updateBanner(id: number, input: BannerInput): Promise<Banner> {
  const { data } = await api.put<{ data: Banner }>(`/admin/banners/${id}`, input)
  return data.data
}

export async function deleteBanner(id: number): Promise<void> {
  await api.delete(`/admin/banners/${id}`)
}

export async function toggleBanner(id: number): Promise<Banner> {
  const { data } = await api.post<{ data: Banner }>(`/admin/banners/${id}/toggle`)
  return data.data
}

export async function fetchAdminConversations(): Promise<Conversation[]> {
  const { data } = await api.get<{ data: Conversation[] }>('/admin/conversations')
  return data.data
}

export async function fetchAdminMessages(conversationId: number): Promise<ChatMessage[]> {
  const { data } = await api.get<{ data: ChatMessage[] }>(
    `/admin/conversations/${conversationId}/messages`,
  )
  return data.data
}

export async function sendAdminMessage(conversationId: number, content: string): Promise<ChatMessage> {
  const { data } = await api.post<{ data: ChatMessage }>(
    `/admin/conversations/${conversationId}/messages`,
    { content },
  )
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
