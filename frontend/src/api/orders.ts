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

export async function mockPayOrder(code: string): Promise<Order> {
  const { data } = await api.post<{ data: Order }>(`/orders/${code}/mock-pay`)
  return data.data
}

export async function mockFailOrder(code: string): Promise<Order> {
  const { data } = await api.post<{ data: Order }>(`/orders/${code}/mock-fail`)
  return data.data
}
