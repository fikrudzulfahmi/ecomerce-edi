import { Link } from 'react-router-dom'
import { Backpack, BookMarked, BookOpen, Gift, GraduationCap, Heart, PenTool } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Container } from '../components/layout/Container'
import { ProductCard } from '../components/product/ProductCard'
import { ProductCardSkeleton, Skeleton } from '../components/ui/Skeleton'
import { useCategories, useProducts } from '../api/hooks'
import type { Product } from '../lib/types'

function categoryIcon(slug: string): LucideIcon {
  if (slug.includes('tulis')) return PenTool
  if (slug.includes('merchandise') || slug.includes('aksesoris')) return Gift
  if (slug.includes('buku') || slug.includes('novel') || slug.includes('sastra')) return BookOpen
  if (slug.includes('agama') || slug.includes('spiritual')) return BookMarked
  if (slug.includes('pendidikan') || slug.includes('referensi')) return GraduationCap
  if (slug.includes('anak') || slug.includes('remaja')) return Heart
  return BookMarked
}

interface ProductSectionProps {
  title: string
  products?: Product[]
  loading: boolean
  linkTo?: string
}

function ProductSection({ title, products, loading, linkTo }: ProductSectionProps) {
  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        {linkTo && (
          <Link to={linkTo} className="text-sm font-semibold text-navy hover:underline">
            Lihat semua
          </Link>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products?.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  )
}

export function Home() {
  const { data: categories, isLoading: loadingCategories } = useCategories()
  const { data: latest, isLoading: loadingLatest } = useProducts({ sort: 'latest', per_page: 10 })
  const { data: books, isLoading: loadingBooks } = useProducts({
    type: 'book',
    sort: 'latest',
    per_page: 10,
  })

  return (
    <div>
      <Container className="py-6">
        {/* Kategori chips (ala Tokopedia) */}
        <section className="overflow-x-auto">
          <div className="flex gap-6 py-1">
            {loadingCategories
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-20 shrink-0 rounded-full" />)
              : categories?.map((cat) => {
                  const Icon = categoryIcon(cat.slug)
                  return (
                    <Link
                      key={cat.id}
                      to={`/products?category=${cat.slug}`}
                      className="flex w-20 shrink-0 flex-col items-center gap-2 text-center"
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-navy shadow-card transition group-hover:bg-navy">
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="text-xs font-medium text-ink">{cat.name}</span>
                    </Link>
                  )
                })}
          </div>
        </section>

        {/* Banner promo */}
        <section className="relative mt-6 overflow-hidden rounded-xl bg-navy text-white">
          <BookOpen className="pointer-events-none absolute -left-6 top-8 h-32 w-32 -rotate-12 text-white/10" />
          <PenTool className="pointer-events-none absolute -right-8 top-4 h-28 w-28 rotate-12 text-white/10" />
          <Gift className="pointer-events-none absolute bottom-6 right-[18%] h-16 w-16 -rotate-6 text-orange/30" />
          <Backpack className="pointer-events-none absolute bottom-4 left-1/2 hidden h-12 w-12 rotate-12 text-white/10 md:block" />

          <div className="relative px-6 py-10 md:px-14 md:py-16">
            <h1 className="text-2xl font-bold md:text-4xl">Temukan Buku Favoritmu</h1>
            <p className="mt-2 max-w-lg text-sm text-white/80 md:text-base">
              Novel, buku agama, referensi, alat tulis, dan merchandise — semua di satu tempat.
            </p>
            <Link
              to="/products"
              className="mt-6 inline-block rounded-full bg-orange px-6 py-2.5 font-semibold text-white transition hover:bg-orange-dark"
            >
              Jelajahi Katalog
            </Link>
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
