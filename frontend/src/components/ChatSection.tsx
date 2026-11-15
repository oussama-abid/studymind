import { useState } from 'react'
import Markdown from 'react-markdown'

import { askQuestion, type Source } from '../api/chat'

type ChatEntry = {
  id: number
  question: string
  answer: string | null // null = still waiting for Gemini
  sources: Source[]
  error: string | null
}

function ChatSection({ courseId }: { courseId: number }) {
  const [entries, setEntries] = useState<ChatEntry[]>([])
  const isAsking = entries.some((entry) => entry.answer === null && entry.error === null)

  // Change one entry (found by id) and keep all the others as they are
  function updateEntry(id: number, changes: Partial<ChatEntry>) {
    setEntries((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry)),
    )
  }

  async function sendQuestion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const question = String(new FormData(form).get('question')).trim()
    if (!question) return
    form.reset() // empty the input right away, like any chat

    const id = Date.now()
    setEntries((current) => [...current, { id, question, answer: null, sources: [], error: null }])

    try {
      const response = await askQuestion(courseId, question)
      updateEntry(id, { answer: response.answer, sources: response.sources })
    } catch (error) {
      updateEntry(id, {
        error: error instanceof Error ? error.message : 'Something went wrong.',
      })
    }
  }

  return (
    <section className="flex flex-col">
      <h2 className="mb-4 font-display text-2xl font-bold">Ask your course</h2>

      <ul className="mb-4 flex flex-col gap-4">
        {entries.map((entry) => (
          <li key={entry.id} className="flex flex-col gap-2">
            <p className="self-end rounded-xl bg-ink px-4 py-3 text-white">{entry.question}</p>

            <div className="card self-stretch">
              {entry.answer === null && entry.error === null && (
                <p className="animate-pulse text-muted">StudyMind is thinking...</p>
              )}

              {entry.error && <p className="text-red-600">{entry.error}</p>}

              {entry.answer !== null && (
                <>
                  <div className="answer prose max-w-none">
                    <Markdown>{entry.answer}</Markdown>
                  </div>
                  {entry.sources.length > 0 && (
                    <p className="mt-4 border-t border-dashed border-line pt-3 text-sm text-muted">
                      Sources:{' '}
                      {entry.sources
                        .map((source) => `${source.filename}, page ${source.page_number}`)
                        .join(' · ')}
                    </p>
                  )}
                </>
              )}
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={sendQuestion} className="flex gap-2">
        <label htmlFor="question" className="sr-only">
          Your question
        </label>
        <input
          id="question"
          name="question"
          type="text"
          placeholder="Ask a question about this course..."
          required
          maxLength={1000}
          disabled={isAsking}
          className="input flex-1"
        />
        <button type="submit" disabled={isAsking} className="btn">
          Ask
        </button>
      </form>
    </section>
  )
}

export default ChatSection
