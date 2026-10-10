import { BookOpen, ShoppingCart } from 'lucide-react'
import { Container } from './Container'

const links = [
  { label: 'Beranda', href: '#' },
  { label: 'Katalog', href: '#' },
  { label: 'Tentang', href: '#' },
]

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-navy text-cream shadow-sm">
      <Container className="flex h-16 items-center justify-between">
        <a href="#" className="flex items-center gap-2 font-serif text-lg font-bold">
          <BookOpen className="h-6 w-6 text-orange" />
          Edi&rsquo;s Journal Store
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-cream/80 transition hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="#"
          className="relative rounded-md p-2 transition hover:bg-navy-light"
          aria-label="Keranjang"
        >
          <ShoppingCart className="h-5 w-5" />
        </a>
      </Container>
    </header>
  )
}
