import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Ticket, Trash2 } from 'lucide-react'
import {
  createVoucher,
  deleteVoucher,
  fetchVouchers,
  toggleVoucher,
  updateVoucher,
  type VoucherInput,
} from '../../api/admin'
import type { Voucher, VoucherType } from '../../lib/types'
import { formatRupiah } from '../../lib/format'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { Skeleton } from '../../components/ui/Skeleton'

const TYPE_LABEL: Record<VoucherType, string> = {
  free_shipping: 'Gratis Ongkir',
  discount_fixed: 'Potongan Nominal',
  discount_percent: 'Potongan %',
}

const field =
  'w-full rounded-md border border-cream-darker px-3 py-2 text-sm focus:border-navy focus:outline-none'
const label = 'mb-1 block text-sm font-medium text-ink'

function VoucherForm({
  voucher,
  onClose,
  onSaved,
}: {
  voucher: Voucher | null
  onClose: () => void
  onSaved: () => void
}) {
  const [code, setCode] = useState(voucher?.code ?? '')
  const [name, setName] = useState(voucher?.name ?? '')
  const [type, setType] = useState<VoucherType>(voucher?.type ?? 'discount_fixed')
  const [value, setValue] = useState(voucher ? String(voucher.value) : '')
  const [minOrder, setMinOrder] = useState(voucher ? String(voucher.min_order) : '0')
  const [usageLimit, setUsageLimit] = useState(
    voucher?.usage_limit != null ? String(voucher.usage_limit) : '',
  )
  const [expiresAt, setExpiresAt] = useState(voucher?.expires_at?.slice(0, 10) ?? '')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      const input: VoucherInput = {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        type,
        value: Number(value) || 0,
        min_order: Number(minOrder) || 0,
        usage_limit: usageLimit === '' ? null : Number(usageLimit),
        expires_at: expiresAt ? `${expiresAt} 23:59:59` : null,
      }
      return voucher ? updateVoucher(voucher.id, input) : createVoucher(input)
    },
    onSuccess: onSaved,
    onError: (e) => setError((e as Error).message || 'Gagal menyimpan.'),
  })

  return (
    <div className="rounded-lg border border-cream-darker bg-white p-6">
      <h3 className="text-lg font-bold">{voucher ? 'Edit Voucher' : 'Tambah Voucher'}</h3>
      {error && (
        <div className="mt-3">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Kode</label>
          <input className={field} value={code} onChange={(e) => setCode(e.target.value)} placeholder="GRATISONGKIR" />
        </div>
        <div>
          <label className={label}>Nama</label>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Gratis Ongkir" />
        </div>
        <div>
          <label className={label}>Tipe</label>
          <select className={field} value={type} onChange={(e) => setType(e.target.value as VoucherType)}>
            <option value="discount_fixed">Potongan Nominal</option>
            <option value="discount_percent">Potongan %</option>
            <option value="free_shipping">Gratis Ongkir</option>
          </select>
        </div>
        <div>
          <label className={label}>
            {type === 'discount_percent' ? 'Persen (%)' : type === 'free_shipping' ? 'Nilai (opsional)' : 'Nominal (Rp)'}
          </label>
          <input className={field} type="number" value={value} onChange={(e) => setValue(e.target.value)} />
        </div>
        <div>
          <label className={label}>Min. belanja (Rp)</label>
          <input className={field} type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
        </div>
        <div>
          <label className={label}>Kuota (kosong = tak terbatas)</label>
          <input className={field} type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} />
        </div>
        <div>
          <label className={label}>Berlaku sampai</label>
          <input className={field} type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium text-ink-muted hover:bg-cream-dark">
          Batal
        </button>
        <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>
          Simpan
        </Button>
      </div>
    </div>
  )
}

export function AdminVouchers() {
  const queryClient = useQueryClient()
  const { data: vouchers, isLoading } = useQuery({ queryKey: ['admin-vouchers'], queryFn: fetchVouchers })
  const [editing, setEditing] = useState<Voucher | 'new' | null>(null)

  const del = useMutation({
    mutationFn: (id: number) => deleteVoucher(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] }),
  })
  const toggle = useMutation({
    mutationFn: (id: number) => toggleVoucher(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] }),
  })

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Voucher</h1>
        <Button onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> Tambah
        </Button>
      </div>

      {editing && (
        <div className="mt-6">
          <VoucherForm
            voucher={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null)
              queryClient.invalidateQueries({ queryKey: ['admin-vouchers'] })
            }}
          />
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-lg border border-cream-darker bg-white">
        {isLoading ? (
          <Skeleton className="h-40" />
        ) : vouchers && vouchers.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-cream-dark/50 text-left text-xs uppercase text-ink-muted">
              <tr>
                <th className="px-4 py-3">Kode</th>
                <th className="px-4 py-3">Tipe</th>
                <th className="px-4 py-3">Nilai</th>
                <th className="px-4 py-3">Terpakai</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-darker">
              {vouchers.map((v) => (
                <tr key={v.id}>
                  <td className="px-4 py-3 font-semibold">{v.code}</td>
                  <td className="px-4 py-3">{TYPE_LABEL[v.type]}</td>
                  <td className="px-4 py-3">
                    {v.type === 'discount_percent'
                      ? `${v.value}%`
                      : v.type === 'free_shipping'
                        ? '—'
                        : formatRupiah(v.value)}
                  </td>
                  <td className="px-4 py-3">
                    {v.used_count}
                    {v.usage_limit != null ? ` / ${v.usage_limit}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggle.mutate(v.id)}
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        v.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {v.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditing(v)} className="rounded-md p-2 text-ink-muted hover:bg-cream-dark">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => del.mutate(v.id)} className="rounded-md p-2 text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-10 text-center text-ink-muted">
            <Ticket className="mx-auto h-10 w-10" />
            <p className="mt-3">Belum ada voucher.</p>
          </div>
        )}
      </div>
    </div>
  )
}
