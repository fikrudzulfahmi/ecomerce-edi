import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchAdminOrders } from '../../api/admin'
import { formatRupiah } from '../../lib/format'
import { orderStatusLabel, orderStatusTone } from '../../lib/order-status'
import type { OrderStatus } from '../../lib/types'
import { Skeleton } from '../../components/ui/Skeleton'

const STATUS_OPTIONS: ('' | OrderStatus)[] = [
  '',
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

export function AdminOrders() {
  const [status, setStatus] = useState<'' | OrderStatus>('')
  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status],
    queryFn: () => fetchAdminOrders({ status: status || undefined }),
  })

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Pesanan</h1>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as '' | OrderStatus)}
          className="rounded-md border border-cream-darker bg-white px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === '' ? 'Semua status' : orderStatusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <Skeleton className="mt-4 h-64" />
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-cream-darker bg-white">
          {data && data.data.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-cream-dark/60 text-left text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Kode</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Metode</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-darker">
                {data.data.map((o) => (
                  <tr key={o.id} className="hover:bg-cream-dark/30">
                    <td className="px-4 py-3">
                      <Link to={`/admin/orders/${o.code}`} className="font-mono text-navy hover:underline">
                        {o.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{formatRupiah(o.total)}</td>
                    <td className="px-4 py-3 uppercase text-ink-muted">{o.payment_method}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${orderStatusTone(o.status)}`}>
                        {orderStatusLabel(o.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">
                      {new Date(o.created_at).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-6 text-center text-sm text-ink-muted">Belum ada pesanan.</p>
          )}
        </div>
      )}
    </div>
  )
}
