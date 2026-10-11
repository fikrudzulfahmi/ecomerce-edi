import api from './client'
import type { Order, PaymentMethodType, ShippingOption } from '../lib/types'

export async function fetchShippingOptions(addressId: number): Promise<ShippingOption[]> {
  const { data } = await api.post<{ data: ShippingOption[] }>('/checkout/shipping-options', {
    address_id: addressId,
  })
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
