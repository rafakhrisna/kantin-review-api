import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import RequireAuth from './components/RequireAuth'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import RegisterPage from './pages/RegisterPage'
import StallDetailPage from './pages/StallDetailPage'
import StallFormPage from './pages/StallFormPage'
import StallListPage from './pages/StallListPage'
import { NotFoundPage } from './pages/StatusPages'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Navbar />
          <main className="container">
            <Routes>
              {/* Publik */}
              <Route path="/" element={<StallListPage />} />
              <Route path="/stalls/:id" element={<StallDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Harus login (semua role) */}
              <Route element={<RequireAuth />}>
                <Route path="/profile" element={<ProfilePage />} />
              </Route>

              {/* Hanya owner & admin */}
              <Route element={<RequireAuth roles={['owner', 'admin']} />}>
                <Route path="/stalls/new" element={<StallFormPage />} />
                <Route path="/stalls/:id/edit" element={<StallFormPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </main>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}