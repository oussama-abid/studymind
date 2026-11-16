import { apiFetch } from './auth'

export type Course = {
  id: number
  title: string
  description: string | null
  created_at: string
  updated_at: string
}

export type CourseCreate = {
  title: string
  description?: string
}

export async function fetchCourses(): Promise<Course[]> {
  const response = await apiFetch(`/courses`)
  if (!response.ok) {
    throw new Error(`Error fetching courses: ${response.status}`)
  }
  return (await response.json()) as Course[]
}

export async function createCourse(course: CourseCreate): Promise<Course> {
  const response = await apiFetch(`/courses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(course),
  })
  if (!response.ok) {
    throw new Error(`Error creating course: ${response.status}`)
  }
  return (await response.json()) as Course
}
export async function fetchCourse(id: number): Promise<Course> {
  const response = await apiFetch(`/courses/${id}`)
  if (!response.ok) {
    throw new Error(`Error fetching course ${id}: ${response.status}`)
  }
  return (await response.json()) as Course
}
