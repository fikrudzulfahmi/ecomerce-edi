import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Gift,
  GraduationCap,
  Heart,
  PenTool,
  Sparkles,
  Star,
} from 'lucide-react'
import { fetchBanners } from '../../api/banners'
import type { Banner } from '../../lib/types'

function HeroArt() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[44%] md:block">
      <div className="relative h-full w-full">
        {/* rings */}
        <div className="absolute right-10 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full border-2 border-white/15" />
        <div className="absolute right-[4.5rem] top-1/2 h-48 w-48 -translate-y-1/2 rounded-full border-2 border-white/20" />
        <div className="absolute right-[6.75rem] top-1/2 h-28 w-28 -translate-y-1/2 rounded-full bg-white/15 backdrop-blur" />
        {/* main icon */}
        <BookOpen className="absolute right-[8rem] top-1/2 h-12 w-12 -translate-y-1/2 text-white" />
        {/* floating accents */}
        <PenTool className="absolute right-12 top-[24%] h-9 w-9 rotate-12 text-orange-light" />
        <Gift className="absolute right-[26%] top-[16%] h-11 w-11 -rotate-6 text-orange" />
        <GraduationCap className="absolute right-[20%] bottom-[22%] h-9 w-9 -rotate-12 text-white/80" />
        <Star className="absolute right-[34%] top-[30%] h-5 w-5 fill-orange-light text-orange-light" />
        <Sparkles className="absolute right-[13%] bottom-[34%] h-5 w-5 text-white/60" />
        <Heart className="absolute right-[30%] bottom-[10%] h-6 w-6 rotate-6 text-white/50" />
      </div>
    </div>
  )
}

function FallbackBanner() {
  return (
    <section className="relative mt-2 overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy to-navy-light text-white shadow-glow">
      <HeroArt />
      <div className="relative px-6 py-12 md:px-14 md:py-20">
        <span className="inline-block rounded-full bg-orange px-3 py-1 text-xs font-bold uppercase tracking-wide">
          Promo Spesial
        </span>
        <h1 className="mt-4 text-3xl font-bold leading-tight text-white md:text-5xl">
          Temukan Buku Favoritmu
        </h1>
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
      {banner.image ? (
        <img
          src={banner.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-40"
        />
      ) : (
        <HeroArt />
      )}
      <div className="relative px-6 py-12 md:px-14 md:py-20">
        {banner.title && (
          <h1 className="text-3xl font-bold leading-tight text-white md:text-5xl">{banner.title}</h1>
        )}
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
