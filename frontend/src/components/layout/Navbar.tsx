import { Link, useNavigate } from 'react-router-dom'
import { BookOpen, LogOut, ShoppingCart } from 'lucide-react'
import { Container } from './Container'
import { useAuthStore } from '../../store/auth'
import { useCart } from '../../api/hooks'

export function Navbar() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const { data: cart } = useCart()
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
          {user && (
            <Link
              to="/orders"
              className="text-sm font-medium text-cream/80 transition hover:text-white"
            >
              Pesanan
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/cart"
            className="relative rounded-md p-2 transition hover:bg-navy-light"
            aria-label="Keranjang"
          >
            <ShoppingCart className="h-5 w-5" />
            {cart && cart.total_items > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange px-1 text-xs font-bold text-navy-dark">
                {cart.total_items}
              </span>
            )}
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
