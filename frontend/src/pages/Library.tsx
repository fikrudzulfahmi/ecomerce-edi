import { useState } from 'react'
import { BookOpen, Download } from 'lucide-react'
import { useLibrary } from '../api/hooks'
import { getDownloadUrl } from '../api/library'
import { Container } from '../components/layout/Container'
import { Skeleton } from '../components/ui/Skeleton'

export function Library() {
  const { data: items, isLoading } = useLibrary()
  const [downloading, setDownloading] = useState<number | null>(null)

  const handleDownload = async (itemId: number) => {
    setDownloading(itemId)
    try {
      const url = await getDownloadUrl(itemId)
      window.open(url, '_blank')
    } finally {
      setDownloading(null)
    }
  }

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold">Pustaka Saya</h1>
      <p className="mt-1 text-sm text-ink-muted">E-book yang sudah kamu beli, bisa diunduh kapan saja.</p>

      {isLoading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : items && items.length > 0 ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-cream-darker bg-white p-4"
            >
              {item.image ? (
                <img src={item.image} alt={item.name} className="h-14 w-10 rounded object-cover" />
              ) : (
                <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded bg-cream-dark">
                  <BookOpen className="h-5 w-5 text-navy" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-navy">{item.name}</p>
                <p className="text-xs text-ink-muted">Order {item.order_code}</p>
              </div>
              <button
                onClick={() => handleDownload(item.id)}
                disabled={downloading === item.id}
                className="flex items-center gap-1.5 rounded-md bg-navy px-3 py-2 text-xs font-semibold text-white transition hover:bg-navy-dark disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" /> Unduh
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-12 rounded-lg border border-dashed border-cream-darker bg-white p-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-ink-muted" />
          <p className="mt-4 font-medium text-navy">Belum ada e-book</p>
          <p className="text-sm text-ink-muted">E-book yang kamu beli akan muncul di sini.</p>
        </div>
      )}
    </Container>
  )
}
