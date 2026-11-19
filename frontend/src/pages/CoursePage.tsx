import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'

import { type Course, fetchCourse } from '../api/courses'
import ChatSection from '../components/ChatSection'
import DocumentsSection from '../components/DocumentsSection'
import { usePageTitle } from '../usePageTitle'

function CoursePage() {
  const { courseId } = useParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  usePageTitle(course?.title ?? 'Course')

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
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link to="/" className="text-sm text-action hover:underline">
        ← All courses
      </Link>

      {status === 'loading' && <p className="mt-4 text-muted">Loading course...</p>}

      {status === 'error' && (
        <div className="card mt-6">
          <h1 className="font-display text-2xl font-bold">Course not found</h1>
          <p className="mt-2 text-muted">
            This course doesn't exist, or it belongs to another account.
          </p>
          <Link to="/" className="btn mt-4 inline-block">
            Back to your courses
          </Link>
        </div>
      )}

      {status === 'ready' && course && (
        <>
          <h1 className="page-title mt-3">{course.title}</h1>
          {course.description && <p className="mt-2 text-lg text-muted">{course.description}</p>}
          <div className="mt-8 grid grid-cols-1 gap-10 lg:mt-10 lg:grid-cols-[320px_minmax(0,1fr)]">
            <DocumentsSection courseId={course.id} />
            <ChatSection courseId={course.id} />
          </div>
        </>
      )}
    </main>
  )
}

export default CoursePage
