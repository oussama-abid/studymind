import { useState } from 'react'
import { Link } from 'react-router'

import { register } from '../api/auth'
import { useAuth } from '../auth/AuthContext'
import { usePageTitle } from '../usePageTitle'

const FEATURES = [
  {
    title: 'Upload your PDFs',
    text: 'Lecture slides, scripts and papers, one course per subject.',
  },
  {
    title: 'Ask in your own words',
    text: 'In English or German. The answer comes only from your documents.',
  },
  {
    title: 'Check every answer',
    text: 'Each answer shows the pages it used. One click opens the PDF there.',
  },
]

// One page for both forms: /login and /register
function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { logIn } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const isRegister = mode === 'register'
  usePageTitle(isRegister ? 'Create your account' : 'Log in')

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
    <main className="mx-auto grid max-w-5xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-20">
      {/* What StudyMind is, for visitors who see it for the first time */}
      <section>
        <p className="font-bold text-action">Your AI study assistant</p>
        <p className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-5xl">
          Ask your <span className="marker">lecture notes</span> anything.
        </p>
        <p className="mt-4 text-lg text-muted">
          StudyMind reads your course PDFs and answers your questions with the pages it used, so you
          can always check the source.
        </p>
        <ol className="mt-8 flex flex-col gap-5">
          {FEATURES.map((feature, index) => (
            <li key={feature.title} className="flex gap-4">
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink font-bold text-white"
              >
                {index + 1}
              </span>
              <div>
                <p className="font-bold">{feature.title}</p>
                <p className="text-muted">{feature.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* On a phone the form comes first, so returning users don't scroll */}
      <section className="order-first lg:order-last">
        <h1 className="page-title">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
        <p className="mt-2 text-muted">
          {isRegister
            ? 'Upload your lectures and ask them anything.'
            : 'Log in to continue studying.'}
        </p>

        <form onSubmit={submit} className="card mt-6 flex flex-col gap-4">
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
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <button type="submit" disabled={busy} className="btn">
            {busy ? 'Please wait...' : isRegister ? 'Create account' : 'Log in'}
          </button>
        </form>

        <p className="mt-6 text-center text-muted">
          {isRegister ? 'Already have an account? ' : 'New to StudyMind? '}
          <Link to={isRegister ? '/login' : '/register'} className="text-action hover:underline">
            {isRegister ? 'Log in' : 'Create an account'}
          </Link>
        </p>
      </section>
    </main>
  )
}

export default AuthPage
