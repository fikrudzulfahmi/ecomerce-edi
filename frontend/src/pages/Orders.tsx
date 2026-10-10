import { Link } from 'react-router-dom'
import { Package } from 'lucide-react'
import { useOrders } from '../api/hooks'
import { formatRupiah } from '../lib/format'
import { orderStatusLabel, orderStatusTone } from '../lib/order-status'
import { Container } from '../components/layout/Container'
import { Skeleton } from '../components/ui/Skeleton'

export function Orders() {
  const { data, isLoading } = useOrders(1)

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold">Pesanan Saya</h1>

      {isLoading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : data && data.data.length > 0 ? (
        <div className="mt-6 space-y-3">
          {data.data.map((order) => (
            <Link
              key={order.id}
              to={`/orders/${order.code}`}
              className="block rounded-lg border border-cream-darker bg-white p-5 transition hover:shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-mono text-xs text-ink-muted">{order.code}</p>
                  <p className="mt-1 font-semibold text-navy">{formatRupiah(order.total)}</p>
                  <p className="mt-1 text-xs text-ink-muted">
                    {new Date(order.created_at).toLocaleDateString('id-ID')} · {order.items.length}{' '}
                    item
                  </p>
                </div>
                <span
                  className={`rounded px-2.5 py-1 text-xs font-medium ${orderStatusTone(order.status)}`}
                >
                  {orderStatusLabel(order.status)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-lg border border-dashed border-cream-darker bg-white p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-ink-muted" />
          <p className="mt-4 font-medium text-navy">Belum ada pesanan</p>
          <Link to="/products" className="mt-2 inline-block text-sm font-semibold text-navy hover:underline">
            Mulai belanja
          </Link>
        </div>
      )}
    </Container>
  )
}
