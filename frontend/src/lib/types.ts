export type Role = 'customer' | 'admin'

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  role: Role
  has_password: boolean
  email_verified_at: string | null
  created_at: string
}

export interface AuthResponse {
  data: User
  token: string
}

export interface ApiErrorPayload {
  message: string
  errors?: Record<string, string[]>
}

export interface Category {
  id: number
  name: string
  slug: string
  parent_id: number | null
  children: Category[]
}

export interface BookDetail {
  isbn: string | null
  author: string | null
  publisher: string | null
  year: number | null
  pages: number | null
  language: string | null
}

export type ProductType = 'book' | 'other' | 'ebook' | 'bundle'

export interface Product {
  id: number
  name: string
  slug: string
  type: ProductType
  price: number
  weight_gram: number
  stock: number
  status: string
  images: string[]
  description: string | null
  category: Category | null
  book_detail: BookDetail | null
  digital_file: string | null
  bundle_physical_id: number | null
  rating_avg: number
  rating_count: number
  discount_percent: number
  sale_price: number
  sold_count: number
  created_at: string
}

export interface CartItem {
  id: number
  product_id: number
  qty: number
  subtotal: number
  product: Product
}

export interface Cart {
  id: number
  items: CartItem[]
  subtotal: number
  total_items: number
}

export interface Address {
  id: number
  recipient: string
  phone: string
  province: string
  city: string
  district: string
  postal_code: string
  detail: string
  is_default: boolean
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'COD_PENDING'
  | 'COD_COMPLETED'
  | 'COD_RETURNED'

export type PaymentMethodType = 'gdc' | 'cod'

export interface OrderAddress {
  recipient: string
  phone: string
  province: string
  city: string
  district: string
  postal_code: string
  detail: string
}

export interface OrderItem {
  id: number
  name: string
  price: number
  qty: number
  subtotal: number
  product: Product | null
}

export interface OrderPayment {
  provider: string
  status: string
  external_ref: string | null
  paid_at: string | null
}

export interface OrderShipment {
  courier: string | null
  service: string | null
  awb: string | null
  status: string
  cod_amount: number
  tracking: unknown | null
}

export interface Order {
  id: number
  code: string
  status: OrderStatus
  subtotal: number
  shipping_cost: number
  handling_fee: number
  discount_amount: number
  voucher_code: string | null
  total: number
  payment_method: PaymentMethodType
  address: OrderAddress
  expires_at: string | null
  created_at: string
  items: OrderItem[]
  payment: OrderPayment | null
  shipment: OrderShipment | null
}

export interface ShippingOption {
  courier: string
  service: string
  cost: number
  estimate: string | null
}

export interface LibraryItem {
  id: number
  product_id: number
  name: string
  type: ProductType | null
  image: string | null
  order_code: string
  purchased_at: string | null
}

export type VoucherType = 'free_shipping' | 'discount_fixed' | 'discount_percent'

export interface Voucher {
  id: number
  code: string
  name: string
  type: VoucherType
  value: number
  min_order: number
  usage_limit: number | null
  used_count: number
  starts_at: string | null
  expires_at: string | null
  is_active: boolean
}

export interface AdminSettings {
  handling_fee: number
}

export interface Banner {
  id: number
  title: string | null
  subtitle: string | null
  image: string | null
  link: string | null
  sort_order: number
  is_active: boolean
}

export interface Review {
  id: number
  rating: number
  comment: string | null
  user: { name: string }
  created_at: string | null
}

export interface Conversation {
  id: number
  subject: string | null
  last_message_at: string | null
  unread?: number
  user?: string
}

export interface ChatMessage {
  id: number
  sender: 'user' | 'admin'
  content: string
  created_at: string | null
}
