import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAdminConversations, fetchAdminMessages, sendAdminMessage } from '../../api/admin'
import type { ChatMessage } from '../../lib/types'
import { Button } from '../../components/ui/Button'

export function AdminChat() {
  const [activeId, setActiveId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')

  const { data: conversations } = useQuery({
    queryKey: ['admin-conversations'],
    queryFn: fetchAdminConversations,
    refetchInterval: 5000,
  })

  useEffect(() => {
    if (!activeId) return
    const load = () => fetchAdminMessages(activeId).then(setMessages)
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [activeId])

  const send = async () => {
    const content = text.trim()
    if (!activeId || !content) return
    await sendAdminMessage(activeId, content)
    setMessages((prev) => [...prev, { id: Date.now(), sender: 'admin', content, created_at: null }])
    setText('')
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Pesan</h1>
      <p className="mt-1 text-sm text-ink-muted">Percakapan dengan pelanggan.</p>

      <div className="mt-6 flex h-[calc(100vh-11rem)] overflow-hidden rounded-2xl border border-cream-darker bg-white shadow-card">
        <aside className="w-72 shrink-0 border-r border-cream-darker">
          <p className="border-b border-cream-darker px-4 py-3 text-sm font-semibold">Percakapan</p>
          <div className="overflow-y-auto">
            {conversations?.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`flex w-full flex-col gap-1 border-b border-cream-darker/60 px-4 py-3 text-left text-sm transition ${
                  activeId === c.id ? 'bg-navy/5' : 'hover:bg-cream-dark'
                }`}
              >
                <span className="flex items-center justify-between">
                  <span className="font-medium text-ink">{c.user || 'Pelanggan'}</span>
                  {c.unread ? (
                    <span className="rounded-full bg-orange px-2 text-xs font-bold text-white">{c.unread}</span>
                  ) : null}
                </span>
                <span className="truncate text-xs text-ink-muted">{c.subject || 'Tanpa topik'}</span>
              </button>
            ))}
            {conversations?.length === 0 && (
              <p className="p-4 text-sm text-ink-muted">Belum ada pesan masuk.</p>
            )}
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          {activeId ? (
            <>
              <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                        m.sender === 'admin' ? 'bg-navy text-white' : 'bg-cream-dark text-ink'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-cream-darker p-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="Balas pesan..."
                  className="flex-1 rounded-full border border-cream-darker px-3 py-2 text-sm focus:border-navy focus:outline-none"
                />
                <Button onClick={send}>Kirim</Button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-sm text-ink-muted">
              Pilih percakapan untuk membalas pesan.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
