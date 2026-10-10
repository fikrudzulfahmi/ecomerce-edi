import { Container } from './components/layout/Container'
import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'

function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Container className="py-16 text-center">
          <h1 className="text-4xl font-bold">
            Selamat datang di Edi&rsquo;s Journal Store
          </h1>
          <p className="mt-4 text-ink-muted">
            Tempat terbaik untuk buku, alat tulis, dan merchandise.
          </p>
        </Container>
      </main>
      <Footer />
    </div>
  )
}

export default App
