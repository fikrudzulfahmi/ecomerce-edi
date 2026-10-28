import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Download, MapPin, Star, Truck } from 'lucide-react'
import { useCancelOrder, useOrder } from '../api/hooks'
import { getDownloadUrl } from '../api/library'
import { createReview } from '../api/reviews'
import { formatRupiah } from '../lib/format'
import { extractErrorMessage } from '../lib/errors'
import { isCancellable, orderStatusLabel, orderStatusTone } from '../lib/order-status'
import { Container } from '../components/layout/Container'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { Skeleton } from '../components/ui/Skeleton'

export function OrderDetail() {
  const { code = '' } = useParams()
  const { data: order, isLoading } = useOrder(code)
  const cancel = useCancelOrder()
  const [downloading, setDownloading] = useState<number | null>(null)
  const [reviewing, setReviewing] = useState<{ id: number; name: string } | null>(null)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewBusy, setReviewBusy] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const handleDownload = async (itemId: number) => {
    setDownloading(itemId)
    try {
      const url = await getDownloadUrl(itemId)
      window.open(url, '_blank')
    } finally {
      setDownloading(null)
    }
  }

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

  const canDownload =
    order.payment_method === 'cod'
      ? order.status === 'COD_COMPLETED'
      : ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status)

  const canReview = order.status === 'DELIVERED' || order.status === 'COD_COMPLETED'

  const submitReview = async () => {
    if (!reviewing) return
    setReviewBusy(true)
    setReviewError(null)
    try {
      await createReview({
        order_id: order.id,
        product_id: reviewing.id,
        rating,
        comment: comment.trim() || undefined,
      })
      setReviewing(null)
      setComment('')
      setRating(5)
    } catch (err) {
      setReviewError(extractErrorMessage(err))
    } finally {
      setReviewBusy(false)
    }
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
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatRupiah(item.subtotal)}</span>
                    {item.product?.digital_file && canDownload && (
                      <button
                        onClick={() => handleDownload(item.id)}
                        disabled={downloading === item.id}
                        className="flex items-center gap-1.5 rounded-md bg-navy px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-dark disabled:opacity-50"
                      >
                        <Download className="h-3.5 w-3.5" /> Unduh
                      </button>
                    )}
                    {canReview && item.product && (
                      <button
                        onClick={() => setReviewing({ id: item.product!.id, name: item.name })}
                        className="flex items-center gap-1.5 rounded-md border border-navy px-2.5 py-1.5 text-xs font-semibold text-navy transition hover:bg-navy hover:text-white"
                      >
                        <Star className="h-3.5 w-3.5" /> Ulas
                      </button>
                    )}
                  </div>
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
            <div className="flex justify-between text-ink-muted">
              <span>Pembayaran</span>
              <span>
                {order.payment_method === 'cod' ? 'COD' : 'Online (iPaymu)'}
              </span>
            </div>
          </div>

          {order.status === 'PENDING_PAYMENT' && (
            <Link
              to={`/payment/${order.code}`}
              className="mt-4 block w-full rounded-md bg-orange px-4 py-2.5 text-center font-semibold text-navy-dark transition hover:bg-orange-dark"
            >
              Lanjutkan Pembayaran
            </Link>
          )}

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

      {reviewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-glow">
            <h3 className="text-lg font-bold">Beri Ulasan</h3>
            <p className="mt-1 text-sm text-ink-muted">{reviewing.name}</p>
            <div className="mt-4 flex gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <button key={i} onClick={() => setRating(i)} aria-label={`${i} bintang`}>
                  <Star
                    className={`h-7 w-7 transition ${
                      i <= rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tulis ulasanmu (opsional)"
              rows={3}
              className="mt-4 w-full rounded-lg border border-cream-darker px-3 py-2 text-sm focus:border-navy focus:outline-none"
            />
            {reviewError && <p className="mt-2 text-sm text-red-600">{reviewError}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setReviewing(null)}
                className="rounded-lg px-4 py-2 text-sm text-ink-muted transition hover:bg-cream-dark"
              >
                Batal
              </button>
              <Button onClick={submitReview} loading={reviewBusy}>
                Kirim
              </Button>
            </div>
          </div>
        </div>
      )}
    </Container>
  )
}
