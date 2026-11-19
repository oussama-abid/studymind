import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'

import ChatSection from './ChatSection'

afterEach(() => {
  vi.restoreAllMocks()
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

function ask(question: string) {
  fireEvent.change(screen.getByLabelText('Your question'), { target: { value: question } })
  fireEvent.click(screen.getByRole('button', { name: 'Ask' }))
}

test('sends the question and shows the answer with its sources', async () => {
  const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    json({
      answer: 'Docker runs **containers**.',
      sources: [{ document_id: 7, filename: 'lecture1.pdf', page_number: 2 }],
    }),
  )
  render(<ChatSection courseId={3} />)

  ask('What does Docker run?')

  expect(screen.getByText('What does Docker run?')).toBeInTheDocument()
  expect(await screen.findByText('containers')).toBeInTheDocument()
  expect(screen.getByText(/lecture1.pdf, page 2/)).toBeInTheDocument()
  // The right URL and body were sent
  const [url, options] = fetchMock.mock.calls[0]
  expect(url).toMatch(/\/courses\/3\/chat$/)
  expect(options?.body).toBe(JSON.stringify({ question: 'What does Docker run?' }))
})

test('renders markdown as formatting, not as raw text', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    json({ answer: 'An image is **read-only**.', sources: [] }),
  )
  render(<ChatSection courseId={3} />)

  ask('What is an image?')

  const bold = await screen.findByText('read-only')
  expect(bold.tagName).toBe('STRONG')
  expect(screen.queryByText(/\*\*/)).not.toBeInTheDocument()
})

test('shows a thinking message and disables the input while waiting', async () => {
  vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {})) // never answers
  render(<ChatSection courseId={3} />)

  ask('Slow question?')

  expect(await screen.findByText('StudyMind is thinking...')).toBeInTheDocument()
  expect(screen.getByLabelText('Your question')).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Ask' })).toBeDisabled()
})

test("shows the backend's error message", async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    json({ detail: 'This course has no ready documents yet.' }, 409),
  )
  render(<ChatSection courseId={3} />)

  ask('Anything?')

  expect(await screen.findByText('This course has no ready documents yet.')).toBeInTheDocument()
  expect(screen.getByLabelText('Your question')).toBeEnabled()
})

test('does not render HTML from the answer', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    json({ answer: 'Hello <img src="x" onerror="alert(1)">', sources: [] }),
  )
  const { container } = render(<ChatSection courseId={3} />)

  ask('Hi?')

  await screen.findByText(/Hello/)
  expect(container.querySelector('img')).toBeNull()
})

test('opens a source in the PDF panel at the cited page', async () => {
  URL.createObjectURL = vi.fn(() => 'blob:lecture1') // jsdom has no real blob URLs
  URL.revokeObjectURL = vi.fn()
  const fetchMock = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(
      json({
        answer: 'Docker runs containers.',
        sources: [{ document_id: 7, filename: 'lecture1.pdf', page_number: 2 }],
      }),
    )
    .mockResolvedValueOnce(new Response('%PDF-1.4'))
  render(<ChatSection courseId={3} />)
  ask('What does Docker run?')

  fireEvent.click(await screen.findByRole('button', { name: 'lecture1.pdf, page 2' }))

  // The right file was downloaded, and the viewer opens it at page 2
  expect(String(fetchMock.mock.calls[1][0])).toMatch(/\/courses\/3\/documents\/7\/file$/)
  const viewer = await screen.findByTitle('lecture1.pdf, page 2')
  expect(viewer).toHaveAttribute('src', 'blob:lecture1#page=2')

  // Closing removes the panel and frees the memory
  fireEvent.click(screen.getByRole('button', { name: 'Close' }))
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:lecture1')
})

test('asks an example question with one click', async () => {
  const fetchMock = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(json({ answer: 'Images and containers.', sources: [] }))
  render(<ChatSection courseId={3} />)

  fireEvent.click(
    screen.getByRole('button', { name: 'What are the most important terms in this course?' }),
  )

  expect(await screen.findByText('Images and containers.')).toBeInTheDocument()
  expect(fetchMock.mock.calls[0][1]?.body).toBe(
    JSON.stringify({ question: 'What are the most important terms in this course?' }),
  )
  // The examples are only for an empty chat
  expect(screen.queryByText(/Not sure where to start/)).not.toBeInTheDocument()
})

test('explains what to do when the server cannot be reached', async () => {
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
  render(<ChatSection courseId={3} />)

  ask('Anything?')

  expect(await screen.findByRole('alert')).toHaveTextContent(/Check your internet connection/)
})
