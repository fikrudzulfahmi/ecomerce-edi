import { Link } from 'react-router-dom'
import { ImageOff } from 'lucide-react'
import type { Product } from '../../lib/types'
import { formatRupiah } from '../../lib/format'
import { RatingStars } from './RatingStars'

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0]

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg bg-white shadow-card transition hover:shadow-glow"
    >
      <div className="relative aspect-square overflow-hidden bg-cream-dark">
        {product.type === 'ebook' && (
          <span className="absolute left-2 top-2 z-10 rounded bg-blue-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            E-Book
          </span>
        )}
        {product.type === 'bundle' && (
          <span className="absolute left-2 top-2 z-10 rounded bg-purple-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            Bundle
          </span>
        )}
        {product.type !== 'ebook' && product.stock > 0 && product.stock <= 5 && (
          <span className="absolute bottom-2 left-2 z-10 rounded bg-orange px-1.5 py-0.5 text-[11px] font-semibold text-white">
            Sisa {product.stock}
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

      <div className="flex flex-1 flex-col p-2.5">
        <p className="text-sm font-bold text-ink">{formatRupiah(product.price)}</p>
        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-ink-muted">{product.name}</p>
        {product.rating_count > 0 && (
          <div className="mt-1 flex items-center gap-1">
            <RatingStars rating={product.rating_avg} size={11} />
            <span className="text-[11px] text-ink-muted">({product.rating_count})</span>
          </div>
        )}
        {product.category && (
          <p className="mt-auto pt-1 text-[11px] text-ink-muted/70">{product.category.name}</p>
        )}
        {product.type !== 'ebook' && product.stock === 0 && (
          <p className="mt-1 text-[11px] font-medium text-red-600">Stok habis</p>
        )}
      </div>
    </Link>
  )
}
