import { useState, type ChangeEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import {
  createProduct,
  deleteProduct,
  fetchAdminProducts,
  toggleProduct,
  updateProduct,
  uploadFile,
  type ProductInput,
} from '../../api/admin'
import { useCategories } from '../../api/hooks'
import { formatRupiah } from '../../lib/format'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import type { Category, Product, ProductType } from '../../lib/types'

export function AdminProducts() {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState<Product | 'new' | null>(null)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => fetchAdminProducts(),
  })
  const { data: categories } = useCategories()

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-products'] })
  const toggle = useMutation({ mutationFn: toggleProduct, onSuccess: invalidate })
  const del = useMutation({ mutationFn: deleteProduct, onSuccess: invalidate })

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">Produk</h1>
        <Button onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> Tambah Produk
        </Button>
      </div>

      {editing && (
        <ProductForm
          product={editing === 'new' ? null : editing}
          categories={categories ?? []}
          products={data?.data ?? []}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            invalidate()
          }}
        />
      )}

      {isLoading ? (
        <Skeleton className="mt-4 h-64" />
      ) : (
        <div className="mt-4 overflow-hidden rounded-lg border border-cream-darker bg-white">
          <table className="w-full text-sm">
            <thead className="bg-cream-dark/60 text-left text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">Kategori</th>
                <th className="px-4 py-3 font-medium">Tipe</th>
                <th className="px-4 py-3 font-medium">Harga</th>
                <th className="px-4 py-3 font-medium">Stok</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-darker">
              {data?.data.map((p) => (
                <tr key={p.id} className="hover:bg-cream-dark/30">
                  <td className="px-4 py-3 font-medium text-navy">{p.name}</td>
                  <td className="px-4 py-3 text-ink-muted">{p.category?.name ?? '—'}</td>
                  <td className="px-4 py-3 uppercase text-ink-muted">{p.type}</td>
                  <td className="px-4 py-3">{formatRupiah(p.price)}</td>
                  <td className="px-4 py-3">
                    <span className={p.stock <= 5 ? 'font-semibold text-red-600' : ''}>{p.stock}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        p.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {p.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditing(p)}
                        className="rounded p-1.5 text-ink-muted hover:bg-cream-dark"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggle.mutate(p.id)}
                        className="rounded px-2 py-1 text-xs text-navy hover:bg-cream-dark"
                        title="Toggle status"
                      >
                        {p.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Hapus "${p.name}"?`)) del.mutate(p.id)
                        }}
                        className="rounded p-1.5 text-red-500 hover:bg-red-50"
                        title="Hapus"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ProductForm({
  product,
  categories,
  products,
  onClose,
  onSaved,
}: {
  product: Product | null
  categories: Category[]
  products: Product[]
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(product?.name ?? '')
  const [categoryId, setCategoryId] = useState(product?.category?.id ?? categories[0]?.id ?? '')
  const [type, setType] = useState<ProductType>(product?.type ?? 'book')
  const [price, setPrice] = useState(product ? String(product.price) : '')
  const [discount, setDiscount] = useState(product ? String(product.discount_percent) : '0')
  const [stock, setStock] = useState(product ? String(product.stock) : '0')
  const [weight, setWeight] = useState(product ? String(product.weight_gram) : '0')
  const [status, setStatus] = useState<'active' | 'inactive'>(product?.status === 'inactive' ? 'inactive' : 'active')
  const [description, setDescription] = useState(product?.description ?? '')
  const [images, setImages] = useState(product?.images.join(', ') ?? '')
  const [author, setAuthor] = useState(product?.book_detail?.author ?? '')
  const [isbn, setIsbn] = useState(product?.book_detail?.isbn ?? '')
  const [publisher, setPublisher] = useState(product?.book_detail?.publisher ?? '')
  const [digitalFile, setDigitalFile] = useState(product?.digital_file ?? '')
  const [fileName, setFileName] = useState('')
  const [bundlePhysicalId, setBundlePhysicalId] = useState(
    product?.bundle_physical_id ? String(product.bundle_physical_id) : '',
  )
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const physicalProducts = products.filter((p) => p.type === 'book' || p.type === 'other')

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError(null)
    try {
      const path = await uploadFile(file)
      setDigitalFile(path)
      setFileName(file.name)
    } catch {
      setError('Gagal mengunggah file.')
    } finally {
      setUploading(false)
    }
  }

  const mutation = useMutation({
    mutationFn: () => {
      const input: ProductInput = {
        name,
        category_id: Number(categoryId),
        type,
        price: Number(price),
        discount_percent: Number(discount) || 0,
        stock: Number(stock) || 0,
        weight_gram: Number(weight) || 0,
        status,
        description: description || undefined,
        images: images.split(',').map((s) => s.trim()).filter(Boolean),
      }
      if (type === 'ebook' || type === 'bundle') {
        input.digital_file = digitalFile || undefined
      }
      if (type === 'bundle') {
        input.bundle_physical_id = bundlePhysicalId ? Number(bundlePhysicalId) : undefined
      }
      if (type === 'book') {
        input.book_detail = { author: author || undefined, isbn: isbn || undefined, publisher: publisher || undefined }
      }
      return product ? updateProduct(product.id, input) : createProduct(input)
    },
    onSuccess: onSaved,
    onError: (e) => setError((e as Error).message || 'Gagal menyimpan.'),
  })

  const field = 'mt-1 w-full rounded-md border border-cream-darker px-3 py-2 text-sm focus:border-navy focus:outline-none'
  const label = 'mb-1 block text-sm font-medium text-ink-muted'

  return (
    <div className="mt-4 rounded-lg border border-cream-darker bg-white p-5">
      <h2 className="text-lg font-bold text-navy">{product ? 'Edit Produk' : 'Tambah Produk'}</h2>

      {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={label}>Nama Produk</label>
          <input className={field} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className={label}>Kategori</label>
          <select className={field} value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Tipe</label>
          <select className={field} value={type} onChange={(e) => setType(e.target.value as ProductType)}>
            <option value="book">Buku</option>
            <option value="other">Non-buku</option>
            <option value="ebook">E-Book</option>
            <option value="bundle">Bundle (cetak + digital)</option>
          </select>
        </div>
        <div>
          <label className={label}>Harga (Rp)</label>
          <input className={field} type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div>
          <label className={label}>Diskon (%)</label>
          <input
            className={field}
            type="number"
            min={0}
            max={99}
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
          />
        </div>
        <div>
          <label className={label}>Stok</label>
          <input className={field} type="number" value={stock} onChange={(e) => setStock(e.target.value)} />
        </div>
        <div>
          <label className={label}>Berat (gram)</label>
          <input className={field} type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </div>
        <div>
          <label className={label}>Status</label>
          <select className={field} value={status} onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Gambar (URL, pisahkan koma)</label>
          <input className={field} value={images} onChange={(e) => setImages(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Deskripsi</label>
          <textarea className={field} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        {(type === 'ebook' || type === 'bundle') && (
          <div className="sm:col-span-2">
            <label className={label}>File PDF/EPUB</label>
            <input
              type="file"
              accept=".pdf,.epub"
              onChange={handleFile}
              className="block w-full text-sm text-ink-muted file:mr-3 file:rounded-md file:border-0 file:bg-navy file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
            {uploading ? (
              <p className="mt-1 text-xs text-ink-muted">Mengunggah…</p>
            ) : digitalFile || fileName ? (
              <p className="mt-1 text-xs text-green-700">✓ {fileName || digitalFile}</p>
            ) : null}
          </div>
        )}

        {type === 'bundle' && (
          <div className="sm:col-span-2">
            <label className={label}>Buku fisik (dikirim)</label>
            <select className={field} value={bundlePhysicalId} onChange={(e) => setBundlePhysicalId(e.target.value)}>
              <option value="">— pilih buku fisik —</option>
              {physicalProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {type === 'book' && (
          <>
            <div>
              <label className={label}>Penulis</label>
              <input className={field} value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
            <div>
              <label className={label}>ISBN</label>
              <input className={field} value={isbn} onChange={(e) => setIsbn(e.target.value)} />
            </div>
            <div>
              <label className={label}>Penerbit</label>
              <input className={field} value={publisher} onChange={(e) => setPublisher(e.target.value)} />
            </div>
          </>
        )}
      </div>

      <div className="mt-5 flex gap-2">
        <Button onClick={() => mutation.mutate()} loading={mutation.isPending} disabled={!name || !price}>
          Simpan
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Batal
        </Button>
      </div>
    </div>
  )
}
