import api from './client'
import type { Cart } from '../lib/types'

export async function fetchCart(): Promise<Cart> {
  const { data } = await api.get<{ data: Cart }>('/cart')
  return data.data
}

export async function addCartItem(productId: number, qty: number): Promise<Cart> {
  const { data } = await api.post<{ data: Cart }>('/cart/items', { product_id: productId, qty })
  return data.data
}

export async function updateCartItem(itemId: number, qty: number): Promise<Cart> {
  const { data } = await api.patch<{ data: Cart }>(`/cart/items/${itemId}`, { qty })
  return data.data
}

export async function removeCartItem(itemId: number): Promise<Cart> {
  const { data } = await api.delete<{ data: Cart }>(`/cart/items/${itemId}`)
  return data.data
}
