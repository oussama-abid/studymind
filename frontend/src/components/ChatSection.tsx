import { useEffect, useRef, useState } from 'react'
import Markdown from 'react-markdown'

import { askQuestion, type Source } from '../api/chat'
import PdfViewer from './PdfViewer'

type ChatEntry = {
  id: number
  question: string
  answer: string | null // null = still waiting for the answer
  sources: Source[]
  error: string | null
}

// Shown when the chat is empty, so students know what they can ask
const EXAMPLE_QUESTIONS = [
  'What are the most important terms in this course?',
  'Explain the main idea of the first lecture.',
  'What should I know for the exam?',
]

// The browser throws a TypeError when it cannot reach the server at all
function messageFor(error: unknown): string {
  if (error instanceof TypeError) {
    return 'Could not reach StudyMind. Check your internet connection and try again.'
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}

function ChatSection({ courseId }: { courseId: number }) {
  const [entries, setEntries] = useState<ChatEntry[]>([])
  const [openSource, setOpenSource] = useState<Source | null>(null) // shown in the PDF panel
  const endOfChat = useRef<HTMLDivElement>(null)
  const nextId = useRef(1) // a unique id for each question
  const isAsking = entries.some((entry) => entry.answer === null && entry.error === null)

  // Keep the newest question and answer in view
  useEffect(() => {
    if (entries.length === 0) return
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    endOfChat.current?.scrollIntoView?.({ behavior: calm ? 'auto' : 'smooth', block: 'end' })
  }, [entries])

  // Change one entry (found by id) and keep all the others as they are
  function updateEntry(id: number, changes: Partial<ChatEntry>) {
    setEntries((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry)),
    )
  }

  async function ask(question: string) {
    const id = nextId.current++
    setEntries((current) => [...current, { id, question, answer: null, sources: [], error: null }])

    try {
      const response = await askQuestion(courseId, question)
      updateEntry(id, { answer: response.answer, sources: response.sources })
    } catch (error) {
      updateEntry(id, { error: messageFor(error) })
    }
  }

  function sendQuestion(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const question = String(new FormData(form).get('question')).trim()
    if (!question) return
    form.reset() // empty the input right away, like any chat
    ask(question)
  }

  return (
    <section className="flex flex-col">
      <h2 className="mb-4 font-display text-2xl font-bold">Ask your course</h2>

      {entries.length === 0 && (
        <div className="card mb-4 animate-enter border-dashed">
          <p className="font-bold">Not sure where to start? Try one of these:</p>
          <div className="mt-3 flex flex-col items-start gap-2">
            {EXAMPLE_QUESTIONS.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => ask(question)}
                className="rounded-lg border border-line bg-paper px-3 py-2 text-left transition-colors duration-150 hover:border-ink"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      <ul className="mb-4 flex flex-col gap-4">
        {entries.map((entry) => (
          <li key={entry.id} className="flex flex-col gap-2">
            <p className="max-w-[85%] animate-enter self-end rounded-xl bg-ink px-4 py-3 text-white">
              {entry.question}
            </p>

            <div className="card animate-enter self-stretch">
              {entry.answer === null && entry.error === null && (
                <p className="flex items-center gap-3 text-muted">
                  <span>StudyMind is thinking...</span>
                  <span aria-hidden="true" className="flex gap-1">
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                    <span className="thinking-dot" />
                  </span>
                </p>
              )}

              {entry.error && (
                <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-red-700">
                  {entry.error}
                </p>
              )}

              {entry.answer !== null && (
                <>
                  <div className="answer prose max-w-none">
                    <Markdown>{entry.answer}</Markdown>
                  </div>
                  {entry.sources.length > 0 && (
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-line pt-3 text-sm text-muted">
                      <span>Sources:</span>
                      {entry.sources.map((source) => (
                        <button
                          key={`${source.document_id}-${source.page_number}`}
                          type="button"
                          onClick={() => setOpenSource(source)}
                          className="rounded-md bg-paper px-2.5 py-1 font-bold text-action transition-colors duration-150 hover:bg-action hover:text-white"
                        >
                          {`${source.filename}, page ${source.page_number}`}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </li>
        ))}
      </ul>
      <div ref={endOfChat} />

      {/* Stays at the bottom of the screen while the chat scrolls */}
      <form
        onSubmit={sendQuestion}
        className="sticky bottom-0 -mx-4 flex gap-2 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0"
      >
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
          className="input min-w-0 flex-1"
        />
        <button type="submit" disabled={isAsking} className="btn">
          Ask
        </button>
      </form>

      {openSource && (
        <PdfViewer
          key={openSource.document_id}
          courseId={courseId}
          source={openSource}
          onClose={() => setOpenSource(null)}
        />
      )}
    </section>
  )
}

export default ChatSection
