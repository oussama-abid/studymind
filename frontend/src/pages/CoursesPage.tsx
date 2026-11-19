import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { type Course, createCourse, fetchCourses } from '../api/courses'
import { useToast } from '../toast/ToastContext'
import { usePageTitle } from '../usePageTitle'

// "19 Nov 2026", or null when the date is missing or invalid
function formatDate(value: string): string | null {
  const date = new Date(value)
  if (!value || Number.isNaN(date.getTime())) return null
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { showToast } = useToast()
  usePageTitle('My courses')

  useEffect(() => {
    fetchCourses()
      .then((data) => {
        setCourses(data)
        setStatus('ready')
      })
      .catch((error) => {
        console.error('Error loading courses:', error)
        setStatus('error')
      })
  }, [])

  async function createNewCourse(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const title = String(formData.get('title'))
    const description = String(formData.get('description'))

    try {
      const newCourse = await createCourse({
        title,
        description: description || undefined, // empty text → no description
      })
      setCourses([newCourse, ...courses]) // new array, newest first
      setIsModalOpen(false) // the form disappears, so no reset needed
      showToast(`Course "${newCourse.title}" created. Upload a PDF to start.`)
    } catch (error) {
      console.error('Error creating course:', error)
      showToast('Could not create the course. Please try again.', 'error')
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="page-title">My courses</h1>
        <button type="button" onClick={() => setIsModalOpen(true)} className="btn">
          + New course
        </button>
      </div>

      {status === 'loading' && <p className="text-muted">Loading courses...</p>}

      {status === 'error' && (
        <p className="text-red-600">Could not load your courses. Please try again later.</p>
      )}

      {status === 'ready' && courses.length === 0 && (
        <div className="card flex animate-enter flex-col items-start gap-3 border-dashed p-8">
          <p className="font-display text-2xl font-bold">No courses yet. Create your first one!</p>
          <p className="max-w-prose text-muted">
            A course collects the PDFs of one subject, for example the slides and script of your
            Databases lecture. Then you can ask questions about all of them at once.
          </p>
          <button type="button" onClick={() => setIsModalOpen(true)} className="btn mt-2">
            Create a course
          </button>
        </div>
      )}

      {status === 'ready' && courses.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {courses.map((course) => {
            const changed = formatDate(course.updated_at)
            return (
              <li key={course.id} className="animate-enter">
                <Link
                  to={`/courses/${course.id}`}
                  className="card flex h-full flex-col transition duration-150 hover:-translate-y-0.5 hover:border-ink hover:shadow-md"
                >
                  <h2 className="font-display text-xl font-bold">{course.title}</h2>
                  {course.description && (
                    <p className="mt-1 line-clamp-2 text-muted">{course.description}</p>
                  )}
                  {changed && <p className="mt-auto pt-4 text-sm text-muted">Changed {changed}</p>}
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-ink/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-course-title"
            className="card w-full max-w-md animate-enter"
          >
            <h2 id="new-course-title" className="mb-4 font-display text-2xl font-bold">
              New course
            </h2>
            <form onSubmit={createNewCourse} className="flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                Title
                <input
                  type="text"
                  name="title"
                  placeholder="Course name"
                  required
                  maxLength={200}
                  autoFocus
                  className="input"
                />
              </label>
              <label className="flex flex-col gap-1">
                Description
                <textarea
                  name="description"
                  placeholder="Description (optional)"
                  maxLength={500}
                  rows={3}
                  className="input"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}

export default CoursesPage
