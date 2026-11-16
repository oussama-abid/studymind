import { useState } from 'react'
import { Link } from 'react-router'

import { register } from '../api/auth'
import { useAuth } from '../auth/AuthContext'

// One page for both forms: /login and /register
function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { logIn } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const isRegister = mode === 'register'

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const email = String(formData.get('email'))
    const password = String(formData.get('password'))

    setError(null)
    setBusy(true)
    try {
      if (isRegister) {
        await register(email, password)
      }
      await logIn(email, password) // a new account is logged in right away
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="page-title">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
      <p className="mt-2 text-muted">
        {isRegister
          ? 'Upload your lectures and ask them anything.'
          : 'Log in to continue studying.'}
      </p>

      <form onSubmit={submit} className="card mt-8 flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          Email
          <input type="email" name="email" required autoComplete="email" className="input" />
        </label>
        <label className="flex flex-col gap-1">
          Password
          <input
            type="password"
            name="password"
            required
            minLength={isRegister ? 8 : undefined}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            className="input"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="btn">
          {isRegister ? 'Create account' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center text-muted">
        {isRegister ? 'Already have an account? ' : 'New to StudyMind? '}
        <Link to={isRegister ? '/login' : '/register'} className="text-action hover:underline">
          {isRegister ? 'Log in' : 'Create an account'}
        </Link>
      </p>
    </main>
  )
}

export default AuthPage
