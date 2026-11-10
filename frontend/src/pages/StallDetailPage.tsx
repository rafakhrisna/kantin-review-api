import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deleteStall, fetchStall } from '../api/stalls'
import ConfirmDialog from '../components/ConfirmDialog'
import { EmptyState, ErrorState, Loader } from '../components/StateViews'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import type { Stall } from '../types'
import { isCanceled, parseError } from '../utils/error'

type DetailState =
  | { status: 'loading' }
  | { status: 'error'; message: string; notFound: boolean }
  | { status: 'success'; stall: Stall }

export default function StallDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { notify } = useToast()

  const [state, setState] = useState<DetailState>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    setState({ status: 'loading' })

    fetchStall(id, controller.signal)
      .then((stall) => setState({ status: 'success', stall }))
      .catch((error: unknown) => {
        if (isCanceled(error)) return
        const parsed = parseError(error)
        setState({ status: 'error', message: parsed.detail, notFound: parsed.status === 404 })
      })

    return () => controller.abort()
  }, [id, reloadKey])

  async function handleDelete(stall: Stall) {
    setDeleting(true)
    try {
      await deleteStall(stall.id)
      notify('success', `Warung "${stall.name}" berhasil dihapus.`)
      navigate('/')
    } catch (error) {
      notify('error', parseError(error).message)
      setConfirmOpen(false)
    } finally {
      setDeleting(false)
    }
  }

  if (state.status === 'loading') return <Loader label="Memuat detail warung..." />

  if (state.status === 'error') {
    return state.notFound ? (
      <EmptyState
        title="Warung tidak ditemukan"
        description="Warung yang Anda cari tidak ada atau sudah dihapus."
        action={
          <Link to="/" className="btn btn-primary">
            Kembali ke daftar
          </Link>
        }
      />
    ) : (
      <ErrorState message={state.message} onRetry={() => setReloadKey((k) => k + 1)} />
    )
  }

  const { stall } = state
  const canEdit = user?.role === 'admin' || (user?.role === 'owner' && user.id === stall.owner_id)
  const canDelete = user?.role === 'admin'

  return (
    <section>
      <Link to="/" className="back-link">
        ← Kembali ke daftar
      </Link>

      <article className="card detail">
        <div className="detail-head">
          <div>
            <h1>{stall.name}</h1>
            {stall.category && <span className="badge">{stall.category}</span>}
          </div>
          <div className="rating rating-lg">
            <span className="star">★</span> {Number(stall.avg_rating).toFixed(1)}
            <span className="muted"> ({stall.review_count} ulasan)</span>
          </div>
        </div>

        <dl className="detail-list">
          <div>
            <dt>Lokasi</dt>
            <dd>{stall.location ?? '-'}</dd>
          </div>
          <div>
            <dt>Deskripsi</dt>
            <dd>{stall.description ?? '-'}</dd>
          </div>
          <div>
            <dt>ID warung / ID pemilik</dt>
            <dd>
              #{stall.id} / #{stall.owner_id}
            </dd>
          </div>
          <div>
            <dt>Ditambahkan</dt>
            <dd>
              {new Date(stall.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </dd>
          </div>
        </dl>

        {(canEdit || canDelete) && (
          <div className="detail-actions">
            {canEdit && (
              <Link to={`/stalls/${stall.id}/edit`} className="btn btn-primary">
                Ubah
              </Link>
            )}
            {canDelete && (
              <button className="btn btn-danger" onClick={() => setConfirmOpen(true)}>
                Hapus
              </button>
            )}
          </div>
        )}
      </article>

      <ConfirmDialog
        open={confirmOpen}
        title="Hapus warung?"
        message={`Warung "${stall.name}" akan dihapus permanen dari database beserta data terkaitnya.`}
        busy={deleting}
        onConfirm={() => handleDelete(stall)}
        onCancel={() => setConfirmOpen(false)}
      />
    </section>
  )
}