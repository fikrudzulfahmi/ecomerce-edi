import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, LogOut, ShoppingCart } from 'lucide-react'
import { Container } from './Container'
import { useAuthStore } from '../../store/auth'

export function Navbar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 bg-navy text-cream shadow-sm">
      <Container className="flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-serif text-lg font-bold">
          <BookOpen className="h-6 w-6 text-orange" />
          Edi&rsquo;s Journal Store
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            to="/"
            className="text-sm font-medium text-cream/80 transition hover:text-white"
          >
            Beranda
          </Link>
          <Link
            to="/products"
            className="text-sm font-medium text-cream/80 transition hover:text-white"
          >
            Katalog
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="relative rounded-md p-2 transition hover:bg-navy-light"
            aria-label="Keranjang"
          >
            <ShoppingCart className="h-5 w-5" />
          </Link>

          {user ? (
            <div className="flex items-center gap-1">
              <span className="hidden max-w-[10rem] truncate text-sm font-medium sm:block">
                {user.name}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium transition hover:bg-navy-light"
                aria-label="Keluar"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                to="/login"
                className="rounded-md px-3 py-2 text-sm font-semibold text-cream transition hover:bg-navy-light"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-orange px-3 py-2 text-sm font-semibold text-navy-dark transition hover:bg-orange-dark"
              >
                Daftar
              </Link>
            </div>
          )}
        </div>
      </Container>
    </header>
  )
}
