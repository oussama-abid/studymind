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
      sources: [{ filename: 'lecture1.pdf', page_number: 2 }],
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
