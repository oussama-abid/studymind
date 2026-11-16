import { Link, Navigate, Route, Routes } from 'react-router'

import { useAuth } from './auth/AuthContext'
import BackendStatus from './components/BackendStatus'
import AuthPage from './pages/AuthPage'
import CoursePage from './pages/CoursePage'
import CoursesPage from './pages/CoursesPage'

function App() {
  const { user, logOut } = useAuth()

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between gap-4 border-b border-line bg-white px-8 py-4">
        <Link to="/" className="font-display text-2xl font-extrabold tracking-tight">
          StudyMind
        </Link>
        <div className="flex items-center gap-4">
          <BackendStatus />
          {user && (
            <>
              <span className="text-sm text-muted">{user.email}</span>
              <button type="button" onClick={logOut} className="btn-secondary">
                Log out
              </button>
            </>
          )}
        </div>
      </header>

      {user ? (
        <Routes>
          <Route path="/" element={<CoursesPage />} />
          <Route path="/courses/:courseId" element={<CoursePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </div>
  )
}

export default App
