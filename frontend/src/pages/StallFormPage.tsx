import { useEffect, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createStall, fetchStall, updateStall } from '../api/stalls'
import Field from '../components/Field'
import { ErrorState, Loader } from '../components/StateViews'
import { useToast } from '../context/ToastContext'
import type { StallInput } from '../types'
import { isCanceled, parseError } from '../utils/error'

interface FormValues {
  name: string
  category: string
  location: string
  description: string
}

const EMPTY: FormValues = { name: '', category: '', location: '', description: '' }

export default function StallFormPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { notify } = useToast()

  const [values, setValues] = useState<FormValues>(EMPTY)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>(id ? 'loading' : 'ready')
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    fetchStall(id, controller.signal)
      .then((stall) => {
        setValues({
          name: stall.name,
          category: stall.category ?? '',
          location: stall.location ?? '',
          description: stall.description ?? '',
        })
        setLoadState('ready')
      })
      .catch((error: unknown) => {
        if (isCanceled(error)) return
        setLoadError(parseError(error).detail)
        setLoadState('error')
      })
    return () => controller.abort()
  }, [id])

  function handleChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setFormError(null)
    setFieldErrors({})

    try {
      if (id) {
        const stall = await updateStall(id, {
          name: values.name.trim(),
          category: values.category.trim(),
          location: values.location.trim(),
          description: values.description.trim(),
        })
        notify('success', 'Warung berhasil diperbarui.')
        navigate(`/stalls/${stall.id}`)
      } else {
        const payload: StallInput = { name: values.name.trim() }
        if (values.category.trim()) payload.category = values.category.trim()
        if (values.location.trim()) payload.location = values.location.trim()
        if (values.description.trim()) payload.description = values.description.trim()
        const stall = await createStall(payload)
        notify('success', 'Warung berhasil ditambahkan.')
        navigate(`/stalls/${stall.id}`)
      }
    } catch (error) {
      const parsed = parseError(error)
      setFieldErrors(parsed.fieldErrors)
      setFormError(parsed.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loadState === 'loading') return <Loader label="Memuat data warung..." />
  if (loadState === 'error') return <ErrorState message={loadError} />

  return (
    <section className="form-page">
      <Link to={id ? `/stalls/${id}` : '/'} className="back-link">
        ← Batal
      </Link>

      <form className="card form" onSubmit={handleSubmit} noValidate>
        <h1>{id ? 'Ubah Warung' : 'Tambah Warung'}</h1>

        {formError && (
          <div className="alert alert-error" role="alert">
            {formError}
          </div>
        )}

        <Field label="Nama warung" error={fieldErrors.name} hint="3 – 100 karakter">
          <input name="name" value={values.name} onChange={handleChange} maxLength={100} />
        </Field>

        <Field label="Kategori" error={fieldErrors.category} hint="Contoh: Nasi, Mie, Minuman (maks. 50 karakter)">
          <input name="category" value={values.category} onChange={handleChange} maxLength={50} />
        </Field>

        <Field label="Lokasi" error={fieldErrors.location} hint="Contoh: Blok A No.1 (maks. 100 karakter)">
          <input name="location" value={values.location} onChange={handleChange} maxLength={100} />
        </Field>

        <Field label="Deskripsi" error={fieldErrors.description} hint="Maks. 1000 karakter">
          <textarea name="description" rows={4} value={values.description} onChange={handleChange} maxLength={1000} />
        </Field>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Menyimpan...' : id ? 'Simpan perubahan' : 'Tambah warung'}
          </button>
        </div>
      </form>
    </section>
  )
}