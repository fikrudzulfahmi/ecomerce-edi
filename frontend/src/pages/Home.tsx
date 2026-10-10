import { Link } from 'react-router-dom'
import { Container } from '../components/layout/Container'
import { ProductCard } from '../components/product/ProductCard'
import { ProductCardSkeleton, Skeleton } from '../components/ui/Skeleton'
import { useCategories, useProducts } from '../api/hooks'
import type { Product } from '../lib/types'

interface ProductSectionProps {
  title: string
  products?: Product[]
  loading: boolean
  linkTo?: string
}

function ProductSection({ title, products, loading, linkTo }: ProductSectionProps) {
  return (
    <section className="mt-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{title}</h2>
        {linkTo && (
          <Link to={linkTo} className="text-sm font-semibold text-navy hover:underline">
            Lihat semua
          </Link>
        )}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products?.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  )
}

export function Home() {
  const { data: categories, isLoading: loadingCategories } = useCategories()
  const { data: latest, isLoading: loadingLatest } = useProducts({ sort: 'latest', per_page: 8 })
  const { data: books, isLoading: loadingBooks } = useProducts({
    type: 'book',
    sort: 'latest',
    per_page: 8,
  })

  return (
    <div>
      <section className="bg-navy text-cream">
        <Container className="py-16 text-center md:py-24">
          <h1 className="text-3xl font-bold text-cream md:text-5xl">Temukan Buku Favoritmu</h1>
          <p className="mx-auto mt-4 max-w-xl text-cream/80">
            Novel, buku agama, referensi, alat tulis, dan merchandise — semua di satu tempat.
          </p>
          <Link
            to="/products"
            className="mt-8 inline-block rounded-md bg-orange px-6 py-3 font-semibold text-navy-dark transition hover:bg-orange-dark"
          >
            Jelajahi Katalog
          </Link>
        </Container>
      </section>

      <Container className="py-12">
        <section>
          <h2 className="text-2xl font-bold">Kategori</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {loadingCategories
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)
              : categories?.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/products?category=${cat.slug}`}
                    className="rounded-lg border border-cream-darker bg-white p-4 text-center transition hover:shadow-sm"
                  >
                    <span className="font-medium text-navy">{cat.name}</span>
                  </Link>
                ))}
          </div>
        </section>

        <ProductSection
          title="Produk Terbaru"
          products={latest?.data}
          loading={loadingLatest}
          linkTo="/products"
        />
        <ProductSection
          title="Buku Pilihan"
          products={books?.data}
          loading={loadingBooks}
          linkTo="/products?type=book"
        />
      </Container>
    </div>
  )
}
