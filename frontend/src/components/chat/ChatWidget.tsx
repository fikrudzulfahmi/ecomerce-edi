import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'
import {
  createConversation,
  fetchConversations,
  fetchMessages,
  sendMessage,
} from '../../api/chat'
import type { ChatMessage, Conversation } from '../../lib/types'

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState('')
  const [subject, setSubject] = useState('')
  const [totalUnread, setTotalUnread] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const load = () =>
      fetchConversations().then((list) => {
        setConversations(list)
        setTotalUnread(list.reduce((n, c) => n + (c.unread ?? 0), 0))
      })
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [])

  const toggleOpen = () => {
    if (!open) {
      setOpen(true)
      if (activeId === null && conversations.length > 0) setActiveId(conversations[0].id)
    } else {
      setOpen(false)
    }
  }

  useEffect(() => {
    if (!activeId) return
    const load = () => fetchMessages(activeId).then(setMessages)
    load()
    const t = setInterval(load, 5000)
    return () => clearInterval(t)
  }, [activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    const content = text.trim()
    if (!content) return
    if (!activeId) {
      const c = await createConversation(content, subject.trim() || undefined)
      setActiveId(c.id)
      setConversations((prev) => [...prev, { id: c.id, subject: subject.trim() || null, last_message_at: null }])
    } else {
      await sendMessage(activeId, content)
      setMessages((prev) => [...prev, { id: Date.now(), sender: 'user', content, created_at: null }])
    }
    setText('')
  }

  return (
    <>
      <button
        onClick={toggleOpen}
        className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-navy text-white shadow-glow transition hover:bg-navy-dark"
        aria-label="Chat toko"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && totalUnread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange px-1 text-[11px] font-bold text-white">
            {totalUnread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[28rem] w-80 flex-col overflow-hidden rounded-2xl border border-cream-darker bg-white shadow-glow">
          <div className="bg-navy px-4 py-3 text-white">
            <p className="font-semibold">Chat Toko</p>
            <p className="text-xs text-white/70">Tanya stok, ongkir, atau produk</p>
          </div>

          {activeId === null && (
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className="flex w-full items-center justify-between rounded-lg border border-cream-darker px-3 py-2 text-left text-sm hover:bg-cream-dark"
                >
                  <span className="truncate">{c.subject || 'Percakapan'}</span>
                  {c.unread ? (
                    <span className="ml-2 rounded-full bg-orange px-2 text-xs font-bold text-white">{c.unread}</span>
                  ) : null}
                </button>
              ))}
              <div className="border-t border-cream-darker pt-2">
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Topik (opsional)"
                  className="mb-2 w-full rounded-lg border border-cream-darker px-3 py-2 text-sm focus:border-navy focus:outline-none"
                />
                <p className="text-xs text-ink-muted">Tulis pesan pertamamu di bawah 👇</p>
              </div>
            </div>
          )}

          {activeId !== null && (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                        m.sender === 'user' ? 'bg-navy text-white' : 'bg-cream-dark text-ink'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            </div>
          )}

          <div className="flex gap-2 border-t border-cream-darker p-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Tulis pesan..."
              className="flex-1 rounded-full border border-cream-darker px-3 py-2 text-sm focus:border-navy focus:outline-none"
            />
            <button
              onClick={send}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-white transition hover:bg-navy-dark"
              aria-label="Kirim"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
