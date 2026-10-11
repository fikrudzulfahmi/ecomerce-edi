import api from './client'
import type { AuthResponse, User } from '../lib/types'

export interface RegisterInput {
  name: string
  email: string
  phone?: string
  password: string
  password_confirmation: string
}

export interface ResetPasswordInput {
  token: string
  email: string
  password: string
  password_confirmation: string
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/login', { email, password })
  return data
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/register', input)
  return data
}

export async function logout(): Promise<void> {
  await api.post('/logout')
}

export async function me(): Promise<User> {
  const { data } = await api.get<{ data: User }>('/me')
  return data.data
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/forgot-password', { email })
}

export async function resetPassword(input: ResetPasswordInput): Promise<void> {
  await api.post('/reset-password', input)
}

export async function resendVerification(): Promise<void> {
  await api.post('/email/verification-notification')
}

export interface PhoneOtpResponse {
  message: string
  otp?: string
}

export async function requestPhoneOtp(phone: string): Promise<PhoneOtpResponse> {
  const { data } = await api.post<PhoneOtpResponse>('/auth/phone/request', { phone })
  return data
}

export async function verifyPhoneOtp(phone: string, code: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/phone/verify', { phone, code })
  return data
}

export function googleAuthUrl(): string {
  return '/api/v1/auth/google/redirect'
}
