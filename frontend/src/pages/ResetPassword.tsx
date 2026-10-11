import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { resetPassword } from '../api/auth'
import { extractErrorMessage } from '../lib/errors'
import { AuthCard } from '../components/layout/AuthCard'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const schema = z
  .object({
    password: z.string().min(8, 'Kata sandi minimal 8 karakter'),
    password_confirmation: z.string().min(1, 'Konfirmasi kata sandi wajib diisi'),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: 'Konfirmasi kata sandi tidak cocok',
    path: ['password_confirmation'],
  })

type Form = z.infer<typeof schema>

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    try {
      await resetPassword({
        token,
        email,
        password: values.password,
        password_confirmation: values.password_confirmation,
      })
      setDone(true)
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  })

  if (!token || !email) {
    return (
      <AuthCard title="Link Tidak Valid">
        <div className="flex flex-col gap-4 text-center">
          <Alert variant="error">Link reset kata sandi tidak valid.</Alert>
          <Link to="/forgot-password" className="text-sm font-semibold text-navy hover:underline">
            Minta link baru
          </Link>
        </div>
      </AuthCard>
    )
  }

  if (done) {
    return (
      <AuthCard title="Kata Sandi Diperbarui">
        <div className="flex flex-col gap-4 text-center">
          <Alert variant="success">Kata sandi berhasil diubah. Silakan masuk dengan kata sandi baru.</Alert>
          <Button type="button" onClick={() => navigate('/login', { replace: true })}>
            Ke Halaman Masuk
          </Button>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Atur Kata Sandi Baru" subtitle={`Untuk ${email}`}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {error && <Alert variant="error">{error}</Alert>}

        <Input
          label="Kata Sandi Baru"
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
          Simpan Kata Sandi Baru
        </Button>
      </form>
    </AuthCard>
  )
}
