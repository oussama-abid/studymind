import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

import { type Course, fetchCourse } from '../api/courses'
import DocumentsSection from '../components/DocumentsSection'
function CoursePage() {
  const { courseId } = useParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')

  useEffect(() => {
    fetchCourse(Number(courseId))
      .then((data) => {
        setCourse(data)
        setStatus('ready')
      })
      .catch((error) => {
        console.error('Error loading course:', error)
        setStatus('error')
      })
  }, [courseId])

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link to="/" className="text-sm text-blue-600 hover:underline">
        ← All courses
      </Link>

      {status === 'loading' && <p className="mt-4 text-gray-500">Loading course...</p>}

      {status === 'error' && <p className="mt-4 text-red-600">Could not load this course.</p>}

      {status === 'ready' && course && (
        <>
          <h1 className="mt-4 text-2xl font-bold text-blue-600">{course.title}</h1>
          {course.description && <p className="mt-2 text-gray-600">{course.description}</p>}
          <DocumentsSection courseId={course.id} />
        </>
      )}
    </main>
  )
}

export default CoursePage
