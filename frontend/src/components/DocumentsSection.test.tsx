import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'

import { type CourseDocument } from '../api/documents'
import DocumentsSection from './DocumentsSection'

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

function renderSection() {
  render(<DocumentsSection courseId={1} />)
}

// A document with default values; each test only overrides what matters
function makeDocument(fields: Partial<CourseDocument>): CourseDocument {
  return {
    id: 1,
    course_id: 1,
    filename: 'lecture.pdf',
    status: 'ready',
    error_message: null,
    created_at: '',
    updated_at: '',
    ...fields,
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

// Every fetch call gets a fresh response with this body
function mockDocuments(body: unknown) {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => json(body))
}

function pickPdf() {
  fireEvent.click(screen.getByRole('button', { name: '+ Upload PDF' }))
  const file = new File(['%PDF-1.4'], 'lecture.pdf', { type: 'application/pdf' })
  fireEvent.change(screen.getByLabelText('PDF file'), { target: { files: [file] } })
  // Submit the form directly: jsdom's "required" check can't see files set by a test
  fireEvent.submit(screen.getByRole('button', { name: 'Upload' }))
}

test('shows loading first', () => {
  mockDocuments([])
  renderSection()
  expect(screen.getByText('Loading documents...')).toBeInTheDocument()
})

test('shows the documents with their status', async () => {
  mockDocuments([
    makeDocument({ id: 1, filename: 'lecture1.pdf', status: 'ready' }),
    makeDocument({
      id: 2,
      filename: 'scan.pdf',
      status: 'failed',
      error_message: 'No text found.',
    }),
  ])
  renderSection()

  expect(await screen.findByText('lecture1.pdf')).toBeInTheDocument()
  expect(screen.getByText('scan.pdf')).toBeInTheDocument()
  expect(screen.getByText('ready')).toBeInTheDocument()
  expect(screen.getByText('failed')).toBeInTheDocument()
  expect(screen.getByText('No text found.')).toBeInTheDocument()
})

test('shows a message when there are no documents', async () => {
  mockDocuments([])
  renderSection()
  expect(await screen.findByText('No documents yet. Upload your first PDF!')).toBeInTheDocument()
})

test('shows an error when the documents cannot be loaded', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 500 }))
  vi.spyOn(console, 'error').mockImplementation(() => {})
  renderSection()
  expect(await screen.findByText(/Could not load the documents/)).toBeInTheDocument()
})

test('uploads a PDF and adds it to the list', async () => {
  vi.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(json([])) // 1st call: GET, the list is empty
    .mockResolvedValueOnce(json(makeDocument({ status: 'processing' }))) // 2nd call: POST
  renderSection()
  expect(await screen.findByText('No documents yet. Upload your first PDF!')).toBeInTheDocument()

  pickPdf()

  expect(await screen.findByText('lecture.pdf')).toBeInTheDocument()
  expect(screen.getByText('processing')).toBeInTheDocument()
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})

test('shows the upload error and keeps the modal open', async () => {
  vi.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(json([]))
    .mockResolvedValueOnce(json({ detail: 'Only PDF files are allowed' }, 400))
  vi.spyOn(console, 'error').mockImplementation(() => {})
  renderSection()
  expect(await screen.findByText('No documents yet. Upload your first PDF!')).toBeInTheDocument()

  pickPdf()

  expect(await screen.findByText('Only PDF files are allowed')).toBeInTheDocument()
  expect(screen.getByRole('dialog')).toBeInTheDocument()
})

test('refreshes the status while a document is processing', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.spyOn(globalThis, 'fetch')
    .mockResolvedValueOnce(json([makeDocument({ status: 'processing' })])) // first load
    .mockResolvedValueOnce(json([makeDocument({ status: 'ready' })])) // first poll
  renderSection()
  expect(await screen.findByText('processing')).toBeInTheDocument()

  // Jump 3 seconds into the future: the polling interval fires
  await vi.advanceTimersByTimeAsync(3000)

  expect(await screen.findByText('ready')).toBeInTheDocument()
})
