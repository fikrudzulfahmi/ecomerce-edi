import { Link } from 'react-router-dom'
import { ImageOff } from 'lucide-react'
import type { Product } from '../../lib/types'
import { formatRupiah } from '../../lib/format'
import { RatingStars } from './RatingStars'

export function ProductCard({ product }: { product: Product }) {
  const image = product.images[0]
  const discounted = product.discount_percent > 0

  return (
    <Link
      to={`/products/${product.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-cream-darker/60 bg-white shadow-card transition hover:-translate-y-1 hover:shadow-glow"
    >
      <div className="relative aspect-square overflow-hidden bg-cream-dark">
        {discounted && (
          <span className="absolute left-2 top-2 z-10 rounded bg-red-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
            -{product.discount_percent}%
          </span>
        )}
        {product.type === 'ebook' && (
          <span className="absolute right-2 top-2 z-10 rounded bg-blue-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
            E-Book
          </span>
        )}
        {product.type === 'bundle' && (
          <span className="absolute right-2 top-2 z-10 rounded bg-purple-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
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
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-sm font-bold text-navy">{formatRupiah(product.sale_price)}</p>
          {discounted && (
            <>
              <span className="text-[11px] text-ink-muted line-through">
                {formatRupiah(product.price)}
              </span>
              <span className="rounded bg-red-100 px-1 py-0.5 text-[10px] font-bold text-red-600">
                -{product.discount_percent}%
              </span>
            </>
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-ink-muted">{product.name}</p>
        {product.rating_count > 0 && (
          <div className="mt-1 flex items-center gap-1">
            <RatingStars rating={product.rating_avg} size={11} />
            <span className="text-[11px] text-ink-muted">({product.rating_count})</span>
          </div>
        )}
        <div className="mt-auto flex items-center gap-2 pt-1">
          {product.category && (
            <p className="text-[11px] text-ink-muted/70">{product.category.name}</p>
          )}
          {product.sold_count > 0 && (
            <span className="text-[11px] text-ink-muted/70">· Terjual {product.sold_count}</span>
          )}
        </div>
        {product.type !== 'ebook' && product.stock === 0 && (
          <p className="mt-1 text-[11px] font-medium text-red-600">Stok habis</p>
        )}
      </div>
    </Link>
  )
}
