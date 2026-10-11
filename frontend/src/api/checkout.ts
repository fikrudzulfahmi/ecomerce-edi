import api from './client'
import type { Order, PaymentMethodType, ShippingOption } from '../lib/types'

export async function fetchShippingOptions(addressId: number): Promise<ShippingOption[]> {
  const { data } = await api.post<{ data: ShippingOption[] }>('/checkout/shipping-options', {
    address_id: addressId,
  })
  return data.data
}

export async function fetchCheckoutMeta(): Promise<{ handling_fee: number }> {
  const { data } = await api.get<{ data: { handling_fee: number } }>('/checkout/meta')
  return data.data
}

export interface VoucherPreview {
  discount_amount: number
  voucher: { code: string; name: string; type: string }
}

export async function previewVoucher(code: string, shippingCost: number): Promise<VoucherPreview> {
  const { data } = await api.post<{ data: VoucherPreview }>('/checkout/voucher', {
    voucher_code: code,
    shipping_cost: shippingCost,
  })
  return data.data
}

export interface CheckoutInput {
  address_id?: number
  payment_method: PaymentMethodType
  courier?: string
  service?: string
  voucher_code?: string
}

export async function checkout(input: CheckoutInput): Promise<Order> {
  const { data } = await api.post<{ data: Order }>('/checkout', input)
  return data.data
}
