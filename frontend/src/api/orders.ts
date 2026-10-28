import api from './client'
import type { Order } from '../lib/types'

export interface OrderListResponse {
  data: Order[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export async function fetchOrders(page = 1): Promise<OrderListResponse> {
  const { data } = await api.get<OrderListResponse>('/orders', { params: { page } })
  return data
}

export async function fetchOrder(code: string): Promise<Order> {
  const { data } = await api.get<{ data: Order }>(`/orders/${code}`)
  return data.data
}

export async function cancelOrder(code: string): Promise<Order> {
  const { data } = await api.post<{ data: Order }>(`/orders/${code}/cancel`)
  return data.data
}

export async function createOrderPayment(
  code: string,
): Promise<{ order: Order; redirectUrl: string | null }> {
  const { data } = await api.post<{ data: Order; redirect_url: string | null }>(
    `/orders/${code}/payment`,
  )
  return {
    order: data.data,
    redirectUrl: data.redirect_url ?? data.data.payment?.redirect_url ?? null,
  }
}

export async function syncOrderPayment(code: string): Promise<Order> {
  const { data } = await api.post<{ data: Order }>(`/orders/${code}/payment/sync`)
  return data.data
}
