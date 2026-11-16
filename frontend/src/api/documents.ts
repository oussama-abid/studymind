import { apiFetch } from './auth'
import { errorMessage } from './errors'

export type CourseDocument = {
  id: number
  course_id: number
  filename: string
  status: 'processing' | 'ready' | 'failed'
  error_message: string | null
  created_at: string
  updated_at: string
}

export type DocumentCreate = {
  course_id: number
  file: File
}

export async function fetchDocuments(courseId: number): Promise<CourseDocument[]> {
  const response = await apiFetch(`/courses/${courseId}/documents`)
  if (!response.ok) {
    throw new Error(await errorMessage(response, `Upload failed (error ${response.status})`))
  }
  return (await response.json()) as CourseDocument[]
}

export async function uploadDocument(upload: DocumentCreate): Promise<CourseDocument> {
  const formData = new FormData()
  formData.append('file', upload.file)

  const response = await apiFetch(`/courses/${upload.course_id}/documents`, {
    method: 'POST',
    body: formData,
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const detail = typeof body?.detail === 'string' ? body.detail : null
    throw new Error(detail ?? `Upload failed (error ${response.status})`)
  }
  return (await response.json()) as CourseDocument
}
