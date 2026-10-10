import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '../store/auth'
import { addCartItem } from '../api/cart'
import { clearCartIntent, getCartIntent } from '../lib/intent'
import { extractErrorMessage } from '../lib/errors'
import { AuthCard } from '../components/layout/AuthCard'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const schema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
})

type LoginForm = z.infer<typeof schema>

export function Login() {
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      await login(values.email, values.password)

      const intent = getCartIntent()
      if (intent) {
        clearCartIntent()
        try {
          await addCartItem(intent.productId, intent.qty)
        } catch {
          // abaikan — pengguna bisa menambah manual
        }
        navigate(intent.returnTo, { replace: true })
        return
      }

      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'
      navigate(from, { replace: true })
    } catch (error) {
      setServerError(extractErrorMessage(error))
    }
  })

  return (
    <AuthCard title="Masuk" subtitle="Selamat datang kembali!">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {serverError && <Alert variant="error">{serverError}</Alert>}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Kata Sandi"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-medium text-navy hover:underline">
            Lupa kata sandi?
          </Link>
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full">
          Masuk
        </Button>

        <p className="text-center text-sm text-ink-muted">
          Belum punya akun?{' '}
          <Link to="/register" className="font-semibold text-navy hover:underline">
            Daftar
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}
