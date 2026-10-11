import api from './client'
import type { ChatMessage, Conversation } from '../lib/types'

export async function fetchConversations(): Promise<Conversation[]> {
  const { data } = await api.get<{ data: Conversation[] }>('/chat/conversations')
  return data.data
}

export async function createConversation(content: string, subject?: string): Promise<{ id: number }> {
  const { data } = await api.post<{ data: { id: number } }>('/chat/conversations', {
    content,
    subject,
  })
  return data.data
}

export async function fetchMessages(conversationId: number): Promise<ChatMessage[]> {
  const { data } = await api.get<{ data: ChatMessage[] }>(
    `/chat/conversations/${conversationId}/messages`,
  )
  return data.data
}

export async function sendMessage(conversationId: number, content: string): Promise<ChatMessage> {
  const { data } = await api.post<{ data: ChatMessage }>(
    `/chat/conversations/${conversationId}/messages`,
    { content },
  )
  return data.data
}
