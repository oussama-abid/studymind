import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { afterEach, expect, test, vi } from 'vitest'

import CoursePage from './CoursePage'

afterEach(() => {
  vi.restoreAllMocks()
})

// Render the page as if the browser were on /courses/1
function renderAt(url: string) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/courses/:courseId" element={<CoursePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

test('shows the course from the URL', async () => {
  const fetchMock = vi
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 1,
          title: 'Databases',
          description: null,
          created_at: '',
          updated_at: '',
        }),
      ),
    )
  renderAt('/courses/1')
  expect(await screen.findByText('Databases')).toBeInTheDocument()
  expect(fetchMock).toHaveBeenCalledWith(expect.stringMatching(/\/courses\/1$/))
})

test('shows an error when the course does not exist', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 404 }))
  vi.spyOn(console, 'error').mockImplementation(() => {})
  renderAt('/courses/999')
  expect(await screen.findByText('Could not load this course.')).toBeInTheDocument()
})
