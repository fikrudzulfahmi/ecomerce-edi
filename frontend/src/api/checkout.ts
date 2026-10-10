import api from './client'
import type { Order, PaymentMethodType, ShippingOption } from '../lib/types'

export async function fetchShippingOptions(): Promise<ShippingOption[]> {
  const { data } = await api.post<{ data: ShippingOption[] }>('/checkout/shipping-options')
  return data.data
}

export interface CheckoutInput {
  address_id: number
  payment_method: PaymentMethodType
  courier: string
  service: string
}

export async function checkout(input: CheckoutInput): Promise<Order> {
  const { data } = await api.post<{ data: Order }>('/checkout', input)
  return data.data
}
