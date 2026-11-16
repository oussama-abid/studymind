import { errorMessage } from './errors'

const apiUrl = import.meta.env.VITE_API_URL
const TOKEN_KEY = 'studymind_token'

// Fired when the backend says our token is no longer valid
export const LOGGED_OUT_EVENT = 'studymind:logged-out'

export type User = {
  id: number
  email: string
}

export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers) // keep the caller's headers
  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  const response = await fetch(`${apiUrl}${path}`, { ...options, headers })
  if (response.status === 401 && token) {
    clearToken()
    window.dispatchEvent(new Event(LOGGED_OUT_EVENT))
  }
  return response
}

async function sendCredentials(path: string, email: string, password: string) {
  return apiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
}

export async function register(email: string, password: string): Promise<void> {
  const response = await sendCredentials('/auth/register', email, password)
  if (!response.ok) {
    throw new Error(await errorMessage(response, 'Registration failed.'))
  }
}

export async function login(email: string, password: string): Promise<void> {
  const response = await sendCredentials('/auth/login', email, password)
  if (!response.ok) {
    throw new Error(await errorMessage(response, 'Login failed.'))
  }
  const body = (await response.json()) as { access_token: string }
  saveToken(body.access_token)
}

export async function fetchMe(): Promise<User> {
  const response = await apiFetch('/auth/me')
  if (!response.ok) {
    throw new Error('Not logged in')
  }
  return (await response.json()) as User
}
