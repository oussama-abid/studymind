import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

import { type Course, fetchCourse } from '../api/courses'
import ChatSection from '../components/ChatSection'
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
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link to="/" className="text-sm text-action hover:underline">
        ← All courses
      </Link>

      {status === 'loading' && <p className="mt-4 text-muted">Loading course...</p>}

      {status === 'error' && <p className="mt-4 text-red-600">Could not load this course.</p>}

      {status === 'ready' && course && (
        <>
          <h1 className="page-title mt-3">{course.title}</h1>
          {course.description && <p className="mt-2 text-lg text-muted">{course.description}</p>}
          <div className="mt-10 grid gap-10 lg:grid-cols-[320px_1fr]">
            <DocumentsSection courseId={course.id} />
            <ChatSection courseId={course.id} />
          </div>
        </>
      )}
    </main>
  )
}

export default CoursePage
