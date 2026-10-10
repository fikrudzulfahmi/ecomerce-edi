import api from './client'
import type { Address } from '../lib/types'

export interface AddressInput {
  recipient: string
  phone: string
  province: string
  city: string
  district: string
  postal_code: string
  detail: string
  is_default?: boolean
}

export async function fetchAddresses(): Promise<Address[]> {
  const { data } = await api.get<{ data: Address[] }>('/addresses')
  return data.data
}

export async function createAddress(input: AddressInput): Promise<Address> {
  const { data } = await api.post<{ data: Address }>('/addresses', input)
  return data.data
}

export async function updateAddress(id: number, input: Partial<AddressInput>): Promise<Address> {
  const { data } = await api.patch<{ data: Address }>(`/addresses/${id}`, input)
  return data.data
}

export async function deleteAddress(id: number): Promise<void> {
  await api.delete(`/addresses/${id}`)
}
