import { Link } from 'react-router-dom'
import {
  Backpack,
  BookMarked,
  BookOpen,
  Download,
  Gift,
  GraduationCap,
  Heart,
  PenTool,
  ShieldCheck,
  Truck,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Container } from '../components/layout/Container'
import { ProductCard } from '../components/product/ProductCard'
import { ProductCardSkeleton, Skeleton } from '../components/ui/Skeleton'
import { useCategories, useProducts } from '../api/hooks'
import type { Product } from '../lib/types'

const FEATURES: { icon: LucideIcon; label: string }[] = [
  { icon: Truck, label: 'Kirim Mengantar' },
  { icon: Download, label: 'E-book instan' },
  { icon: ShieldCheck, label: 'Pembayaran aman' },
  { icon: Wallet, label: 'COD tersedia' },
]

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
      <section className="relative overflow-hidden bg-navy text-cream">
        {/* Ornamen dekoratif */}
        <BookOpen className="pointer-events-none absolute -left-8 top-12 h-32 w-32 -rotate-12 text-cream/10 md:h-48 md:w-48" />
        <PenTool className="pointer-events-none absolute -right-10 top-8 h-28 w-28 rotate-12 text-cream/10 md:h-44 md:w-44" />
        <Gift className="pointer-events-none absolute bottom-10 left-[8%] h-20 w-20 -rotate-6 text-orange/20 md:h-32 md:w-32" />
        <GraduationCap className="pointer-events-none absolute bottom-12 right-[9%] h-20 w-20 rotate-6 text-cream/10 md:h-32 md:w-32" />
        <BookMarked className="pointer-events-none absolute left-[46%] top-6 h-10 w-10 -rotate-12 text-orange/15 md:h-16 md:w-16" />
        <Backpack className="pointer-events-none absolute bottom-4 left-[46%] hidden h-12 w-12 rotate-12 text-cream/10 md:block" />

        <Container className="relative py-16 text-center md:py-24">
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

          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-3">
            {FEATURES.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-2 rounded-full border border-cream/20 bg-cream/5 px-4 py-2 text-sm text-cream/90"
              >
                <Icon className="h-4 w-4 text-orange" />
                {label}
              </span>
            ))}
          </div>
        </Container>
      </section>

      <Container className="py-12">
        <section>
          <h2 className="text-2xl font-bold">Kategori</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {loadingCategories
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)
              : categories?.map((cat) => {
                  const Icon = categoryIcon(cat.slug)
                  return (
                    <Link
                      key={cat.id}
                      to={`/products?category=${cat.slug}`}
                      className="group flex flex-col items-center gap-3 rounded-lg border border-cream-darker bg-white p-6 text-center transition hover:-translate-y-0.5 hover:border-navy/30 hover:shadow-md"
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-navy/10 text-navy transition group-hover:bg-navy group-hover:text-cream">
                        <Icon className="h-6 w-6" />
                      </span>
                      <span className="font-semibold text-navy">{cat.name}</span>
                      {cat.children && cat.children.length > 0 && (
                        <span className="text-xs leading-relaxed text-ink-muted">
                          {cat.children.map((c) => c.name).join(' · ')}
                        </span>
                      )}
                    </Link>
                  )
                })}
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
