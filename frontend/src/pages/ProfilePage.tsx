import { useEffect, useState } from 'react'
import { meRequest } from '../api/auth'
import { ErrorState, Loader } from '../components/StateViews'
import type { Role, User } from '../types'
import { isCanceled, parseError } from '../utils/error'

const ABILITIES: Record<Role, string[]> = {
  admin: [
    'Melihat daftar dan detail warung',
    'Menambah warung',
    'Mengubah warung mana pun',
    'Menghapus warung',
  ],
  owner: [
    'Melihat daftar dan detail warung',
    'Menambah warung',
    'Mengubah warung milik sendiri',
    'Tidak dapat menghapus warung (hanya admin)',
  ],
  customer: [
    'Melihat daftar dan detail warung',
    'Tidak memiliki akses pengelolaan warung',
  ],
}

type ProfileState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; user: User }

export default function ProfilePage() {
  const [state, setState] = useState<ProfileState>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })
    meRequest(controller.signal)
      .then((user) => setState({ status: 'success', user }))
      .catch((error: unknown) => {
        if (!isCanceled(error)) setState({ status: 'error', message: parseError(error).detail })
      })
    return () => controller.abort()
  }, [reloadKey])

  if (state.status === 'loading') return <Loader label="Memuat profil..." />
  if (state.status === 'error') {
    return <ErrorState title="Gagal memuat profil" message={state.message} onRetry={() => setReloadKey((k) => k + 1)} />
  }

  const { user } = state
  return (
    <section className="profile">
      <h1>Profil Saya</h1>
      <div className="card">
        <div className="avatar">{user.name.charAt(0).toUpperCase()}</div>
        <dl className="detail-list">
          <div>
            <dt>Nama</dt>
            <dd>{user.name}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>
              <span className={`badge badge-${user.role}`}>{user.role}</span>
            </dd>
          </div>
          <div>
            <dt>ID pengguna</dt>
            <dd>#{user.id}</dd>
          </div>
        </dl>
      </div>

      <div className="card">
        <h2>Hak akses role “{user.role}”</h2>
        <ul className="ability-list">
          {ABILITIES[user.role].map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}