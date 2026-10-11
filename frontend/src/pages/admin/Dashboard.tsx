import { Link } from 'react-router-dom'
import { AlertTriangle, Package, ShoppingBag, TrendingUp } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { fetchDashboard } from '../../api/admin'
import { formatRupiah } from '../../lib/format'
import { orderStatusLabel, orderStatusTone } from '../../lib/order-status'
import { Skeleton } from '../../components/ui/Skeleton'

export function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-dashboard'], queryFn: fetchDashboard })

  if (isLoading) {
    return <Skeleton className="h-40" />
  }
  if (!data) {
    return null
  }

  const stats = [
    { label: 'Pendapatan', value: formatRupiah(data.total_revenue), icon: TrendingUp },
    { label: 'Pesanan', value: String(data.total_orders), icon: ShoppingBag },
    { label: 'Produk', value: String(data.total_products), icon: Package },
    { label: 'Stok Menipis (≤5)', value: String(data.low_stock_products), icon: AlertTriangle },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-navy">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border border-cream-darker bg-white p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink-muted">{label}</p>
              <Icon className="h-5 w-5 text-navy" />
            </div>
            <p className="mt-2 text-2xl font-bold text-navy">{value}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-bold text-navy">Pesanan Terbaru</h2>
      <div className="mt-3 overflow-hidden rounded-lg border border-cream-darker bg-white">
        {data.recent_orders.length === 0 ? (
          <p className="p-6 text-center text-sm text-ink-muted">Belum ada pesanan.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-cream-dark/60 text-left text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Kode</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Tanggal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-darker">
              {data.recent_orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3">
                    <Link to={`/admin/orders/${o.code}`} className="font-mono text-navy hover:underline">
                      {o.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{formatRupiah(o.total)}</td>
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
        )}
      </div>
    </div>
  )
}
