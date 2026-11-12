import { Link, Route, Routes } from 'react-router'

import BackendStatus from './components/BackendStatus'

import CoursePage from './pages/CoursePage'
import CoursesPage from './pages/CoursesPage'
function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex items-center justify-between bg-white px-6 py-3 shadow">
        <Link to="/" className="text-xl font-bold text-blue-600">
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