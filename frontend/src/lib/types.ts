export type Role = 'customer' | 'admin'

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  role: Role
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
