import { apiFetch } from './auth'
import { errorMessage } from './errors'

export type Source = {
  filename: string
  page_number: number
}

export type ChatResponse = {
  answer: string
  sources: Source[]
}

export async function askQuestion(courseId: number, question: string): Promise<ChatResponse> {
  const response = await apiFetch(`/courses/${courseId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  if (!response.ok) {
    throw new Error(await errorMessage(response, `Question failed (error ${response.status})`))
  }
  return (await response.json()) as ChatResponse
}
