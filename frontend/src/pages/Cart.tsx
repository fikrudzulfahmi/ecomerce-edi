import { Link } from 'react-router-dom'
import { Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react'
import { useCart, useRemoveCartItem, useUpdateCartItem } from '../api/hooks'
import { formatRupiah } from '../lib/format'
import { Container } from '../components/layout/Container'
import { Skeleton } from '../components/ui/Skeleton'
import { Button } from '../components/ui/Button'

export function Cart() {
  const { data: cart, isLoading } = useCart()
  const updateItem = useUpdateCartItem()
  const removeItem = useRemoveCartItem()

  if (isLoading) {
    return (
      <Container className="py-10">
        <h1 className="text-2xl font-bold">Keranjang</h1>
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </Container>
    )
  }

  if (!cart || cart.items.length === 0) {
    return (
      <Container className="py-16 text-center">
        <ShoppingCart className="mx-auto h-12 w-12 text-ink-muted" />
        <h1 className="mt-4 text-2xl font-bold">Keranjang masih kosong</h1>
        <p className="mt-2 text-ink-muted">Yuk jelajahi katalog kami.</p>
        <Link
          to="/products"
          className="mt-6 inline-block rounded-md bg-orange px-6 py-3 font-semibold text-navy-dark transition hover:bg-orange-dark"
        >
          Mulai Belanja
        </Link>
      </Container>
    )
  }

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold">Keranjang</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-3">
          {cart.items.map((item) => (
            <div
              key={item.id}
              className="flex gap-4 rounded-lg border border-cream-darker bg-white p-4"
            >
              <Link
                to={`/products/${item.product.slug}`}
                className="h-20 w-20 shrink-0 overflow-hidden rounded-md bg-cream-dark"
              >
                {item.product.images[0] ? (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-ink-muted">–</div>
                )}
              </Link>

              <div className="flex flex-1 flex-col">
                <Link
                  to={`/products/${item.product.slug}`}
                  className="line-clamp-1 font-medium text-navy hover:underline"
                >
                  {item.product.name}
                </Link>
                {item.product.book_detail?.author && (
                  <p className="text-xs text-ink-muted">{item.product.book_detail.author}</p>
                )}
                <p className="mt-1 text-sm font-semibold text-orange-dark">
                  {formatRupiah(item.product.price)}
                </p>

                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center rounded-md border border-cream-darker">
                    <button
                      type="button"
                      onClick={() =>
                        updateItem.mutate({ itemId: item.id, qty: Math.max(1, item.qty - 1) })
                      }
                      className="px-2.5 py-1.5 text-navy hover:bg-cream-dark"
                      aria-label="Kurangi jumlah"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center text-sm">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() =>
                        updateItem.mutate({
                          itemId: item.id,
                          qty: Math.min(item.product.stock, item.qty + 1),
                        })
                      }
                      className="px-2.5 py-1.5 text-navy hover:bg-cream-dark"
                      aria-label="Tambah jumlah"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{formatRupiah(item.subtotal)}</span>
                    <button
                      type="button"
                      onClick={() => removeItem.mutate(item.id)}
                      className="rounded p-1.5 text-ink-muted transition hover:bg-red-50 hover:text-red-600"
                      aria-label="Hapus item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit rounded-lg border border-cream-darker bg-white p-5">
          <h2 className="text-lg font-bold">Ringkasan</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-muted">Total item</span>
              <span>{cart.total_items}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span>Subtotal</span>
              <span className="text-orange-dark">{formatRupiah(cart.subtotal)}</span>
            </div>
          </div>
          <Button className="mt-4 w-full" disabled>
            Lanjut ke Checkout
          </Button>
          <p className="mt-2 text-center text-xs text-ink-muted">
            Checkout tersedia di fase berikutnya.
          </p>
        </aside>
      </div>
    </Container>
  )
}
