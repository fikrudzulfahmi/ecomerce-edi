import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import type { Category } from '../../lib/types'
import {
  createCategory,
  deleteCategory,
  fetchAdminCategories,
  updateCategory,
} from '../../api/admin'
import { extractErrorMessage } from '../../lib/errors'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Alert } from '../../components/ui/Alert'

const selectCls =
  'w-full rounded-md border border-cream-darker bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-navy/30'

export function AdminCategories() {
  const qc = useQueryClient()
  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: fetchAdminCategories,
  })

  const [name, setName] = useState('')
  const [parentId, setParentId] = useState<number | ''>('')
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState<Category | null>(null)
  const [editName, setEditName] = useState('')
  const [editParentId, setEditParentId] = useState<number | ''>('')

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-categories'] })
    qc.invalidateQueries({ queryKey: ['categories'] })
  }

  const createMutation = useMutation({
    mutationFn: () => createCategory({ name: name.trim(), parent_id: parentId || null }),
    onSuccess: () => {
      invalidate()
      setName('')
      setParentId('')
      setError(null)
    },
    onError: (e) => setError(extractErrorMessage(e)),
  })

  const updateMutation = useMutation({
    mutationFn: () =>
      updateCategory(editing!.id, { name: editName.trim(), parent_id: editParentId || null }),
    onSuccess: () => {
      invalidate()
      setEditing(null)
      setError(null)
    },
    onError: (e) => setError(extractErrorMessage(e)),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      invalidate()
      setError(null)
    },
    onError: (e) => setError(extractErrorMessage(e)),
  })

  const parentOptions = (excludeId?: number) =>
    categories.filter((c) => c.id !== excludeId).map((c) => ({ id: c.id, name: c.name }))

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Kategori</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Kelola kategori produk. Buat induk, lalu subkategori lewat menu "Induk".
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Form tambah */}
      <div className="rounded-2xl border border-cream-darker bg-white p-5 shadow-card">
        <h2 className="font-semibold text-ink">Tambah Kategori</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="w-full sm:w-64">
            <Input
              label="Nama Kategori"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="mis. Buku Novel"
            />
          </div>
          <div className="w-full sm:w-56">
            <label className="mb-1 block text-sm font-medium text-ink">Induk (opsional)</label>
            <select
              className={selectCls}
              value={parentId}
              onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">— Tanpa induk —</option>
              {parentOptions().map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <Button
            onClick={() => createMutation.mutate()}
            loading={createMutation.isPending}
            disabled={!name.trim()}
          >
            <Plus className="h-4 w-4" /> Tambah
          </Button>
        </div>
      </div>

      {/* Daftar */}
      <div className="overflow-hidden rounded-2xl border border-cream-darker bg-white shadow-card">
        {categories.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-muted">
            Belum ada kategori. Tambahkan lewat form di atas.
          </p>
        ) : (
          <ul className="divide-y divide-cream-darker">
            {categories.map((c) => (
              <li key={c.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate font-semibold text-ink">{c.name}</span>
                    <span className="shrink-0 text-xs text-ink-muted">/{c.slug}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(c)
                        setEditName(c.name)
                        setEditParentId(c.parent_id ?? '')
                      }}
                      className="rounded-md p-2 text-ink-muted transition hover:bg-cream-dark hover:text-navy"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Hapus kategori "${c.name}"?`)) {
                          deleteMutation.mutate(c.id)
                        }
                      }}
                      className="rounded-md p-2 text-ink-muted transition hover:bg-red-50 hover:text-red-600"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {c.children?.length > 0 && (
                  <ul className="mt-2 space-y-1 border-l-2 border-cream-darker pl-5">
                    {c.children.map((ch) => (
                      <li key={ch.id} className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="truncate text-sm text-ink">{ch.name}</span>
                          <span className="shrink-0 text-xs text-ink-muted">/{ch.slug}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditing(ch)
                              setEditName(ch.name)
                              setEditParentId(ch.parent_id ?? '')
                            }}
                            className="rounded-md p-1.5 text-ink-muted transition hover:bg-cream-dark hover:text-navy"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Hapus subkategori "${ch.name}"?`)) {
                                deleteMutation.mutate(ch.id)
                              }
                            }}
                            className="rounded-md p-1.5 text-ink-muted transition hover:bg-red-50 hover:text-red-600"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Modal edit */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink">Edit Kategori</h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-md p-1 text-ink-muted transition hover:bg-cream-dark"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <Input
                label="Nama Kategori"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <div>
                <label className="mb-1 block text-sm font-medium text-ink">Induk (opsional)</label>
                <select
                  className={selectCls}
                  value={editParentId}
                  onChange={(e) =>
                    setEditParentId(e.target.value ? Number(e.target.value) : '')
                  }
                >
                  <option value="">— Tanpa induk —</option>
                  {parentOptions(editing.id).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setEditing(null)}>
                Batal
              </Button>
              <Button
                onClick={() => updateMutation.mutate()}
                loading={updateMutation.isPending}
                disabled={!editName.trim()}
              >
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
