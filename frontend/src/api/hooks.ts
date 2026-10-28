import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchCategories, fetchProduct, fetchProducts, type ProductQuery } from './catalog'
import { addCartItem, fetchCart, removeCartItem, updateCartItem } from './cart'
import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  updateAddress,
  type AddressInput,
} from './address'
import { checkout, fetchShippingOptions, type CheckoutInput } from './checkout'
import {
  cancelOrder,
  createOrderPayment,
  fetchOrder,
  fetchOrders,
  syncOrderPayment,
} from './orders'
import { fetchLibrary } from './library'
import { useAuthStore } from '../store/auth'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
  })
}

export function useProducts(query: ProductQuery) {
  return useQuery({
    queryKey: ['products', query],
    queryFn: () => fetchProducts(query),
    placeholderData: (previousData) => previousData,
  })
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProduct(slug),
  })
}

export function useCart() {
  const token = useAuthStore((s) => s.token)
  return useQuery({
    queryKey: ['cart'],
    queryFn: fetchCart,
    enabled: !!token,
  })
}

export function useAddCartItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, qty }: { productId: number; qty: number }) =>
      addCartItem(productId, qty),
    onSuccess: (cart) => queryClient.setQueryData(['cart'], cart),
  })
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, qty }: { itemId: number; qty: number }) => updateCartItem(itemId, qty),
    onSuccess: (cart) => queryClient.setQueryData(['cart'], cart),
  })
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (itemId: number) => removeCartItem(itemId),
    onSuccess: (cart) => queryClient.setQueryData(['cart'], cart),
  })
}

export function useAddresses() {
  return useQuery({
    queryKey: ['addresses'],
    queryFn: fetchAddresses,
  })
}

export function useCreateAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AddressInput) => createAddress(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  })
}

export function useUpdateAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<AddressInput> }) =>
      updateAddress(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  })
}

export function useDeleteAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => deleteAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
  })
}

export function useShippingOptions(addressId: number | null) {
  return useQuery({
    queryKey: ['shipping-options', addressId],
    queryFn: () => fetchShippingOptions(addressId as number),
    enabled: addressId !== null,
  })
}

export function useCheckout() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CheckoutInput) => checkout(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useOrders(page = 1) {
  return useQuery({
    queryKey: ['orders', page],
    queryFn: () => fetchOrders(page),
  })
}

export function useOrder(code: string) {
  return useQuery({
    queryKey: ['order', code],
    queryFn: () => fetchOrder(code),
    enabled: !!code,
    // Polling ringan selama menunggu pembayaran (callback iPaymu asinkron).
    refetchInterval: (query) =>
      query.state.data?.status === 'PENDING_PAYMENT' ? 10_000 : false,
  })
}

export function useCancelOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => cancelOrder(code),
    onSuccess: (order, code) => {
      queryClient.setQueryData(['order', code], order)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useCreatePayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => createOrderPayment(code),
    onSuccess: ({ order, redirectUrl }, code) => {
      queryClient.setQueryData(['order', code], order)
      if (!redirectUrl) return
      // Arahkan ke halaman pembayaran iPaymu.
      if (!redirectUrl.startsWith(window.location.origin)) {
        window.location.assign(redirectUrl)
      }
    },
  })
}

export function useSyncPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (code: string) => syncOrderPayment(code),
    onSuccess: (order, code) => {
      queryClient.setQueryData(['order', code], order)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useLibrary() {
  return useQuery({
    queryKey: ['library'],
    queryFn: fetchLibrary,
  })
}
