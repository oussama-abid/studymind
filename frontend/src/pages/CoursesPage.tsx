import { useEffect, useState } from 'react'
import { Link } from 'react-router'

import { type Course, createCourse, fetchCourses } from '../api/courses'

function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [status, setStatus] = useState<'loading' | 'error' | 'ready'>('loading')
  const [isModalOpen, setIsModalOpen] = useState(false)

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
    } catch (error) {
      console.error('Error creating course:', error)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
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
        <p className="text-muted">No courses yet. Create your first one!</p>
      )}

      {status === 'ready' && courses.length > 0 && (
        <ul className="flex flex-col gap-3">
          {courses.map((course) => (
            <li key={course.id}>
              <Link to={`/courses/${course.id}`} className="card block hover:border-ink">
                <h2 className="font-display text-xl font-bold">{course.title}</h2>
                {course.description && <p className="mt-1 text-muted">{course.description}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-ink/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-course-title"
            className="card w-full max-w-md"
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
