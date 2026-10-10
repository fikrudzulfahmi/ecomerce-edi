import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { useMockFail, useMockPay, useOrder } from '../api/hooks'
import { formatRupiah } from '../lib/format'
import { Container } from '../components/layout/Container'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { Skeleton } from '../components/ui/Skeleton'

export function Payment() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const { data: order, isLoading } = useOrder(code)
  const mockPay = useMockPay()
  const mockFail = useMockFail()

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

  if (order.status === 'PAID') {
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
        <h1 className="mt-4 text-2xl font-bold">Pembayaran {order.status === 'EXPIRED' ? 'Kedaluwarsa' : 'Dibatalkan'}</h1>
        <p className="mt-2 text-ink-muted">Pesanan {order.code} tidak dapat diproses.</p>
        <Link to="/orders" className="mt-6 inline-block font-semibold text-navy hover:underline">
          Kembali ke Pesanan
        </Link>
      </Container>
    )
  }

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-md">
        <div className="rounded-xl border border-cream-darker bg-white p-6">
          <h1 className="text-xl font-bold">Simulasi Pembayaran GDC</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Ini halaman mock — pembayaran asli menyusul di Fase 8.
          </p>

          <div className="mt-4 rounded-lg bg-cream-dark p-4 text-center">
            <p className="text-sm text-ink-muted">Total pembayaran</p>
            <p className="text-3xl font-bold text-orange-dark">{formatRupiah(order.total)}</p>
            <p className="mt-1 text-xs text-ink-muted">Order {order.code}</p>
          </div>

          {mockPay.isError && (
            <div className="mt-3">
              <Alert variant="error">Gagal memproses pembayaran.</Alert>
            </div>
          )}

          <div className="mt-5 space-y-2">
            <Button
              className="w-full"
              onClick={() => mockPay.mutate(order.code)}
              loading={mockPay.isPending}
            >
              <CheckCircle2 className="h-4 w-4" /> Simulasikan Pembayaran Berhasil
            </Button>
            <Button
              variant="danger"
              className="w-full"
              onClick={() => mockFail.mutate(order.code)}
              loading={mockFail.isPending}
            >
              <XCircle className="h-4 w-4" /> Simulasikan Gagal
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate(`/orders/${order.code}`)}>
              Kembali ke Pesanan
            </Button>
          </div>
        </div>
      </div>
    </Container>
  )
}
