import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { notify } = useToast()
  const navigate = useNavigate()
  const canCreate = user?.role === 'owner' || user?.role === 'admin'

  function handleLogout() {
    logout()
    notify('info', 'Anda telah logout.')
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          🍜 Kantin Review
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end>
            Warung
          </NavLink>
          {canCreate && <NavLink to="/stalls/new">+ Tambah Warung</NavLink>}
        </nav>
        <div className="nav-user">
          {user ? (
            <>
              <Link to="/profile" className="user-chip">
                {user.name} <span className={`badge badge-${user.role}`}>{user.role}</span>
              </Link>
              <button className="btn btn-ghost" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary">
                Daftar
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}