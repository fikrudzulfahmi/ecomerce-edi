import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  createBanner,
  deleteBanner,
  fetchAdminBanners,
  toggleBanner,
  updateBanner,
  type BannerInput,
} from '../../api/admin'
import type { Banner } from '../../lib/types'
import { Button } from '../../components/ui/Button'
import { Alert } from '../../components/ui/Alert'
import { Skeleton } from '../../components/ui/Skeleton'

const field =
  'w-full rounded-lg border border-cream-darker px-3 py-2 text-sm focus:border-navy focus:outline-none'
const label = 'mb-1 block text-sm font-medium text-ink'

function BannerForm({
  banner,
  onClose,
  onSaved,
}: {
  banner: Banner | null
  onClose: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState(banner?.title ?? '')
  const [subtitle, setSubtitle] = useState(banner?.subtitle ?? '')
  const [image, setImage] = useState(banner?.image ?? '')
  const [link, setLink] = useState(banner?.link ?? '')
  const [sortOrder, setSortOrder] = useState(banner ? String(banner.sort_order) : '0')
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () => {
      const input: BannerInput = {
        title: title || null,
        subtitle: subtitle || null,
        image: image || null,
        link: link || null,
        sort_order: Number(sortOrder) || 0,
      }
      return banner ? updateBanner(banner.id, input) : createBanner(input)
    },
    onSuccess: onSaved,
    onError: (e) => setError((e as Error).message || 'Gagal menyimpan.'),
  })

  return (
    <div className="rounded-2xl border border-cream-darker bg-white p-6 shadow-card">
      <h3 className="text-lg font-bold">{banner ? 'Edit Banner' : 'Tambah Banner'}</h3>
      {error && (
        <div className="mt-3">
          <Alert variant="error">{error}</Alert>
        </div>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label}>Judul</label>
          <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Promo Akhir Tahun" />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Subjudul</label>
          <input className={field} value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Diskon hingga 50%" />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Gambar (URL, opsional)</label>
          <input className={field} value={image} onChange={(e) => setImage(e.target.value)} placeholder="https://..." />
        </div>
        <div>
          <label className={label}>Link tujuan (opsional)</label>
          <input className={field} value={link} onChange={(e) => setLink(e.target.value)} placeholder="/products?category=buku" />
        </div>
        <div>
          <label className={label}>Urutan</label>
          <input className={field} type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-ink-muted hover:bg-cream-dark">
          Batal
        </button>
        <Button onClick={() => mutation.mutate()} loading={mutation.isPending}>
          Simpan
        </Button>
      </div>
    </div>
  )
}

export function AdminBanners() {
  const queryClient = useQueryClient()
  const { data: banners, isLoading } = useQuery({ queryKey: ['admin-banners'], queryFn: fetchAdminBanners })
  const [editing, setEditing] = useState<Banner | 'new' | null>(null)

  const del = useMutation({
    mutationFn: (id: number) => deleteBanner(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-banners'] }),
  })
  const toggle = useMutation({
    mutationFn: (id: number) => toggleBanner(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-banners'] }),
  })

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Banner / Slideshow</h1>
          <p className="mt-1 text-sm text-ink-muted">Promo, diskon, atau pengumuman di hero beranda.</p>
        </div>
        <Button onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> Tambah
        </Button>
      </div>

      {editing && (
        <div className="mt-6">
          <BannerForm
            banner={editing === 'new' ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null)
              queryClient.invalidateQueries({ queryKey: ['admin-banners'] })
            }}
          />
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-2xl border border-cream-darker bg-white">
        {isLoading ? (
          <Skeleton className="h-40" />
        ) : banners && banners.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-cream-dark/50 text-left text-xs uppercase text-ink-muted">
              <tr>
                <th className="px-4 py-3">Judul</th>
                <th className="px-4 py-3">Subjudul</th>
                <th className="px-4 py-3">Urutan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-darker">
              {banners.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-medium">{b.title || '—'}</td>
                  <td className="px-4 py-3 text-ink-muted">{b.subtitle || '—'}</td>
                  <td className="px-4 py-3">{b.sort_order}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggle.mutate(b.id)}
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        b.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {b.is_active ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditing(b)} className="rounded-md p-2 text-ink-muted hover:bg-cream-dark">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => del.mutate(b.id)} className="rounded-md p-2 text-red-600 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-10 text-center text-ink-muted">Belum ada banner. Tambahkan untuk menampilkan slideshow.</div>
        )}
      </div>
    </div>
  )
}
