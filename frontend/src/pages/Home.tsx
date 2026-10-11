import { Link } from 'react-router-dom'
import {
  BookMarked,
  BookOpen,
  ChevronRight,
  Download,
  Gift,
  GraduationCap,
  Heart,
  PenTool,
  Truck,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Container } from '../components/layout/Container'
import { HeroSlideshow } from '../components/home/HeroSlideshow'
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

const FEATURES: { icon: LucideIcon; label: string; sub: string }[] = [
  { icon: Truck, label: 'Kirim Mengantar', sub: 'Ongkir real-time' },
  { icon: Download, label: 'E-book instan', sub: 'Langsung diunduh' },
  { icon: Wallet, label: 'COD tersedia', sub: 'Bayar di tempat' },
]

interface ProductSectionProps {
  title: string
  products?: Product[]
  loading: boolean
  linkTo?: string
}

function ProductSection({ title, products, loading, linkTo }: ProductSectionProps) {
  return (
    <section className="mt-10">
      <div className="flex items-center justify-between border-l-4 border-navy pl-3">
        <h2 className="text-lg font-bold">{title}</h2>
        {linkTo && (
          <Link
            to={linkTo}
            className="flex items-center gap-0.5 text-sm font-semibold text-navy transition hover:gap-1.5"
          >
            Lihat semua <ChevronRight className="h-4 w-4" />
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
  const { data: topRated, isLoading: loadingTopRated } = useProducts({ sort: 'rating', per_page: 10 })
  const { data: books, isLoading: loadingBooks } = useProducts({
    type: 'book',
    sort: 'latest',
    per_page: 10,
  })

  return (
    <div>
      <Container className="py-6">
        <HeroSlideshow />

        {/* Strip fitur */}
        <section className="mt-4 grid gap-3 sm:grid-cols-3">
          {FEATURES.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-3 rounded-xl bg-white p-4 shadow-card">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-navy/10 text-navy">
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-ink">{label}</span>
                <span className="block text-xs text-ink-muted">{sub}</span>
              </span>
            </div>
          ))}
        </section>

        {/* Kategori chips */}
        <section className="mt-8">
          <div className="flex items-center justify-between border-l-4 border-navy pl-3">
            <h2 className="text-lg font-bold">Kategori</h2>
          </div>
          <div className="mt-3 flex gap-5 overflow-x-auto py-1">
            {loadingCategories
              ? Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-20 shrink-0 rounded-full" />
                ))
              : categories?.map((cat) => {
                  const Icon = categoryIcon(cat.slug)
                  return (
                    <Link
                      key={cat.id}
                      to={`/products?category=${cat.slug}`}
                      className="group flex w-20 shrink-0 flex-col items-center gap-2 text-center"
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-navy shadow-card transition group-hover:bg-navy group-hover:text-white">
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="text-xs font-medium text-ink">{cat.name}</span>
                    </Link>
                  )
                })}
          </div>
        </section>

        <ProductSection
          title="Rating Tertinggi"
          products={topRated?.data}
          loading={loadingTopRated}
          linkTo="/products?sort=rating"
        />
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
