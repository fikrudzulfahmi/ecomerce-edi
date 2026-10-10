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

export type ProductType = 'book' | 'other'

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
