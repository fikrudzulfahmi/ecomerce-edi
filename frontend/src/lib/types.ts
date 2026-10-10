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
