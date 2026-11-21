import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { fetchAuditLogs } from '../api/audit'
import type { AuditListParams } from '../api/audit'
import AuditDetailModal from '../components/AuditDetailModal'
import Pagination from '../components/Pagination'
import { EmptyState, ErrorState, Loader } from '../components/StateViews'
import type { AuditLog, AuditPagination } from '../types'
import { isCanceled, parseError } from '../utils/error'
import { formatDateTime } from '../utils/format'

type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; items: AuditLog[]; pagination: AuditPagination }

const FILTER_KEYS = ['action', 'targetTable', 'targetId', 'userId', 'from', 'to'] as const
const QUERY_KEYS = ['page', 'pageSize', ...FILTER_KEYS]

const ACTIONS = [
  'LOGIN',
  'LOGOUT',
  'CREATE_MENU',
  'UPDATE_MENU',
  'DELETE_MENU',
  'CREATE_STALL',
  'UPDATE_STALL',
  'DELETE_STALL',
  'CREATE_REVIEW',
  'DELETE_REVIEW',
]
const TABLES = ['USERS', 'MENU_ITEMS', 'STALLS', 'REVIEWS']

export default function AuditLogPage() {
  // Filter & halaman disimpan di URL: bisa di-refresh, dibagikan, dan tombol Back berfungsi
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.toString()
  const pageSize = searchParams.get('pageSize') ?? '20'

  // isi form (draft) terpisah dari filter yang sedang aktif, sampai tombol "Terapkan" ditekan
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(FILTER_KEYS.map((key) => [key, searchParams.get(key) ?? ''])),
  )
  const [state, setState] = useState<ListState>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const closeModal = useCallback(() => setSelectedId(null), [])

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })

    const current = new URLSearchParams(query)
    const params: AuditListParams = {}
    for (const key of QUERY_KEYS) {
      const value = current.get(key)
      if (value) params[key] = value
    }

    fetchAuditLogs(params, controller.signal)
      .then((data) => setState({ status: 'success', items: data.items, pagination: data.pagination }))
      .catch((error: unknown) => {
        if (!isCanceled(error)) setState({ status: 'error', message: parseError(error).detail })
      })

    return () => controller.abort()
  }, [query, reloadKey])

  function setDraftValue(key: string, value: string) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function applyFilters(event: FormEvent) {
    event.preventDefault()
    const next = new URLSearchParams()
    for (const key of FILTER_KEYS) {
      const value = draft[key].trim()
      if (value) next.set(key, value) // filter kosong tidak dikirim
    }
    next.set('pageSize', pageSize)
    setSearchParams(next) // halaman kembali ke 1
  }

  function resetFilters() {
    setDraft(Object.fromEntries(FILTER_KEYS.map((key) => [key, ''])))
    setSearchParams({ pageSize })
  }

  function changePage(page: number) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(page))
    setSearchParams(next)
  }

  function changePageSize(value: string) {
    const next = new URLSearchParams(searchParams)
    next.set('pageSize', value)
    next.delete('page')
    setSearchParams(next)
  }

  const hasFilter = FILTER_KEYS.some((key) => searchParams.get(key))

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Audit Log</h1>
          <p className="muted">Catatan aktivitas sistem. Hanya dapat dibaca oleh admin dan tidak dapat diubah.</p>
        </div>
      </div>

      <form className="card audit-filters" onSubmit={applyFilters}>
        <label>
          <span>Aksi</span>
          <select value={draft.action} onChange={(e) => setDraftValue('action', e.target.value)}>
            <option value="">Semua</option>
            {ACTIONS.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Tabel target</span>
          <select value={draft.targetTable} onChange={(e) => setDraftValue('targetTable', e.target.value)}>
            <option value="">Semua</option>
            {TABLES.map((table) => (
              <option key={table} value={table}>
                {table}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Target ID</span>
          <input
            inputMode="numeric"
            placeholder="mis. 1"
            value={draft.targetId}
            onChange={(e) => setDraftValue('targetId', e.target.value)}
          />
        </label>
        <label>
          <span>User ID</span>
          <input
            inputMode="numeric"
            placeholder="mis. 1"
            value={draft.userId}
            onChange={(e) => setDraftValue('userId', e.target.value)}
          />
        </label>
        <label>
          <span>Dari tanggal</span>
          <input type="date" value={draft.from} onChange={(e) => setDraftValue('from', e.target.value)} />
        </label>
        <label>
          <span>Sampai tanggal</span>
          <input type="date" value={draft.to} onChange={(e) => setDraftValue('to', e.target.value)} />
        </label>
        <label>
          <span>Per halaman</span>
          <select value={pageSize} onChange={(e) => changePageSize(e.target.value)}>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </label>
        <div className="audit-filter-actions">
          <button type="submit" className="btn btn-primary">
            Terapkan
          </button>
          <button type="button" className="btn btn-ghost" onClick={resetFilters}>
            Reset
          </button>
        </div>
      </form>

      {state.status === 'loading' && <Loader label="Memuat audit log..." />}

      {state.status === 'error' && (
        <ErrorState title="Gagal memuat audit log" message={state.message} onRetry={() => setReloadKey((k) => k + 1)} />
      )}

      {state.status === 'success' && state.items.length === 0 && (
        <EmptyState
          title="Tidak ada catatan audit"
          description={hasFilter ? 'Tidak ada catatan yang cocok dengan filter ini.' : 'Belum ada aktivitas yang tercatat.'}
          action={
            hasFilter ? (
              <button className="btn btn-primary" onClick={resetFilters}>
                Hapus filter
              </button>
            ) : undefined
          }
        />
      )}

      {state.status === 'success' && state.items.length > 0 && (
        <>
          <div className="card table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Waktu</th>
                  <th>Pengguna</th>
                  <th>Aksi</th>
                  <th>Target</th>
                  <th>Hasil</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {state.items.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td>{formatDateTime(item.createdAt)}</td>
                    <td>
                      <div>{item.userName}</div>
                      <div className="muted small">
                        {item.userEmail} · #{item.userId}
                      </div>
                    </td>
                    <td>
                      <span className="badge">{item.action}</span>
                    </td>
                    <td>
                      {item.targetTable} #{item.targetId}
                    </td>
                    <td>
                      {item.metadata?.result ? (
                        <span className={`badge badge-result-${item.metadata.result}`}>{item.metadata.result}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      <button className="btn btn-ghost" onClick={() => setSelectedId(item.id)}>
                        Detail
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            page={state.pagination.page}
            totalPages={state.pagination.totalPages}
            total={state.pagination.total}
            unit="catatan"
            onChange={changePage}
          />
        </>
      )}

      <AuditDetailModal id={selectedId} onClose={closeModal} />
    </section>
  )
}