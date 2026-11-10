import { Link } from 'react-router-dom'
import type { Stall } from '../types'

export default function StallCard({ stall }: { stall: Stall }) {
  return (
    <Link to={`/stalls/${stall.id}`} className="card stall-card">
      <div className="stall-card-top">
        <h3>{stall.name}</h3>
        {stall.category && <span className="badge">{stall.category}</span>}
      </div>
      <p className="muted">📍 {stall.location ?? 'Lokasi belum diisi'}</p>
      <p className="stall-desc">{stall.description ?? 'Belum ada deskripsi.'}</p>
      <div className="rating">
        <span className="star">★</span> {Number(stall.avg_rating).toFixed(1)}
        <span className="muted"> ({stall.review_count} ulasan)</span>
      </div>
    </Link>
  )
}