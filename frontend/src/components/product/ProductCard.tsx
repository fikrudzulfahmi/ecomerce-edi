import { Link } from 'react-router-dom'
import { ImageOff } from 'lucide-react'
import type { Product } from '../../lib/types'
import { formatRupiah } from '../../lib/format'

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0]

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-cream-darker/60 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-glow"
    >
      <div className="relative aspect-square overflow-hidden bg-cream-dark">
        {product.type === 'ebook' && (
          <span className="absolute left-2 top-2 z-10 rounded bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
            E-Book
          </span>
        )}
        {product.type === 'bundle' && (
          <span className="absolute left-2 top-2 z-10 rounded bg-purple-600 px-2 py-0.5 text-xs font-semibold text-white">
            Bundle
          </span>
        )}
        {image ? (
          <img
            src={image}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-muted">
            <ImageOff className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <p className="line-clamp-2 text-sm font-medium text-navy">{product.name}</p>
        {product.book_detail?.author && (
          <p className="text-xs text-ink-muted">{product.book_detail.author}</p>
        )}
        {product.type !== 'ebook' && product.stock === 0 && (
          <p className="text-xs font-medium text-red-600">Stok habis</p>
        )}
        <p className="mt-auto pt-2 font-semibold text-orange-dark">{formatRupiah(product.price)}</p>
      </div>
    </Link>
  )
}
