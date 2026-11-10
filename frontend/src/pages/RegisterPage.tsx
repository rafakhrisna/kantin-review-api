import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import Field from '../components/Field'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { parseError } from '../utils/error'

export default function RegisterPage() {
  const { user, register } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setFormError(null)
    setFieldErrors({})
    try {
      await register(name, email, password)
      notify('success', 'Registrasi berhasil. Silakan login.')
      navigate('/login', { state: { message: 'Akun berhasil dibuat. Silakan login dengan akun Anda.' } })
    } catch (error) {
      const parsed = parseError(error)
      setFieldErrors(parsed.fieldErrors)
      setFormError(parsed.message)
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <form className="card form" onSubmit={handleSubmit} noValidate>
        <h1>Daftar Akun</h1>
        <p className="muted">Akun baru otomatis berperan sebagai customer.</p>

        {formError && (
          <div className="alert alert-error" role="alert">
            {formError}
          </div>
        )}

        <Field label="Nama lengkap" error={fieldErrors.name} hint="3 – 100 karakter">
          <input value={name} autoComplete="name" onChange={(e) => setName(e.target.value)} />
        </Field>

        <Field label="Email" error={fieldErrors.email}>
          <input
            type="email"
            value={email}
            autoComplete="email"
            placeholder="nama@email.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Password" error={fieldErrors.password} hint="8 – 72 karakter">
          <input
            type="password"
            value={password}
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Memproses...' : 'Daftar'}
        </button>

        <p className="muted center">
          Sudah punya akun? <Link to="/login">Login</Link>
        </p>
      </form>
    </section>
  )
}