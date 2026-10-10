import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuthStore } from '../store/auth'
import { extractErrorMessage } from '../lib/errors'
import { AuthCard } from '../components/layout/AuthCard'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const schema = z
  .object({
    name: z.string().min(2, 'Nama minimal 2 karakter').max(255, 'Nama terlalu panjang'),
    email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
    phone: z.string().max(20, 'Nomor telepon terlalu panjang').optional().or(z.literal('')),
    password: z.string().min(8, 'Kata sandi minimal 8 karakter'),
    password_confirmation: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['password_confirmation'],
  })

type RegisterForm = z.infer<typeof schema>

export function Register() {
  const registerUser = useAuthStore((s) => s.register)
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterForm>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null)
    try {
      await registerUser({
        name: values.name,
        email: values.email,
        phone: values.phone?.trim() || undefined,
        password: values.password,
        password_confirmation: values.password_confirmation,
      })
      navigate('/verify-email?status=sent', { replace: true })
    } catch (error) {
      setServerError(extractErrorMessage(error))
    }
  })

  return (
    <AuthCard title="Daftar" subtitle="Buat akun untuk mulai berbelanja">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {serverError && <Alert variant="error">{serverError}</Alert>}

        <Input
          label="Nama Lengkap"
          autoComplete="name"
          placeholder="Nama Anda"
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="No. Telepon (opsional)"
          type="tel"
          autoComplete="tel"
          placeholder="08xxxxxxxxxx"
          error={errors.phone?.message}
          {...register('phone')}
        />

        <Input
          label="Kata Sandi"
          type="password"
          autoComplete="new-password"
          placeholder="Minimal 8 karakter"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Konfirmasi Kata Sandi"
          type="password"
          autoComplete="new-password"
          placeholder="Ulangi kata sandi"
          error={errors.password_confirmation?.message}
          {...register('password_confirmation')}
        />

        <Button type="submit" loading={isSubmitting} className="w-full">
          Daftar
        </Button>

        <p className="text-center text-sm text-ink-muted">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-semibold text-navy hover:underline">
            Masuk
          </Link>
        </p>
      </form>
    </AuthCard>
  )
}
