import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { fetchStalls } from '../api/stalls'
import type { StallListParams } from '../api/stalls'
import { EmptyState, ErrorState, Loader } from '../components/StateViews'
import Pagination from '../components/Pagination'
import StallCard from '../components/StallCard'
import { useAuth } from '../context/AuthContext'
import type { Pagination as PaginationInfo, Stall } from '../types'
import { isCanceled, parseError } from '../utils/error'

type ListState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; stalls: Stall[]; pagination: PaginationInfo }

export default function StallListPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()

  const search = searchParams.get('search') ?? ''
  const category = searchParams.get('category') ?? ''
  const page = Number(searchParams.get('page') ?? '1')
  const limit = Number(searchParams.get('limit') ?? '6')

  const [searchInput, setSearchInput] = useState(search)
  const [categoryInput, setCategoryInput] = useState(category)
  const [state, setState] = useState<ListState>({ status: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setState({ status: 'loading' })

    const params: StallListParams = { page, limit }
    if (search) params.search = search
    if (category) params.category = category

    fetchStalls(params, controller.signal)
      .then((res) => setState({ status: 'success', stalls: res.data, pagination: res.pagination }))
      .catch((error: unknown) => {
        if (!isCanceled(error)) setState({ status: 'error', message: parseError(error).detail })
      })

    return () => controller.abort()
  }, [search, category, page, limit, reloadKey])

  function applyFilters(event: FormEvent) {
    event.preventDefault()
    const next = new URLSearchParams()
    if (searchInput.trim()) next.set('search', searchInput.trim())
    if (categoryInput.trim()) next.set('category', categoryInput.trim())
    next.set('limit', String(limit))
    setSearchParams(next)
  }

  function resetFilters() {
    setSearchInput('')
    setCategoryInput('')
    setSearchParams({ limit: String(limit) })
  }

  function changePage(nextPage: number) {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  function changeLimit(nextLimit: string) {
    const next = new URLSearchParams(searchParams)
    next.set('limit', nextLimit)
    next.delete('page')
    setSearchParams(next)
  }

  const hasFilter = search !== '' || category !== ''
  const canCreate = user?.role === 'owner' || user?.role === 'admin'

  return (
    <section>
      <div className="page-head">
        <div>
          <h1>Daftar Warung</h1>
          <p className="muted">Temukan warung favoritmu di kantin dan lihat ulasannya.</p>
        </div>
        {canCreate && (
          <Link to="/stalls/new" className="btn btn-primary">
            + Tambah Warung
          </Link>
        )}
      </div>

      <form className="filters" onSubmit={applyFilters}>
        <input
          type="search"
          placeholder="Cari nama warung..."
          value={searchInput}
          maxLength={100}
          onChange={(e) => setSearchInput(e.target.value)}
        />
        <input
          list="category-options"
          placeholder="Kategori (mis. Nasi)"
          value={categoryInput}
          maxLength={50}
          onChange={(e) => setCategoryInput(e.target.value)}
        />
        <datalist id="category-options">
          <option value="Nasi" />
          <option value="Mie" />
          <option value="Minuman" />
          <option value="Bakso" />
          <option value="Soto" />
        </datalist>
        <select value={limit} onChange={(e) => changeLimit(e.target.value)} aria-label="Jumlah per halaman">
          <option value={3}>3 / halaman</option>
          <option value={6}>6 / halaman</option>
          <option value={12}>12 / halaman</option>
        </select>
        <button type="submit" className="btn btn-primary">
          Cari
        </button>
        {hasFilter && (
          <button type="button" className="btn btn-ghost" onClick={resetFilters}>
            Reset
          </button>
        )}
      </form>

      {state.status === 'loading' && <Loader label="Memuat daftar warung..." />}

      {state.status === 'error' && (
        <ErrorState message={state.message} onRetry={() => setReloadKey((k) => k + 1)} />
      )}

      {state.status === 'success' && state.stalls.length === 0 && (
        <EmptyState
          title={hasFilter ? 'Tidak ada warung yang cocok' : 'Belum ada warung'}
          description={
            hasFilter
              ? 'Coba ubah kata kunci atau kategori pencarian.'
              : 'Data warung masih kosong. Warung yang ditambahkan akan muncul di sini.'
          }
          action={
            hasFilter ? (
              <button className="btn btn-primary" onClick={resetFilters}>
                Hapus filter
              </button>
            ) : undefined
          }
        />
      )}

      {state.status === 'success' && state.stalls.length > 0 && (
        <>
          <div className="grid">
            {state.stalls.map((stall) => (
              <StallCard key={stall.id} stall={stall} />
            ))}
          </div>
          <Pagination
            page={state.pagination.page}
            totalPages={state.pagination.totalPages}
            total={state.pagination.total}
            onChange={changePage}
          />
        </>
      )}
    </section>
  )
}