import { Link, useParams } from 'react-router-dom'
import { MapPin, Truck } from 'lucide-react'
import { useCancelOrder, useOrder } from '../api/hooks'
import { formatRupiah } from '../lib/format'
import { isCancellable, orderStatusLabel, orderStatusTone } from '../lib/order-status'
import { Container } from '../components/layout/Container'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { Skeleton } from '../components/ui/Skeleton'

export function OrderDetail() {
  const { code = '' } = useParams()
  const { data: order, isLoading } = useOrder(code)
  const cancel = useCancelOrder()

  if (isLoading) {
    return (
      <Container className="py-10">
        <Skeleton className="h-64" />
      </Container>
    )
  }

  if (!order) {
    return (
      <Container className="py-16 text-center">
        <h1 className="text-2xl font-bold">Pesanan tidak ditemukan</h1>
      </Container>
    )
  }

  return (
    <Container className="py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Pesanan {order.code}</h1>
          <p className="text-sm text-ink-muted">
            {new Date(order.created_at).toLocaleString('id-ID')}
          </p>
        </div>
        <span className={`rounded px-3 py-1 text-sm font-medium ${orderStatusTone(order.status)}`}>
          {orderStatusLabel(order.status)}
        </span>
      </div>

      {cancel.isError && (
        <div className="mt-4">
          <Alert variant="error">Gagal membatalkan pesanan.</Alert>
        </div>
      )}

      {order.status === 'PENDING_PAYMENT' && (
        <div className="mt-4">
          <Alert variant="info">
            Pesanan menunggu pembayaran.{' '}
            <Link to={`/payment/${order.code}`} className="font-semibold underline">
              Bayar sekarang
            </Link>
            .
          </Alert>
        </div>
      )}

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <section className="rounded-lg border border-cream-darker bg-white p-5">
            <h2 className="text-lg font-bold">Item Pesanan</h2>
            <div className="mt-4 space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    {item.product?.images[0] && (
                      <img
                        src={item.product.images[0]}
                        alt={item.name}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium text-navy">{item.name}</p>
                      <p className="text-xs text-ink-muted">
                        {formatRupiah(item.price)} × {item.qty}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold">{formatRupiah(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-cream-darker bg-white p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold">
              <MapPin className="h-5 w-5 text-navy" /> Alamat Pengiriman
            </h2>
            <div className="mt-2 text-sm">
              <p className="font-semibold">
                {order.address.recipient} · {order.address.phone}
              </p>
              <p className="text-ink-muted">
                {order.address.detail}, {order.address.district}, {order.address.city},{' '}
                {order.address.province} {order.address.postal_code}
              </p>
            </div>
          </section>

          {order.shipment && (
            <section className="rounded-lg border border-cream-darker bg-white p-5">
              <h2 className="flex items-center gap-2 text-lg font-bold">
                <Truck className="h-5 w-5 text-navy" /> Pengiriman
              </h2>
              <p className="mt-2 text-sm text-ink-muted">
                {order.shipment.courier} {order.shipment.service}
                {order.shipment.awb && (
                  <>
                    {' '}
                    · Resi: <span className="font-mono">{order.shipment.awb}</span>
                  </>
                )}
              </p>
              {order.shipment.cod_amount > 0 && (
                <p className="mt-1 text-sm text-ink-muted">
                  COD: {formatRupiah(order.shipment.cod_amount)}
                </p>
              )}
            </section>
          )}
        </div>

        <aside className="h-fit rounded-lg border border-cream-darker bg-white p-5">
          <h2 className="text-lg font-bold">Ringkasan</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">Subtotal</span>
              <span>{formatRupiah(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-muted">Ongkir</span>
              <span>{formatRupiah(order.shipping_cost)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Total</span>
              <span className="text-orange-dark">{formatRupiah(order.total)}</span>
            </div>
          </div>

          {isCancellable(order.status) && (
            <Button
              variant="danger"
              className="mt-4 w-full"
              onClick={() => cancel.mutate(order.code)}
              loading={cancel.isPending}
            >
              Batalkan Pesanan
            </Button>
          )}
        </aside>
      </div>
    </Container>
  )
}
