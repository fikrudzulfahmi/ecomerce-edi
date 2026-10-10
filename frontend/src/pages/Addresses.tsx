import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  useAddresses,
  useCreateAddress,
  useDeleteAddress,
  useUpdateAddress,
} from '../api/hooks'
import type { Address } from '../lib/types'
import { extractErrorMessage } from '../lib/errors'
import { Container } from '../components/layout/Container'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Alert } from '../components/ui/Alert'
import { Skeleton } from '../components/ui/Skeleton'

const schema = z.object({
  recipient: z.string().min(1, 'Nama penerima wajib diisi'),
  phone: z.string().min(1, 'No. telepon wajib diisi'),
  province: z.string().min(1, 'Provinsi wajib diisi'),
  city: z.string().min(1, 'Kota wajib diisi'),
  district: z.string().min(1, 'Kecamatan wajib diisi'),
  postal_code: z.string().min(1, 'Kode pos wajib diisi'),
  detail: z.string().min(1, 'Alamat lengkap wajib diisi'),
  is_default: z.boolean(),
})

type AddressForm = z.infer<typeof schema>

const emptyForm: AddressForm = {
  recipient: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  postal_code: '',
  detail: '',
  is_default: false,
}

export function Addresses() {
  const { data: addresses, isLoading } = useAddresses()
  const createAddress = useCreateAddress()
  const updateAddress = useUpdateAddress()
  const deleteAddress = useDeleteAddress()

  const [editing, setEditing] = useState<Address | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressForm>({
    resolver: zodResolver(schema),
    defaultValues: emptyForm,
  })

  const openCreate = () => {
    setEditing(null)
    reset(emptyForm)
    setShowForm(true)
  }

  const openEdit = (address: Address) => {
    setEditing(address)
    reset({
      recipient: address.recipient,
      phone: address.phone,
      province: address.province,
      city: address.city,
      district: address.district,
      postal_code: address.postal_code,
      detail: address.detail,
      is_default: address.is_default,
    })
    setShowForm(true)
  }

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    try {
      if (editing) {
        await updateAddress.mutateAsync({ id: editing.id, input: values })
      } else {
        await createAddress.mutateAsync(values)
      }
      setShowForm(false)
      setEditing(null)
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  })

  return (
    <Container className="py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Alamat</h1>
        <Button type="button" variant="secondary" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tambah Alamat
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={onSubmit}
          className="mt-6 rounded-lg border border-cream-darker bg-white p-5"
        >
          <h2 className="text-lg font-bold">{editing ? 'Edit Alamat' : 'Alamat Baru'}</h2>
          {error && (
            <div className="mt-3">
              <Alert variant="error">{error}</Alert>
            </div>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Input label="Nama Penerima" error={errors.recipient?.message} {...register('recipient')} />
            <Input label="No. Telepon" error={errors.phone?.message} {...register('phone')} />
            <Input label="Provinsi" error={errors.province?.message} {...register('province')} />
            <Input label="Kota/Kabupaten" error={errors.city?.message} {...register('city')} />
            <Input label="Kecamatan" error={errors.district?.message} {...register('district')} />
            <Input label="Kode Pos" error={errors.postal_code?.message} {...register('postal_code')} />
            <div className="sm:col-span-2">
              <Input label="Alamat Lengkap" error={errors.detail?.message} {...register('detail')} />
            </div>
            <label className="flex items-center gap-2 text-sm text-ink sm:col-span-2">
              <input
                type="checkbox"
                {...register('is_default')}
                className="h-4 w-4 rounded border-cream-darker text-navy focus:ring-navy"
              />
              Jadikan alamat utama
            </label>
          </div>

          <div className="mt-4 flex gap-2">
            <Button type="submit" loading={isSubmitting}>
              Simpan
            </Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>
              Batal
            </Button>
          </div>
        </form>
      )}

      <div className="mt-6 space-y-3">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : addresses && addresses.length > 0 ? (
          addresses.map((address) => (
            <div key={address.id} className="rounded-lg border border-cream-darker bg-white p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-navy" />
                  <div>
                    <p className="font-semibold text-navy">
                      {address.recipient}
                      {address.is_default && (
                        <span className="ml-2 rounded bg-cream-dark px-2 py-0.5 text-xs font-medium text-navy">
                          Utama
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-ink-muted">{address.phone}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(address)}
                    className="rounded p-2 text-ink-muted transition hover:bg-cream-dark hover:text-navy"
                    aria-label="Edit alamat"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAddress.mutate(address.id)}
                    className="rounded p-2 text-ink-muted transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Hapus alamat"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-ink">
                {address.detail}, {address.district}, {address.city}, {address.province}{' '}
                {address.postal_code}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-cream-darker bg-white p-10 text-center">
            <p className="font-medium text-navy">Belum ada alamat</p>
            <p className="mt-1 text-sm text-ink-muted">Tambahkan alamat pengiriman Anda.</p>
          </div>
        )}
      </div>
    </Container>
  )
}
