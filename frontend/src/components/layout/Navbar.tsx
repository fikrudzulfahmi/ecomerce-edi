import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, LogOut, Search, ShoppingCart } from 'lucide-react'
import { Container } from './Container'
import { useAuthStore } from '../../store/auth'
import { useCart } from '../../api/hooks'

export function Navbar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { data: cart } = useCart()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    navigate(q ? `/products?q=${encodeURIComponent(q)}` : '/products')
  }

  return (
    <header className="sticky top-0 z-50 bg-white shadow-soft">
      <Container className="flex h-16 items-center gap-4">
        <Link to="/" className="flex shrink-0 items-center gap-2 text-navy">
          <BookOpen className="h-7 w-7" />
          <span className="hidden text-lg font-bold md:block">Edi&rsquo;s Journal Store</span>
        </Link>

        <form onSubmit={handleSearch} className="flex min-w-0 flex-1 items-center">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari buku, alat tulis, merchandise..."
            className="w-full rounded-l-full border border-cream-darker bg-cream px-4 py-2 text-sm focus:border-navy focus:bg-white focus:outline-none"
          />
          <button
            type="submit"
            aria-label="Cari"
            className="flex items-center gap-1.5 rounded-r-full bg-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-dark"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Cari</span>
          </button>
        </form>

        <div className="flex shrink-0 items-center gap-1">
          <Link
            to="/cart"
            className="relative rounded-full p-2 text-ink transition hover:bg-cream-dark"
            aria-label="Keranjang"
          >
            <ShoppingCart className="h-5 w-5" />
            {cart && cart.total_items > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange px-1 text-xs font-bold text-white">
                {cart.total_items}
              </span>
            )}
          </Link>

          {user ? (
            <div className="flex items-center gap-1">
              <span className="hidden max-w-[8rem] truncate text-sm font-medium text-ink lg:block">
                {user.name}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-2 text-sm font-medium text-ink-muted transition hover:bg-cream-dark hover:text-ink"
                aria-label="Keluar"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="rounded-full border border-navy px-4 py-1.5 text-sm font-semibold text-navy transition hover:bg-navy hover:text-white"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-navy px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-navy-dark"
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      </Container>

      <nav className="border-t border-cream-darker">
        <Container className="flex items-center gap-6 overflow-x-auto py-2 text-sm">
          <Link to="/" className="shrink-0 font-semibold text-navy">
            Beranda
          </Link>
          <Link to="/products" className="shrink-0 text-ink-muted transition hover:text-navy">
            Katalog
          </Link>
          {user && (
            <Link to="/orders" className="shrink-0 text-ink-muted transition hover:text-navy">
              Pesanan
            </Link>
          )}
          {user && (
            <Link to="/library" className="shrink-0 text-ink-muted transition hover:text-navy">
              Pustaka
            </Link>
          )}
          {user && (
            <Link to="/account" className="shrink-0 text-ink-muted transition hover:text-navy">
              Akun
            </Link>
          )}
          {user?.role === 'admin' && (
            <Link to="/admin" className="shrink-0 text-ink-muted transition hover:text-navy">
              Admin
            </Link>
          )}
        </Container>
      </nav>
    </header>
  )
}
