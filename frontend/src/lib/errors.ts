import axios from 'axios'
import type { ApiErrorPayload } from './types'

export function extractErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as ApiErrorPayload | undefined
    return payload?.message ?? 'Terjadi kesalahan. Silakan coba lagi.'
  }
  return 'Terjadi kesalahan. Silakan coba lagi.'
}
