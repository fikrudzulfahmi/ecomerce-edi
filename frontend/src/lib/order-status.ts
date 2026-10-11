import type { OrderStatus } from './types'

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'Menunggu Pembayaran',
  PAID: 'Dibayar',
  PROCESSING: 'Diproses',
  SHIPPED: 'Dikirim',
  DELIVERED: 'Terkirim',
  CANCELLED: 'Dibatalkan',
  EXPIRED: 'Kedaluwarsa',
  COD_PENDING: 'COD (Menunggu)',
  COD_COMPLETED: 'COD (Lunas)',
  COD_RETURNED: 'COD (Dikembalikan)',
}

const STATUS_TONE: Record<OrderStatus, string> = {
  PENDING_PAYMENT: 'bg-orange/10 text-orange-dark',
  PAID: 'bg-green-100 text-green-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-blue-100 text-blue-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-gray-100 text-gray-600',
  COD_PENDING: 'bg-orange/10 text-orange-dark',
  COD_COMPLETED: 'bg-green-100 text-green-800',
  COD_RETURNED: 'bg-red-100 text-red-700',
}

export function orderStatusLabel(status: OrderStatus): string {
  return ORDER_STATUS_LABEL[status] ?? status
}

export function orderStatusTone(status: OrderStatus): string {
  return STATUS_TONE[status] ?? 'bg-gray-100 text-gray-600'
}

export function isCancellable(status: OrderStatus): boolean {
  return status === 'PENDING_PAYMENT' || status === 'COD_PENDING'
}
