import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import Field from '../components/Field'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { parseError } from '../utils/error'

interface LocationState {
  from?: string
  message?: string
}

export default function LoginPage() {
  const { user, login } = useAuth()
  const { notify } = useToast()
  const location = useLocation()
  const state = location.state as LocationState | null

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to={state?.from ?? '/'} replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setFormError(null)
    setFieldErrors({})
    try {
      const loggedIn = await login(email, password)
      notify('success', `Selamat datang, ${loggedIn.name}!`)
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
        <h1>Login</h1>
        <p className="muted">Masuk untuk mengelola warung atau melihat profil Anda.</p>

        {state?.message && !formError && <div className="alert alert-info">{state.message}</div>}
        {formError && (
          <div className="alert alert-error" role="alert">
            {formError}
          </div>
        )}

        <Field label="Email" error={fieldErrors.email}>
          <input
            type="email"
            value={email}
            autoComplete="email"
            placeholder="nama@email.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Password" error={fieldErrors.password}>
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? 'Memproses...' : 'Login'}
        </button>

        <p className="muted center">
          Belum punya akun? <Link to="/register">Daftar di sini</Link>
        </p>
      </form>
    </section>
  )
}