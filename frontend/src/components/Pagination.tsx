export default function Pagination({
  page,
  totalPages,
  total,
  onChange,
  unit = 'warung',
}: {
  page: number
  totalPages: number
  total: number
  onChange: (page: number) => void
  unit?: string
}) {
  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="btn btn-ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        ← Sebelumnya
      </button>
      <span>
        Halaman <strong>{page}</strong> dari <strong>{Math.max(totalPages, 1)}</strong> · {total} {unit}
      </span>
      <button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        Berikutnya →
      </button>
    </nav>
  )
}