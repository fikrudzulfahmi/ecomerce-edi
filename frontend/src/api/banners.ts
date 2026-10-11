import api from './client'
import type { Banner } from '../lib/types'

export async function fetchBanners(): Promise<Banner[]> {
  const { data } = await api.get<{ data: Banner[] }>('/banners')
  return data.data
}
