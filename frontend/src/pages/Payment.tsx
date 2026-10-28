import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Clock, ExternalLink, RefreshCw, XCircle } from 'lucide-react'
import { useCreatePayment, useOrder, useSyncPayment } from '../api/hooks'
import { formatRupiah } from '../lib/format'
import { Container } from '../components/layout/Container'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { Skeleton } from '../components/ui/Skeleton'

const PAID_STATUSES = ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED']

export function Payment() {
  const { code = '' } = useParams()
  const { data: order, isLoading } = useOrder(code)
  const createPayment = useCreatePayment()
  const syncPayment = useSyncPayment()
  const autoCreated = useRef(false)
  const [syncNote, setSyncNote] = useState<string | null>(null)

  const pending = order?.status === 'PENDING_PAYMENT'
  const redirectUrl = order?.payment?.redirect_url ?? null

  // Order lama / sesi gagal dibuat: minta sesi pembayaran baru sekali.
  useEffect(() => {
    if (!pending || redirectUrl || autoCreated.current) return
    autoCreated.current = true
    createPayment.mutate(code)
  }, [pending, redirectUrl, code, createPayment])

  const expiresAt = useMemo(() => {
    if (!order?.expires_at) return null
    return new Date(order.expires_at).toLocaleString('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }, [order?.expires_at])

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

  if (PAID_STATUSES.includes(order.status)) {
    return (
      <Container className="py-16 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-green-600" />
        <h1 className="mt-4 text-2xl font-bold">Pembayaran Berhasil</h1>
        <p className="mt-2 text-ink-muted">Terima kasih, pesanan {order.code} sudah dibayar.</p>
        <Link
          to={`/orders/${order.code}`}
          className="mt-6 inline-block rounded-md bg-orange px-6 py-3 font-semibold text-navy-dark transition hover:bg-orange-dark"
        >
          Lihat Pesanan
        </Link>
      </Container>
    )
  }

  if (order.status === 'CANCELLED' || order.status === 'EXPIRED') {
    return (
      <Container className="py-16 text-center">
        <XCircle className="mx-auto h-14 w-14 text-red-500" />
        <h1 className="mt-4 text-2xl font-bold">
          Pembayaran {order.status === 'EXPIRED' ? 'Kedaluwarsa' : 'Dibatalkan'}
        </h1>
        <p className="mt-2 text-ink-muted">Pesanan {order.code} tidak dapat diproses.</p>
        <Link to="/orders" className="mt-6 inline-block font-semibold text-navy hover:underline">
          Kembali ke Pesanan
        </Link>
      </Container>
    )
  }

  if (order.status === 'COD_PENDING') {
    return (
      <Container className="py-16 text-center">
        <h1 className="text-2xl font-bold">Pesanan COD</h1>
        <p className="mt-2 text-ink-muted">
          Pesanan {order.code} dibayar di tempat saat barang diterima.
        </p>
        <Link
          to={`/orders/${order.code}`}
          className="mt-6 inline-block font-semibold text-navy hover:underline"
        >
          Lihat Pesanan
        </Link>
      </Container>
    )
  }

  const channel = order.payment?.channel || order.payment?.via
    ? [order.payment?.via, order.payment?.channel].filter(Boolean).join(' · ')
    : null

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-md">
        <div className="rounded-xl border border-cream-darker bg-white p-6">
          <h1 className="text-xl font-bold">Pembayaran</h1>
          <p className="mt-1 text-sm text-ink-muted">Pesanan {order.code} menunggu pembayaran.</p>

          <div className="mt-4 rounded-lg bg-cream-dark p-4 text-center">
            <p className="text-sm text-ink-muted">Total pembayaran</p>
            <p className="text-3xl font-bold text-orange-dark">{formatRupiah(order.total)}</p>
            {channel && <p className="mt-1 text-xs text-ink-muted">{channel}</p>}
          </div>

          {expiresAt && (
            <p className="mt-3 flex items-center justify-center gap-1 text-xs text-ink-muted">
              <Clock className="h-3.5 w-3.5" /> Selesaikan sebelum {expiresAt}
            </p>
          )}

          {(createPayment.isError || syncPayment.isError) && (
            <div className="mt-3">
              <Alert variant="error">
                Gagal menghubungi layanan pembayaran. Silakan coba lagi.
              </Alert>
            </div>
          )}

          <div className="mt-5 space-y-2">
            {redirectUrl ? (
              <Button className="w-full" onClick={() => window.location.assign(redirectUrl)}>
                <ExternalLink className="h-4 w-4" /> Lanjutkan ke Pembayaran
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => createPayment.mutate(code)}
                loading={createPayment.isPending}
              >
                <ExternalLink className="h-4 w-4" /> Buat Pembayaran
              </Button>
            )}

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => syncPayment.mutate(code, { onSuccess: (fresh) => setSyncNote(fresh.status) })}
              loading={syncPayment.isPending}
            >
              <RefreshCw className="h-4 w-4" /> Cek Status Pembayaran
            </Button>
            {syncNote === 'PENDING_PAYMENT' && (
              <Alert variant="info">
                Belum ada pembayaran yang masuk untuk pesanan ini. Kalau Anda baru membayar,
                tunggu 1–2 menit lalu cek lagi.
              </Alert>
            )}
            <Link
              to={`/orders/${order.code}`}
              className="block w-full pt-1 text-center text-sm font-semibold text-navy hover:underline"
            >
              Kembali ke Pesanan
            </Link>
          </div>

          <p className="mt-4 text-center text-xs text-ink-muted">
            Pembayaran diproses oleh iPaymu (Virtual Account, QRIS, atau e-Wallet). Status
            pesanan diperbarui otomatis setelah pembayaran dikonfirmasi.
          </p>
        </div>
      </div>
    </Container>
  )
}
