import { Link } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { Container } from './Container'

const YEAR = new Date().getFullYear()

export function Footer() {
  return (
    <footer className="mt-auto border-t border-cream-darker bg-white">
      <Container className="py-8">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <p className="flex items-center gap-2 text-lg font-bold text-navy">
              <BookOpen className="h-5 w-5" />
              Edi&rsquo;s Journal Store
            </p>
            <p className="mt-2 text-sm text-ink-muted">Toko buku, alat tulis &amp; merchandise online.</p>
          </div>

          <div>
            <p className="font-semibold text-ink">Belanja</p>
            <ul className="mt-2 space-y-1.5 text-sm text-ink-muted">
              <li>
                <Link to="/products" className="transition hover:text-navy">
                  Katalog
                </Link>
              </li>
              <li>
                <Link to="/products?type=book" className="transition hover:text-navy">
                  Buku
                </Link>
              </li>
              <li>
                <Link to="/library" className="transition hover:text-navy">
                  Pustaka
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-ink">Akun</p>
            <ul className="mt-2 space-y-1.5 text-sm text-ink-muted">
              <li>
                <Link to="/orders" className="transition hover:text-navy">
                  Pesanan
                </Link>
              </li>
              <li>
                <Link to="/addresses" className="transition hover:text-navy">
                  Alamat
                </Link>
              </li>
              <li>
                <Link to="/cart" className="transition hover:text-navy">
                  Keranjang
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-8 border-t border-cream-darker pt-4 text-xs text-ink-muted">
          © {YEAR} Edi&rsquo;s Journal Store · by Bumi Production
        </p>
      </Container>
    </footer>
  )
}
