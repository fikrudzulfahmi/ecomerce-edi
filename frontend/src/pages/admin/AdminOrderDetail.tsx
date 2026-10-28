import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CreditCard, MapPin, Truck } from 'lucide-react'
import {
  changeOrderStatus,
  confirmOrderPayment,
  createOrderShipment,
  fetchAdminOrder,
} from '../../api/admin'
import { formatRupiah } from '../../lib/format'
import { orderStatusLabel, orderStatusTone } from '../../lib/order-status'
import type { OrderStatus } from '../../lib/types'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { Skeleton } from '../../components/ui/Skeleton'

const STATUS_OPTIONS: OrderStatus[] = [
  'PENDING_PAYMENT',
  'PAID',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'COD_PENDING',
  'COD_COMPLETED',
  'COD_RETURNED',
]

export function AdminOrderDetail() {
  const { code = '' } = useParams()
  const queryClient = useQueryClient()
  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order', code],
    queryFn: () => fetchAdminOrder(code),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-order', code] })
  const confirm = useMutation({ mutationFn: () => confirmOrderPayment(code), onSuccess: invalidate })
  const ship = useMutation({ mutationFn: () => createOrderShipment(code), onSuccess: invalidate })
  const statusChange = useMutation({
    mutationFn: (status: OrderStatus) => changeOrderStatus(code, status),
    onSuccess: invalidate,
  })

  if (isLoading) {
    return <Skeleton className="h-64" />
  }
  if (!order) {
    return <p className="text-ink-muted">Pesanan tidak ditemukan.</p>
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Pesanan {order.code}</h1>
          <p className="text-sm text-ink-muted">
            {new Date(order.created_at).toLocaleString('id-ID')} · {order.payment_method.toUpperCase()}
          </p>
        </div>
        <span className={`rounded px-3 py-1 text-sm font-medium ${orderStatusTone(order.status)}`}>
          {orderStatusLabel(order.status)}
        </span>
      </div>

      {(confirm.isError || ship.isError || statusChange.isError) && (
        <div className="mt-4">
          <Alert variant="error">Gagal memproses aksi.</Alert>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {order.status === 'PENDING_PAYMENT' && (
          <Button onClick={() => confirm.mutate()} loading={confirm.isPending}>
            <CreditCard className="h-4 w-4" /> Konfirmasi Pembayaran
          </Button>
        )}
        {order.status === 'PAID' && !order.shipment?.awb && (
          <Button onClick={() => ship.mutate()} loading={ship.isPending}>
            <Truck className="h-4 w-4" /> Buat Resi (Mengantar)
          </Button>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm text-ink-muted">Ubah status:</span>
          <select
            defaultValue=""
            onChange={(e) => e.target.value && statusChange.mutate(e.target.value as OrderStatus)}
            className="rounded-md border border-cream-darker bg-white px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Pilih status…
            </option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {orderStatusLabel(s)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
          <section className="rounded-lg border border-cream-darker bg-white p-5">
            <h2 className="font-bold text-navy">Item</h2>
            <div className="mt-3 space-y-2 text-sm">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-ink-muted">
                    {item.name} × {item.qty}
                  </span>
                  <span className="font-medium">{formatRupiah(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-cream-darker bg-white p-5">
            <h2 className="flex items-center gap-2 font-bold text-navy">
              <CreditCard className="h-4 w-4" /> Pembayaran
            </h2>
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Metode</dt>
                <dd>{order.payment_method === 'cod' ? 'COD' : 'Online (iPaymu)'}</dd>
              </div>
              {order.payment && (
                <>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Provider</dt>
                    <dd className="uppercase">{order.payment.provider}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Status</dt>
                    <dd>{order.payment.status}</dd>
                  </div>
                  {order.payment.channel && (
                    <div className="flex justify-between">
                      <dt className="text-ink-muted">Channel</dt>
                      <dd>
                        {[order.payment.via, order.payment.channel].filter(Boolean).join(' · ')}
                      </dd>
                    </div>
                  )}
                  {order.payment.payment_no && (
                    <div className="flex justify-between">
                      <dt className="text-ink-muted">No. Pembayaran</dt>
                      <dd className="font-mono">{order.payment.payment_no}</dd>
                    </div>
                  )}
                  {order.payment.trx_id && (
                    <div className="flex justify-between">
                      <dt className="text-ink-muted">Trx iPaymu</dt>
                      <dd className="font-mono">{order.payment.trx_id}</dd>
                    </div>
                  )}
                  {order.payment.paid_at && (
                    <div className="flex justify-between">
                      <dt className="text-ink-muted">Dibayar</dt>
                      <dd>{new Date(order.payment.paid_at).toLocaleString('id-ID')}</dd>
                    </div>
                  )}
                </>
              )}
            </dl>
          </section>

          <section className="rounded-lg border border-cream-darker bg-white p-5">
            <h2 className="flex items-center gap-2 font-bold text-navy">
              <MapPin className="h-4 w-4" /> Alamat
            </h2>
            <p className="mt-2 text-sm">
              <span className="font-medium">{order.address.recipient}</span> · {order.address.phone}
            </p>
            <p className="text-sm text-ink-muted">
              {order.address.detail}, {order.address.district}, {order.address.city}, {order.address.province}{' '}
              {order.address.postal_code}
            </p>
          </section>

          {order.shipment && (
            <section className="rounded-lg border border-cream-darker bg-white p-5">
              <h2 className="flex items-center gap-2 font-bold text-navy">
                <Truck className="h-4 w-4" /> Pengiriman
              </h2>
              <p className="mt-2 text-sm text-ink-muted">
                {order.shipment.courier} {order.shipment.service}
                {order.shipment.awb && (
                  <>
                    {' '}
                    · Resi: <span className="font-mono font-medium text-navy">{order.shipment.awb}</span>
                  </>
                )}
              </p>
              {order.shipment.cod_amount > 0 && (
                <p className="text-sm text-ink-muted">COD: {formatRupiah(order.shipment.cod_amount)}</p>
              )}
            </section>
          )}
        </div>

        <aside className="h-fit rounded-lg border border-cream-darker bg-white p-5">
          <h2 className="font-bold text-navy">Ringkasan</h2>
          <div className="mt-3 space-y-2 text-sm">
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
        </aside>
      </div>
    </div>
  )
}
