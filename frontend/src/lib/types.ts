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
