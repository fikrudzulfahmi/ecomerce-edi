import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '../store/auth'
import { changePassword, updateProfile } from '../api/profile'
import { extractErrorMessage } from '../lib/errors'
import { Container } from '../components/layout/Container'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Alert } from '../components/ui/Alert'

export function Account() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const [name, setName] = useState(user?.name ?? '')
  const [phone, setPhone] = useState(user?.phone ?? '')
  const [profileMsg, setProfileMsg] = useState<string | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)

  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [pwdMsg, setPwdMsg] = useState<string | null>(null)
  const [pwdError, setPwdError] = useState<string | null>(null)

  const profileMutation = useMutation({
    mutationFn: () => updateProfile({ name, phone: phone.trim() || null }),
    onSuccess: (u) => {
      setUser(u)
      setProfileMsg('Profil berhasil disimpan.')
      setProfileError(null)
    },
    onError: (e) => {
      setProfileError(extractErrorMessage(e))
      setProfileMsg(null)
    },
  })

  const pwdMutation = useMutation({
    mutationFn: () =>
      changePassword({
        current_password: current || undefined,
        new_password: next,
        new_password_confirmation: confirm,
      }),
    onSuccess: () => {
      setPwdMsg('Kata sandi berhasil diubah.')
      setPwdError(null)
      setCurrent('')
      setNext('')
      setConfirm('')
    },
    onError: (e) => {
      setPwdError(extractErrorMessage(e))
      setPwdMsg(null)
    },
  })

  if (!user) return null

  const isPhoneOnly = user.email.endsWith('@wa.user')

  return (
    <Container className="py-10">
      <h1 className="text-2xl font-bold">Pengaturan Akun</h1>
      <p className="mt-1 text-sm text-ink-muted">Kelola profil dan keamanan akunmu.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-cream-darker bg-white p-6 shadow-card">
          <h2 className="text-lg font-bold">Profil</h2>
          {isPhoneOnly && (
            <p className="mt-3 rounded-lg bg-orange/10 px-3 py-2 text-xs leading-relaxed text-orange-dark">
              Akun ini terdaftar lewat WhatsApp. Tambahkan kata sandi di samping agar bisa login dengan email juga.
            </p>
          )}
          <div className="mt-4 space-y-3">
            <Input label="Email" value={user.email} disabled />
            <Input label="Nama" value={name} onChange={(e) => setName(e.target.value)} />
            <Input
              label="No. WhatsApp"
              type="tel"
              placeholder="08xxxxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {profileMsg && <Alert variant="success">{profileMsg}</Alert>}
            {profileError && <Alert variant="error">{profileError}</Alert>}
            <Button onClick={() => profileMutation.mutate()} loading={profileMutation.isPending}>
              Simpan Profil
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-cream-darker bg-white p-6 shadow-card">
          <h2 className="text-lg font-bold">Kata Sandi</h2>
          <div className="mt-4 space-y-3">
            {!isPhoneOnly && (
              <Input
                label="Kata sandi saat ini"
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
              />
            )}
            <Input
              label="Kata sandi baru"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
            <Input
              label="Konfirmasi kata sandi baru"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
            {pwdMsg && <Alert variant="success">{pwdMsg}</Alert>}
            {pwdError && <Alert variant="error">{pwdError}</Alert>}
            <Button variant="secondary" onClick={() => pwdMutation.mutate()} loading={pwdMutation.isPending}>
              Ganti Kata Sandi
            </Button>
          </div>
        </section>
      </div>
    </Container>
  )
}
