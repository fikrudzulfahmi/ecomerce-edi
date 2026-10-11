import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Backpack, BookOpen, ChevronLeft, ChevronRight, Gift, PenTool } from 'lucide-react'
import { fetchBanners } from '../../api/banners'
import type { Banner } from '../../lib/types'

function FallbackBanner() {
  return (
    <section className="relative mt-2 overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy to-navy-light text-white shadow-glow">
      <BookOpen className="pointer-events-none absolute -left-6 top-10 h-32 w-32 -rotate-12 text-white/10" />
      <PenTool className="pointer-events-none absolute right-10 top-6 hidden h-24 w-24 rotate-12 text-white/10 md:block" />
      <Gift className="pointer-events-none absolute bottom-8 right-[22%] h-16 w-16 -rotate-6 text-orange/30" />
      <Backpack className="pointer-events-none absolute bottom-6 left-1/2 hidden h-14 w-14 rotate-12 text-white/10 lg:block" />
      <div className="relative px-6 py-12 md:px-14 md:py-20">
        <span className="inline-block rounded-full bg-orange px-3 py-1 text-xs font-bold uppercase tracking-wide">
          Promo Spesial
        </span>
        <h1 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">Temukan Buku Favoritmu</h1>
        <p className="mt-3 max-w-lg text-sm text-white/85 md:text-base">
          Novel, buku agama, referensi, alat tulis, dan merchandise — semua di satu tempat.
        </p>
        <Link
          to="/products"
          className="mt-6 inline-block rounded-full bg-orange px-7 py-3 font-semibold text-white shadow-lg shadow-orange/30 transition hover:bg-orange-dark"
        >
          Jelajahi Katalog
        </Link>
      </div>
    </section>
  )
}

export function HeroSlideshow() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [index, setIndex] = useState(0)

  useEffect(() => {
    fetchBanners().then(setBanners).catch(() => {})
  }, [])

  useEffect(() => {
    if (banners.length <= 1) return
    const t = setInterval(() => setIndex((i) => (i + 1) % banners.length), 5000)
    return () => clearInterval(t)
  }, [banners.length])

  if (banners.length === 0) {
    return <FallbackBanner />
  }

  const banner = banners[index]

  return (
    <section className="relative mt-2 overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy to-navy-light text-white shadow-glow">
      {banner.image && (
        <img
          src={banner.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
      )}
      <div className="relative px-6 py-12 md:px-14 md:py-20">
        {banner.title && <h1 className="text-3xl font-bold leading-tight md:text-5xl">{banner.title}</h1>}
        {banner.subtitle && (
          <p className="mt-3 max-w-lg text-sm text-white/85 md:text-base">{banner.subtitle}</p>
        )}
        {banner.link && (
          <Link
            to={banner.link}
            className="mt-6 inline-block rounded-full bg-orange px-7 py-3 font-semibold text-white shadow-lg shadow-orange/30 transition hover:bg-orange-dark"
          >
            Lihat Promo
          </Link>
        )}
      </div>

      {banners.length > 1 && (
        <>
          <button
            onClick={() => setIndex((index - 1 + banners.length) % banners.length)}
            className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 transition hover:bg-white/30"
            aria-label="Sebelumnya"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setIndex((index + 1) % banners.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 transition hover:bg-white/30"
            aria-label="Berikutnya"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
            {banners.map((b, i) => (
              <button
                key={b.id}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${i === index ? 'w-6 bg-orange' : 'w-2 bg-white/50'}`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  )
}
