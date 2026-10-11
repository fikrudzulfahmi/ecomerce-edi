import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { me } from '../api/auth'
import { setToken } from '../lib/token'
import { useAuthStore } from '../store/auth'
import { Container } from '../components/layout/Container'
import { Spinner } from '../components/ui/Spinner'

export function AuthCallback() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [failed, setFailed] = useState(false)

  const token = new URLSearchParams(window.location.search).get('token')

  useEffect(() => {
    if (!token) return
    setToken(token)
    me()
      .then((user) => {
        setAuth(token, user)
        navigate('/', { replace: true })
      })
      .catch(() => setFailed(true))
  }, [token, navigate, setAuth])

  if (!token || failed) {
    return (
      <Container className="py-16 text-center">
        <h1 className="text-xl font-bold">Gagal masuk</h1>
        <p className="mt-2 text-sm text-ink-muted">Terjadi kesalahan saat login dengan Google.</p>
        <a href="/login" className="mt-4 inline-block font-semibold text-navy hover:underline">
          Kembali ke Masuk
        </a>
      </Container>
    )
  }

  return (
    <Container className="flex flex-col items-center justify-center py-24">
      <Spinner className="h-8 w-8 text-navy" />
      <p className="mt-4 text-sm text-ink-muted">Menyelesaikan login...</p>
    </Container>
  )
}
