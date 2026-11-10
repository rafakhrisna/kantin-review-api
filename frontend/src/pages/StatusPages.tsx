import { Link } from 'react-router-dom'

export function ForbiddenPage() {
  return (
    <div className="state state-error">
      <div className="state-icon">⛔</div>
      <h2>403 – Akses ditolak</h2>
      <p>Anda sudah login, tetapi role akun Anda tidak memiliki izin untuk membuka halaman ini.</p>
      <Link to="/" className="btn btn-primary">
        Kembali ke daftar warung
      </Link>
    </div>
  )
}

export function NotFoundPage() {
  return (
    <div className="state">
      <div className="state-icon">🔎</div>
      <h2>404 – Halaman tidak ditemukan</h2>
      <p>Alamat yang Anda buka tidak tersedia.</p>
      <Link to="/" className="btn btn-primary">
        Kembali ke daftar warung
      </Link>
    </div>
  )
}