import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'

import CoursesPage from './CoursesPage'
import { MemoryRouter } from 'react-router'

afterEach(() => {
  vi.restoreAllMocks()
})

function renderPage() {
  render(
    <MemoryRouter>
      <CoursesPage />
    </MemoryRouter>,
  )
}

function mockCourses(body: object) {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(body)))
}

test('shows loading first', () => {
  mockCourses([])
  renderPage()
  expect(screen.getByText('Loading courses...')).toBeInTheDocument()
})

test('shows the courses from the backend', async () => {
  mockCourses([
    { id: 1, title: 'Databases', description: 'SQL basics', created_at: '', updated_at: '' },
    { id: 2, title: 'Docker', description: null, created_at: '', updated_at: '' },
  ])
  renderPage()
  expect(await screen.findByText('Databases')).toBeInTheDocument()
  expect(screen.getByText('SQL basics')).toBeInTheDocument()
  expect(screen.getByText('Docker')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: /Databases/ })).toHaveAttribute('href', '/courses/1')
})

test('shows a message when there are no courses', async () => {
  mockCourses([])
  renderPage()
  expect(await screen.findByText('No courses yet. Create your first one!')).toBeInTheDocument()
})

test('shows an error when the backend fails', async () => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('', { status: 500 }))
  vi.spyOn(console, 'error').mockImplementation(() => {})
  renderPage()
  expect(await screen.findByText(/Could not load your courses/)).toBeInTheDocument()
})

test('creates a new course', async () => {
    mockCourses([])
    renderPage()
    expect(await screen.findByText('No courses yet. Create your first one!')).toBeInTheDocument()
    
    fireEvent.click(screen.getByRole('button', { name: '+ New course' }))
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Databases' } })
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'SQL basics' } })
    mockCourses({ id: 1, title: 'Databases', description: 'SQL basics', created_at: '', updated_at: '' })
    fireEvent.click(screen.getByRole('button', { name: 'Create' })) 
    expect(await screen.findByText('Databases')).toBeInTheDocument()
    expect(screen.getByText('SQL basics')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
})
    
