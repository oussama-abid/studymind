const apiUrl = import.meta.env.VITE_API_URL


export type Course = {
    id: number,
    title: string,
    description: string | null,
    created_at: string,
    updated_at: string
}

export type CourseCreate = {
    title: string,
    description?: string
}

export async function fetchCourses(): Promise<Course[]> {
  const response = await fetch(`${apiUrl}/courses`)
  if (!response.ok) {
    throw new Error(`Error fetching courses: ${response.status}`)
  }
  return (await response.json()) as Course[]
}

export async function createCourse(course: CourseCreate): Promise<Course> {
  const response = await fetch(`${apiUrl}/courses`, {
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
  const response = await fetch(`${apiUrl}/courses/${id}`)
  if (!response.ok) {
    throw new Error(`Error fetching course ${id}: ${response.status}`)
  }
  return (await response.json()) as Course
}