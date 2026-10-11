import api from './client'
import type { LibraryItem } from '../lib/types'

export async function fetchLibrary(): Promise<LibraryItem[]> {
  const { data } = await api.get<{ data: LibraryItem[] }>('/library')
  return data.data
}

export async function getDownloadUrl(itemId: number): Promise<string> {
  const { data } = await api.get<{ url: string }>(`/library/items/${itemId}/download-url`)
  return data.url
}
