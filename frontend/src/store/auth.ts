import { create } from 'zustand'
import type { User } from '../lib/types'
import {
  clearStoredUser,
  clearToken,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from '../lib/token'
import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  type RegisterInput,
} from '../api/auth'

interface AuthState {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (input: RegisterInput) => Promise<void>
  logout: () => Promise<void>
  setAuth: (token: string, user: User) => void
  setUser: (user: User) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  token: getToken(),

  login: async (email, password) => {
    const res = await apiLogin(email, password)
    setToken(res.token)
    setStoredUser(res.data)
    set({ user: res.data, token: res.token })
  },

  register: async (input) => {
    const res = await apiRegister(input)
    setToken(res.token)
    setStoredUser(res.data)
    set({ user: res.data, token: res.token })
  },

  logout: async () => {
    try {
      await apiLogout()
    } finally {
      clearToken()
      clearStoredUser()
      set({ user: null, token: null })
    }
  },

  setAuth: (token, user) => {
    setToken(token)
    setStoredUser(user)
    set({ user, token })
  },

  setUser: (user) => {
    setStoredUser(user)
    set({ user })
  },

  clearAuth: () => {
    clearToken()
    clearStoredUser()
    set({ user: null, token: null })
  },
}))
