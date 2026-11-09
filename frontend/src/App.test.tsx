import { render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'

import App from './App'

// After each test, put the real fetch back
afterEach(() => {
  vi.restoreAllMocks()
})

function mockBackendResponse(body: object) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify(body)),
  )
}

test('shows the app title', () => {
  mockBackendResponse({ status: 'ok', db: 'ok' })
  render(<App />)
  expect(screen.getByText('StudyMind')).toBeInTheDocument()
})

test('shows online when the backend is up', async () => {
  mockBackendResponse({ status: 'ok', db: 'ok' })
  render(<App />)
  expect(await screen.findByText('online')).toBeInTheDocument()
})

test('shows offline when the backend reports an error', async () => {
  mockBackendResponse({ status: 'error', db: 'error' })
  render(<App />)
  expect(await screen.findByText('offline')).toBeInTheDocument()
})

test('shows offline when the backend is unreachable', async () => {
  vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))
  vi.spyOn(console, 'error').mockImplementation(() => {})
  render(<App />)
  expect(await screen.findByText('offline')).toBeInTheDocument()
})