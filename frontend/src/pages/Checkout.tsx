import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Truck, Wallet } from 'lucide-react'
import { useAddresses, useCart, useCheckout, useShippingOptions } from '../api/hooks'
import { formatRupiah } from '../lib/format'
import { extractErrorMessage } from '../lib/errors'
import { useAuthStore } from '../store/auth'
import type { PaymentMethodType } from '../lib/types'
import { Container } from '../components/layout/Container'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { Skeleton } from '../components/ui/Skeleton'

export function Checkout() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const { data: cart, isLoading: loadingCart } = useCart()
  const { data: addresses, isLoading: loadingAddresses } = useAddresses()
  const { data: shippingOptions, isLoading: loadingShipping } = useShippingOptions(
    !!cart && cart.items.length > 0,
  )

  const checkoutMutation = useCheckout()

  const [addressId, setAddressId] = useState<number | null>(null)
  const [shipping, setShipping] = useState<string | null>(null)
  const [method, setMethod] = useState<PaymentMethodType>('gdc')
  const [error, setError] = useState<string | null>(null)

  const selectedAddress =
    addresses?.find((a) => a.id === addressId) ??
    addresses?.find((a) => a.is_default) ??
    addresses?.[0] ??
    null

  if (loadingCart || loadingAddresses) {
    return (
      <Container className="py-10">
        <Skeleton className="h-64" />
      </Container>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Container className="py-16 text-center">
        <h1 className="text-2xl font-bold">Keranjang kosong</h1>
        <Link to="/products" className="mt-4 inline-block font-semibold text-navy hover:underline">
          Lihat katalog
        </Link>
      </Container>
    )
  }

  const notVerified = !!user && !user.email_verified_at
  const selectedShipping =
    shippingOptions?.find((o) => `${o.courier}-${o.service}` === shipping) ?? null
  const total = cart.subtotal + (selectedShipping?.cost ?? 0)

  const handleSubmit = async () => {
    setError(null)
    if (!selectedAddress) {
      setError('Pilih alamat pengiriman.')
      return
    }
    if (!selectedShipping) {
      setError('Pilih kurir pengiriman.')
      return
    }

    try {
      const order = await checkoutMutation.mutateAsync({
        address_id: selectedAddress.id,
        payment_method: method,
        courier: selectedShipping.courier,
        service: selectedShipping.service,
      })
      if (method === 'gdc') {
        navigate(`/payment/${order.code}`, { replace: true })
      } else {
        navigate(`/orders/${order.code}`, { replace: true })
      }
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold">Checkout</h1>

      {notVerified && (
        <div className="mt-4">
          <Alert variant="error">
            Email Anda belum terverifikasi.{' '}
            <Link to="/verify-email?status=sent" className="font-semibold underline">
              Verifikasi sekarang
            </Link>{' '}
            untuk melanjutkan checkout.
          </Alert>
        </div>
      )}

      {error && (
        <div className="mt-4">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <section className="rounded-lg border border-cream-darker bg-white p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <MapPin className="h-5 w-5 text-navy" /> Alamat Pengiriman
            </h2>
            {addresses && addresses.length > 0 ? (
              <div className="mt-4 space-y-2">
                {addresses.map((a) => (
                  <label
                    key={a.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                      addressId === a.id ? 'border-navy bg-navy/5' : 'border-cream-darker'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={selectedAddress?.id === a.id}
                      onChange={() => setAddressId(a.id)}
                      className="mt-1 h-4 w-4 text-navy"
                    />
                    <span className="text-sm">
                      <span className="font-semibold">
                        {a.recipient} <span className="font-normal text-ink-muted">· {a.phone}</span>
                        {a.is_default && (
                          <span className="ml-2 rounded bg-cream-dark px-1.5 py-0.5 text-xs">Utama</span>
                        )}
                      </span>
                      <span className="block text-ink-muted">
                        {a.detail}, {a.district}, {a.city}, {a.province} {a.postal_code}
                      </span>
                    </span>
                  </label>
                ))}
                <Link to="/addresses" className="inline-block text-sm font-semibold text-navy hover:underline">
                  + Kelola alamat
                </Link>
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink-muted">
                Belum ada alamat.{' '}
                <Link to="/addresses" className="font-semibold text-navy hover:underline">
                  Tambahkan alamat
                </Link>
                .
              </p>
            )}
          </section>

          <section className="rounded-lg border border-cream-darker bg-white p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Truck className="h-5 w-5 text-navy" /> Kurir Pengiriman
            </h2>
            {loadingShipping ? (
              <Skeleton className="mt-4 h-16" />
            ) : (
              <div className="mt-4 space-y-2">
                {shippingOptions?.map((o) => {
                  const key = `${o.courier}-${o.service}`
                  return (
                    <label
                      key={key}
                      className={`flex cursor-pointer items-center justify-between rounded-md border p-3 ${
                        shipping === key ? 'border-navy bg-navy/5' : 'border-cream-darker'
                      }`}
                    >
                      <span className="flex items-center gap-3 text-sm">
                        <input
                          type="radio"
                          name="shipping"
                          checked={shipping === key}
                          onChange={() => setShipping(key)}
                          className="h-4 w-4 text-navy"
                        />
                        <span className="font-semibold">{o.courier}</span>
                        <span className="text-ink-muted">{o.service}</span>
                      </span>
                      <span className="text-sm font-semibold">{formatRupiah(o.cost)}</span>
                    </label>
                  )
                })}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-cream-darker bg-white p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <Wallet className="h-5 w-5 text-navy" /> Metode Pembayaran
            </h2>
            <div className="mt-4 space-y-2">
              <label
                className={`flex cursor-pointer items-center justify-between rounded-md border p-3 ${
                  method === 'gdc' ? 'border-navy bg-navy/5' : 'border-cream-darker'
                }`}
              >
                <span className="flex items-center gap-3 text-sm">
                  <input
                    type="radio"
                    name="method"
                    checked={method === 'gdc'}
                    onChange={() => setMethod('gdc')}
                    className="h-4 w-4 text-navy"
                  />
                  <span className="font-semibold">GDC Payment</span>
                  <span className="text-ink-muted">Transfer / online</span>
                </span>
              </label>
              <label
                className={`flex cursor-pointer items-center justify-between rounded-md border p-3 ${
                  method === 'cod' ? 'border-navy bg-navy/5' : 'border-cream-darker'
                }`}
              >
                <span className="flex items-center gap-3 text-sm">
                  <input
                    type="radio"
                    name="method"
                    checked={method === 'cod'}
                    onChange={() => setMethod('cod')}
                    className="h-4 w-4 text-navy"
                  />
                  <span className="font-semibold">COD</span>
                  <span className="text-ink-muted">Bayar di tempat</span>
                </span>
              </label>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-lg border border-cream-darker bg-white p-5">
          <h2 className="text-lg font-bold">Ringkasan Pesanan</h2>
          <div className="mt-4 space-y-2 text-sm">
            {cart.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3">
                <span className="text-ink-muted">
                  {item.product.name} × {item.qty}
                </span>
                <span>{formatRupiah(item.subtotal)}</span>
              </div>
            ))}
            <div className="flex justify-between border-t pt-2">
              <span className="text-ink-muted">Subtotal</span>
              <span>{formatRupiah(cart.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Ongkir</span>
              <span>{selectedShipping ? formatRupiah(selectedShipping.cost) : '—'}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Total</span>
              <span className="text-orange-dark">{formatRupiah(total)}</span>
            </div>
          </div>
          <Button
            className="mt-4 w-full"
            onClick={handleSubmit}
            loading={checkoutMutation.isPending}
            disabled={notVerified}
          >
            {method === 'gdc' ? 'Buat Pesanan & Bayar' : 'Buat Pesanan (COD)'}
          </Button>
        </aside>
      </div>
    </Container>
  )
}
