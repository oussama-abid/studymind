import { type ReactNode, useEffect, useState } from 'react'

import { clearToken, fetchMe, getToken, LOGGED_OUT_EVENT, login, type User } from '../api/auth'
import { AuthContext } from './AuthContext'

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  // While we check a saved token, we don't know yet if someone is logged in
  const [checking, setChecking] = useState(() => getToken() !== null)

  useEffect(() => {
    if (getToken() === null) return
    fetchMe()
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setChecking(false))
  }, [])

  // apiFetch fires this event when the token has expired
  useEffect(() => {
    const onLoggedOut = () => setUser(null)
    window.addEventListener(LOGGED_OUT_EVENT, onLoggedOut)
    return () => window.removeEventListener(LOGGED_OUT_EVENT, onLoggedOut)
  }, [])

  async function logIn(email: string, password: string) {
    await login(email, password)
    setUser(await fetchMe())
  }

  function logOut() {
    clearToken()
    setUser(null)
  }

  if (checking) {
    return <p className="p-8 text-muted">Loading...</p>
  }

  return <AuthContext.Provider value={{ user, logIn, logOut }}>{children}</AuthContext.Provider>
}

export default AuthProvider
