import { useEffect, useState } from 'react'
import { fetchAuditLog } from '../api/audit'
import type { AuditLog } from '../types'
import { formatDateTime } from '../utils/format'
import { isCanceled, parseError } from '../utils/error'
import { ErrorState, Loader } from './StateViews'

type DetailState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; item: AuditLog }

// Memanggil GET /api/audit-logs/:id setiap kali dibuka (bukan memakai data dari daftar)
export default function AuditDetailModal({ id, onClose }: { id: number | null; onClose: () => void }) {
  const [state, setState] = useState<DetailState>({ status: 'loading' })

  useEffect(() => {
    if (id === null) return
    const controller = new AbortController()
    setState({ status: 'loading' })
    fetchAuditLog(id, controller.signal)
      .then((item) => setState({ status: 'success', item }))
      .catch((error: unknown) => {
        if (!isCanceled(error)) setState({ status: 'error', message: parseError(error).detail })
      })
    return () => controller.abort()
  }, [id])

  // Tombol Esc menutup modal
  useEffect(() => {
    if (id === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [id, onClose])

  if (id === null) return null

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal modal-wide" onClick={(event) => event.stopPropagation()}>
        <div className="modal-head">
          <h2>Detail Audit #{id}</h2>
          <button className="btn btn-ghost" onClick={onClose} aria-label="Tutup">
            ✕
          </button>
        </div>

        {state.status === 'loading' && <Loader label="Memuat detail audit..." />}
        {state.status === 'error' && <ErrorState title="Gagal memuat detail" message={state.message} />}

        {state.status === 'success' && (
          <>
            <dl className="detail-list detail-grid">
              <div>
                <dt>Waktu</dt>
                <dd>{formatDateTime(state.item.createdAt)}</dd>
              </div>
              <div>
                <dt>Aksi</dt>
                <dd>
                  <span className="badge">{state.item.action}</span>
                </dd>
              </div>
              <div>
                <dt>Pengguna</dt>
                <dd>
                  {state.item.userName} (#{state.item.userId})
                </dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{state.item.userEmail}</dd>
              </div>
              <div>
                <dt>Target</dt>
                <dd>
                  {state.item.targetTable} #{state.item.targetId}
                </dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{state.item.metadata?.role ?? '-'}</dd>
              </div>
              <div>
                <dt>Hasil</dt>
                <dd>{state.item.metadata?.result ?? '-'}</dd>
              </div>
              <div>
                <dt>IP address</dt>
                <dd>{state.item.metadata?.ip_address ?? '-'}</dd>
              </div>
              <div className="span-2">
                <dt>User agent</dt>
                <dd className="break">{state.item.metadata?.user_agent ?? '-'}</dd>
              </div>
            </dl>

            <h3 className="modal-sub">Metadata (JSON)</h3>
            <pre className="json-box">{JSON.stringify(state.item.metadata, null, 2)}</pre>
          </>
        )}
      </div>
    </div>
  )
}