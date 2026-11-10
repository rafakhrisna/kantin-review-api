import type { ReactNode } from 'react'

export function Loader({ label = 'Memuat data...' }: { label?: string }) {
  return (
    <div className="state" role="status">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="state">
      <div className="state-icon">🍽️</div>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}

export function ErrorState({
  title = 'Gagal memuat data',
  message,
  onRetry,
}: {
  title?: string
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="state state-error" role="alert">
      <div className="state-icon">⚠️</div>
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          Coba lagi
        </button>
      )}
    </div>
  )
}