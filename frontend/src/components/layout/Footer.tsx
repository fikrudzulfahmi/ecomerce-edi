import { BookOpen } from 'lucide-react'
import { Container } from './Container'

export function Footer() {
  return (
    <footer className="mt-auto bg-navy-dark text-cream/80">
      <Container className="flex flex-col items-center justify-between gap-4 py-8 md:flex-row">
        <div className="flex items-center gap-2 font-serif text-lg font-bold text-cream">
          <BookOpen className="h-5 w-5 text-orange" />
          Edi&rsquo;s Journal Store
        </div>
        <p className="text-sm">Toko buku &amp; alat tulis online.</p>
        <p className="text-xs text-cream/60">by Bumi Production</p>
      </Container>
    </footer>
  )
}
