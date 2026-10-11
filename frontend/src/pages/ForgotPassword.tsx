import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { forgotPassword } from '../api/auth'
import { extractErrorMessage } from '../lib/errors'
import { AuthCard } from '../components/layout/AuthCard'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const schema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
})

type Form = z.infer<typeof schema>

export function ForgotPassword() {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    try {
      await forgotPassword(values.email)
      setSent(true)
    } catch (error) {
      setError(extractErrorMessage(error))
    }
  })

  if (sent) {
    return (
      <AuthCard title="Cek Email Anda">
        <div className="flex flex-col gap-4 text-center">
          <Alert variant="success">Link reset kata sandi sudah dikirim ke email Anda.</Alert>
          <Link to="/login" className="text-sm font-semibold text-navy hover:underline">
            Kembali ke halaman Masuk
          </Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard title="Lupa Kata Sandi" subtitle="Masukkan email untuk menerima link reset">
      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        {error && <Alert variant="error">{error}</Alert>}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="nama@email.com"
          error={errors.email?.message}
          {...register('email')}
        />

        <Button type="submit" loading={isSubmitting} className="w-full">
          Kirim Link Reset
        </Button>

        <Link to="/login" className="text-center text-sm font-medium text-navy hover:underline">
          Kembali ke halaman Masuk
        </Link>
      </form>
    </AuthCard>
  )
}
