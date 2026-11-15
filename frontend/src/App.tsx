import { Link, Route, Routes } from 'react-router'

import BackendStatus from './components/BackendStatus'
import CoursePage from './pages/CoursePage'
import CoursesPage from './pages/CoursesPage'

function App() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between border-b border-line bg-white px-8 py-4">
        <Link to="/" className="font-display text-2xl font-extrabold tracking-tight">
          StudyMind
        </Link>
        <BackendStatus />
      </header>

      <Routes>
        <Route path="/" element={<CoursesPage />} />
        <Route path="/courses/:courseId" element={<CoursePage />} />
      </Routes>
    </div>
  )
}

export default App
