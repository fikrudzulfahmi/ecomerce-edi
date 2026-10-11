import axios from 'axios'
import { clearStoredUser, clearToken, getToken } from '../lib/token'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

const api = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: {
    Accept: 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token kedaluwarsa / tidak valid → logout & arahkan ke login.
    if (error.response?.status === 401 && getToken()) {
      clearToken()
      clearStoredUser()
      if (window.location.pathname !== '/login') {
        window.location.assign('/login')
      }
    }
    return Promise.reject(error)
  },
)

export default api
