import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, test, vi } from 'vitest'

import { getToken, saveToken } from './api/auth'
import App from './App'
import AuthProvider from './auth/AuthProvider'

afterEach(() => {
  vi.restoreAllMocks()
})

const USER = { id: 1, email: 'student@example.com' }
const COURSE = { id: 1, title: 'Databases', description: null, created_at: '', updated_at: '' }

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

// A fake backend: answers each request by its URL
function mockBackend(routes: Record<string, () => Response>) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const path = new URL(String(input), 'http://test').pathname
    const route = Object.keys(routes).find((key) => path.endsWith(key))
    return route ? routes[route]() : json({ status: 'ok', db: 'ok' })
  })
}

function renderApp(url = '/') {
  render(
    <MemoryRouter initialEntries={[url]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )
}

test('sends visitors who are not logged in to the login page', async () => {
  mockBackend({})
  renderApp('/')

  expect(await screen.findByText('Welcome back')).toBeInTheDocument()
})

test('logs in and shows the courses with the user email', async () => {
  const fetchMock = mockBackend({
    '/auth/login': () => json({ access_token: 'token-123', token_type: 'bearer' }),
    '/auth/me': () => json(USER),
    '/courses': () => json([]),
  })
  renderApp('/login')

  fireEvent.change(await screen.findByLabelText('Email'), { target: { value: USER.email } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'secret-password' } })
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

  expect(await screen.findByText('No courses yet. Create your first one!')).toBeInTheDocument()
  expect(screen.getByText('My courses')).toBeInTheDocument()
  expect(screen.getByText(USER.email)).toBeInTheDocument()
  expect(getToken()).toBe('token-123')
  // Requests after login carry the token
  const [, options] = fetchMock.mock.calls.find(([url]) => String(url).endsWith('/courses'))!
  expect(new Headers(options?.headers).get('Authorization')).toBe('Bearer token-123')
})

test('shows the error from a failed login', async () => {
  mockBackend({ '/auth/login': () => json({ detail: 'Invalid email or password' }, 401) })
  renderApp('/login')

  fireEvent.change(await screen.findByLabelText('Email'), { target: { value: USER.email } })
  fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong-password' } })
  fireEvent.click(screen.getByRole('button', { name: 'Log in' }))

  expect(await screen.findByText('Invalid email or password')).toBeInTheDocument()
})

test('shows the course page for a logged-in user', async () => {
  saveToken('token-123')
  mockBackend({
    '/auth/me': () => json(USER),
    '/documents': () => json([]),
    '/courses/1': () => json(COURSE),
  })
  renderApp('/courses/1')

  expect(await screen.findByText('Databases')).toBeInTheDocument()
  expect(screen.getByText('← All courses')).toBeInTheDocument()
})

test('logs out', async () => {
  saveToken('token-123')
  mockBackend({ '/auth/me': () => json(USER), '/courses': () => json([]) })
  renderApp('/')

  fireEvent.click(await screen.findByRole('button', { name: 'Log out' }))

  expect(await screen.findByText('Welcome back')).toBeInTheDocument()
  expect(getToken()).toBeNull()
})

test('an expired token sends the user back to the login page', async () => {
  saveToken('expired-token')
  mockBackend({ '/auth/me': () => json(USER), '/courses': () => json({}, 401) })
  vi.spyOn(console, 'error').mockImplementation(() => {})
  renderApp('/')

  expect(await screen.findByText('Welcome back')).toBeInTheDocument()
  expect(getToken()).toBeNull()
})
