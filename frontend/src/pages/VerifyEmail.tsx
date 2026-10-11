import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { MailCheck, ShieldCheck, MailX } from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { resendVerification } from '../api/auth'
import { AuthCard } from '../components/layout/AuthCard'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'

type Status = 'verified' | 'already' | 'invalid' | 'sent'

const content: Record<
  Status,
  { title: string; message: string; icon: typeof MailCheck; variant: 'success' | 'info' | 'error' }
> = {
  verified: {
    title: 'Email Terverifikasi',
    message: 'Email Anda berhasil diverifikasi. Sekarang Anda bisa berbelanja!',
    icon: ShieldCheck,
    variant: 'success',
  },
  already: {
    title: 'Email Sudah Terverifikasi',
    message: 'Email ini sudah pernah diverifikasi sebelumnya.',
    icon: MailCheck,
    variant: 'info',
  },
  invalid: {
    title: 'Link Tidak Valid',
    message: 'Link verifikasi tidak valid atau sudah kedaluwarsa. Silakan kirim ulang.',
    icon: MailX,
    variant: 'error',
  },
  sent: {
    title: 'Cek Email Anda',
    message: 'Kami sudah mengirim link verifikasi ke email Anda. Silakan klik link tersebut.',
    icon: MailCheck,
    variant: 'info',
  },
}

export function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const status = (searchParams.get('status') as Status | null) ?? 'sent'
  const user = useAuthStore((s) => s.user)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const info = content[status]
  const Icon = info.icon

  const handleResend = async () => {
    setError(null)
    try {
      await resendVerification()
      setSent(true)
    } catch {
      setError('Gagal mengirim ulang. Coba beberapa saat lagi.')
    }
  }

  return (
    <AuthCard title={info.title}>
      <div className="flex flex-col items-center gap-4 text-center">
        <Icon className={`h-14 w-14 ${info.variant === 'error' ? 'text-red-500' : info.variant === 'success' ? 'text-green-600' : 'text-navy'}`} />

        <p className="text-sm text-ink-muted">{info.message}</p>

        {status === 'sent' && user && !sent && (
          <Button type="button" variant="secondary" onClick={handleResend}>
            Kirim Ulang Link
          </Button>
        )}

        {sent && <Alert variant="success">Link verifikasi baru sudah dikirim.</Alert>}
        {error && <Alert variant="error">{error}</Alert>}

        <Link to="/" className="text-sm font-semibold text-navy hover:underline">
          Kembali ke Beranda
        </Link>
      </div>
    </AuthCard>
  )
}
