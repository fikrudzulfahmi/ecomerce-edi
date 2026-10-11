import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Container } from '../components/layout/Container'
import { ProductCard } from '../components/product/ProductCard'
import { ProductCardSkeleton } from '../components/ui/Skeleton'
import { useCategories, useProducts } from '../api/hooks'
import type { ProductSort } from '../api/catalog'

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'latest', label: 'Terbaru' },
  { value: 'price_asc', label: 'Harga Terendah' },
  { value: 'price_desc', label: 'Harga Tertinggi' },
  { value: 'name_asc', label: 'Nama A-Z' },
]

const selectClass =
  'rounded-md border border-cream-darker bg-white px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-navy'

export function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: categories } = useCategories()

  const q = searchParams.get('q') ?? ''
  const category = searchParams.get('category') ?? ''
  const type = searchParams.get('type') ?? ''
  const sortParam = searchParams.get('sort') ?? 'latest'
  const sort: ProductSort = SORT_OPTIONS.some((o) => o.value === sortParam)
    ? (sortParam as ProductSort)
    : 'latest'
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))

  const { data, isLoading } = useProducts({
    q: q || undefined,
    category: category || undefined,
    type: type === 'book' || type === 'other' ? type : undefined,
    sort,
    page,
    per_page: 12,
  })

  const [searchInput, setSearchInput] = useState(q)

  const updateParams = (updates: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(updates)) {
      if (value) next.set(key, value)
      else next.delete(key)
    }
    if (!('page' in updates)) next.delete('page')
    setSearchParams(next)
  }

  const total = data?.meta.total ?? 0
  const lastPage = data?.meta.last_page ?? 1

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold">Katalog</h1>

      <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            updateParams({ q: searchInput })
          }}
          className="flex flex-1 gap-2"
        >
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari buku, penulis, penerbit..."
            className="w-full rounded-md border border-cream-darker bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy"
          />
          <button
            type="submit"
            className="rounded-md bg-navy px-4 py-2 text-sm font-semibold text-cream transition hover:bg-navy-dark"
          >
            Cari
          </button>
        </form>

        <select
          value={category}
          onChange={(e) => updateParams({ category: e.target.value })}
          className={selectClass}
          aria-label="Kategori"
        >
          <option value="">Semua Kategori</option>
          {categories?.map((cat) => (
            <optgroup key={cat.id} label={cat.name}>
              <option value={cat.slug}>{cat.name} (semua)</option>
              {cat.children.map((child) => (
                <option key={child.id} value={child.slug}>
                  {child.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>

        <select
          value={type}
          onChange={(e) => updateParams({ type: e.target.value })}
          className={selectClass}
          aria-label="Jenis"
        >
          <option value="">Semua Jenis</option>
          <option value="book">Buku</option>
          <option value="other">Non-buku</option>
        </select>

        <select
          value={sort}
          onChange={(e) => updateParams({ sort: e.target.value })}
          className={selectClass}
          aria-label="Urutkan"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-4 text-sm text-ink-muted">
        Menampilkan {data?.data.length ?? 0} dari {total} produk
      </p>

      {isLoading ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : data && data.data.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {data.data.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-lg border border-dashed border-cream-darker bg-white p-12 text-center">
          <p className="font-medium text-navy">Produk tidak ditemukan</p>
          <p className="mt-1 text-sm text-ink-muted">Coba ubah kata kunci atau filter Anda.</p>
        </div>
      )}

      {lastPage > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => updateParams({ page: String(page - 1) })}
            className="rounded-md border border-cream-darker bg-white px-4 py-2 text-sm font-medium text-navy disabled:opacity-40"
          >
            Sebelumnya
          </button>
          <span className="text-sm text-ink-muted">
            Halaman {page} dari {lastPage}
          </span>
          <button
            type="button"
            disabled={page >= lastPage}
            onClick={() => updateParams({ page: String(page + 1) })}
            className="rounded-md border border-cream-darker bg-white px-4 py-2 text-sm font-medium text-navy disabled:opacity-40"
          >
            Berikutnya
          </button>
        </div>
      )}
    </Container>
  )
}
