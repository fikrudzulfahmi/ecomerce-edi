import { Fragment, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Minus, Plus, ShoppingCart } from 'lucide-react'
import { useAddCartItem, useProduct } from '../api/hooks'
import { formatRupiah } from '../lib/format'
import { extractErrorMessage } from '../lib/errors'
import { saveCartIntent } from '../lib/intent'
import { useAuthStore } from '../store/auth'
import { Container } from '../components/layout/Container'
import { ProductCard } from '../components/product/ProductCard'
import { Skeleton } from '../components/ui/Skeleton'
import { Button } from '../components/ui/Button'

export function ProductDetail() {
  const { slug = '' } = useParams()
  const { data, isLoading, isError } = useProduct(slug)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const [qty, setQty] = useState(1)
  const addItem = useAddCartItem()
  const [addMessage, setAddMessage] = useState<string | null>(null)
  const [addError, setAddError] = useState<string | null>(null)

  if (isLoading) {
    return (
      <Container className="py-10">
        <div className="grid gap-8 md:grid-cols-2">
          <Skeleton className="aspect-square" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-1/2" />
          </div>
        </div>
      </Container>
    )
  }

  if (isError || !data) {
    return (
      <Container className="py-16 text-center">
        <h1 className="text-2xl font-bold">Produk tidak ditemukan</h1>
        <Link to="/products" className="mt-4 inline-block font-semibold text-navy hover:underline">
          Kembali ke katalog
        </Link>
      </Container>
    )
  }

  const product = data.data
  const bookDetail = product.book_detail

  const details: Array<[string, string | number]> = []
  if (bookDetail?.publisher) details.push(['Penerbit', bookDetail.publisher])
  if (bookDetail?.year) details.push(['Tahun', bookDetail.year])
  if (bookDetail?.pages) details.push(['Halaman', bookDetail.pages])
  if (bookDetail?.isbn) details.push(['ISBN', bookDetail.isbn])
  if (bookDetail?.language) details.push(['Bahasa', bookDetail.language])

  const handleAddToCart = async () => {
    setAddMessage(null)
    setAddError(null)

    if (!user) {
      saveCartIntent({ productId: product.id, qty, returnTo: `/products/${product.slug}` })
      navigate('/login', { state: { from: { pathname: `/products/${product.slug}` } } })
      return
    }

    try {
      await addItem.mutateAsync({ productId: product.id, qty })
      setAddMessage('Berhasil ditambahkan ke keranjang.')
    } catch (err) {
      setAddError(extractErrorMessage(err))
    }
  }

  return (
    <Container className="py-10">
      <nav className="text-sm text-ink-muted">
        <Link to="/" className="hover:text-navy">
          Beranda
        </Link>{' '}
        /{' '}
        <Link to="/products" className="hover:text-navy">
          Katalog
        </Link>{' '}
        / <span className="text-navy">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-8 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-lg border border-cream-darker bg-white">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-muted">Tanpa gambar</div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">{product.name}</h1>
            {bookDetail?.author && (
              <p className="mt-1 text-ink-muted">oleh {bookDetail.author}</p>
            )}
          </div>

          <p className="text-3xl font-bold text-navy">{formatRupiah(product.price)}</p>

          {details.length > 0 && (
            <div className="rounded-lg border border-cream-darker bg-white p-4 text-sm">
              <dl className="grid grid-cols-[8rem_1fr] gap-y-2">
                {details.map(([label, value]) => (
                  <Fragment key={label}>
                    <dt className="text-ink-muted">{label}</dt>
                    <dd className="text-ink">{value}</dd>
                  </Fragment>
                ))}
              </dl>
            </div>
          )}

          <p className="text-sm font-medium text-ink">
            {product.type === 'ebook'
              ? 'Produk digital (E-Book)'
              : product.stock > 0
                ? `Stok tersedia: ${product.stock}`
                : 'Stok habis'}
          </p>

          {product.description && (
            <p className="text-sm leading-relaxed text-ink">{product.description}</p>
          )}

          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-md border border-cream-darker bg-white">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-2 text-navy hover:bg-cream-dark"
                aria-label="Kurangi jumlah"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => Math.min(product.type === 'ebook' ? 99 : product.stock || 1, q + 1))}
                className="px-3 py-2 text-navy hover:bg-cream-dark"
                aria-label="Tambah jumlah"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <Button
              type="button"
              onClick={handleAddToCart}
              disabled={product.type !== 'ebook' && product.stock === 0}
              className="flex-1 md:flex-none md:px-8"
            >
              <ShoppingCart className="h-4 w-4" />
              Tambah ke Keranjang
            </Button>
          </div>

          {addMessage && (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <span>{addMessage}</span>
              <Link to="/cart" className="font-semibold text-navy hover:underline">
                Lihat keranjang
              </Link>
            </div>
          )}
          {addError && <p className="text-sm text-red-600">{addError}</p>}
        </div>
      </div>

      {data.related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold">Produk Serupa</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {data.related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </Container>
  )
}
