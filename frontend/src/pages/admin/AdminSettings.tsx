import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Settings } from 'lucide-react'
import { fetchSettings, updateSettings } from '../../api/admin'
import { formatRupiah } from '../../lib/format'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'

export function AdminSettings() {
  const queryClient = useQueryClient()
  const { data: settings, isLoading } = useQuery({ queryKey: ['admin-settings'], queryFn: fetchSettings })
  const [fee, setFee] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const value = fee ?? (settings ? String(settings.handling_fee) : '0')

  const mutation = useMutation({
    mutationFn: () => updateSettings({ handling_fee: Number(value) || 0 }),
    onSuccess: () => {
      setFee(null)
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    },
  })

  return (
    <div>
      <h1 className="text-2xl font-bold">Pengaturan</h1>
      <p className="mt-1 text-sm text-ink-muted">Pengaturan umum toko.</p>

      <div className="mt-6 max-w-lg rounded-2xl border border-cream-darker/60 bg-white p-6 shadow-card">
        {isLoading ? (
          <Skeleton className="h-24" />
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-navy" />
              <h2 className="text-lg font-bold">Biaya Penanganan</h2>
            </div>
            <p className="mt-1 text-sm text-ink-muted">Biaya tetap yang ditambahkan ke setiap pesanan.</p>
            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium text-ink">Nominal (Rp)</label>
              <input
                type="number"
                min="0"
                value={value}
                onChange={(e) => setFee(e.target.value)}
                className="w-full rounded-xl border border-cream-darker px-3 py-2 text-sm focus:border-navy focus:outline-none"
              />
              <p className="mt-1 text-xs text-ink-muted">Saat ini: {formatRupiah(Number(value) || 0)}</p>
            </div>
            {saved && <p className="mt-3 text-sm font-medium text-green-700">✓ Tersimpan.</p>}
            <Button className="mt-4" onClick={() => mutation.mutate()} loading={mutation.isPending}>
              Simpan
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
