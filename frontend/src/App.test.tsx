import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, test, vi } from 'vitest'

import App from './App'

afterEach(() => {
  vi.restoreAllMocks()
})

test('shows the app title and the courses page on /', async () => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(JSON.stringify([])))
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>,
  )
  expect(screen.getByText('StudyMind')).toBeInTheDocument()
  expect(await screen.findByText('My courses')).toBeInTheDocument()
})

test('shows the course page on /courses/:courseId', async () => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(
    async () =>
      new Response(
        JSON.stringify({
          id: 1,
          title: 'Databases',
          description: 'SQL basics',
          created_at: '',
          updated_at: '',
        }),
      ),
  )
  render(
    <MemoryRouter initialEntries={['/courses/1']}>
      <App />
    </MemoryRouter>,
  )
  expect(screen.getByText('← All courses')).toBeInTheDocument()
  expect(await screen.findByText('Databases')).toBeInTheDocument()
})
