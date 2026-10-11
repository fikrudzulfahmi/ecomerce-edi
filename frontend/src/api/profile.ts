import api from './client'
import type { User } from '../lib/types'

export interface UpdateProfileInput {
  name: string
  phone?: string | null
}

export async function updateProfile(input: UpdateProfileInput): Promise<User> {
  const { data } = await api.put<{ data: User }>('/profile', input)
  return data.data
}

export interface ChangePasswordInput {
  current_password?: string
  new_password: string
  new_password_confirmation: string
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await api.post('/profile/password', input)
}
