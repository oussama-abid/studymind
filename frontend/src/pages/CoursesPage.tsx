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
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-600">My courses</h1>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          + New course
        </button>
      </div>

      {status === 'loading' && <p className="text-gray-500">Loading courses...</p>}

      {status === 'error' && (
        <p className="text-red-600">Could not load your courses. Please try again later.</p>
      )}

      {status === 'ready' && courses.length === 0 && (
        <p className="text-gray-500">No courses yet. Create your first one!</p>
      )}

      {status === 'ready' && courses.length > 0 && (
        <ul className="flex flex-col gap-3">
          {courses.map((course) => (
            <li key={course.id}>
              <Link
                to={`/courses/${course.id}`}
                className="block rounded-lg bg-white p-4 shadow hover:bg-blue-50"
              >
                <h2 className="font-semibold">{course.title}</h2>
                {course.description && (
                  <p className="text-sm text-gray-600">{course.description}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-course-title"
            className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg"
          >
            <h2 id="new-course-title" className="mb-4 text-xl font-bold">
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
                  className="rounded border px-3 py-2"
                />
              </label>
              <label className="flex flex-col gap-1">
                Description
                <textarea
                  name="description"
                  placeholder="Description (optional)"
                  maxLength={500}
                  rows={3}
                  className="rounded border px-3 py-2"
                />
              </label>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded px-4 py-2 text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                >
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
