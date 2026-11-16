import { createContext, useContext } from 'react'

import { type User } from '../api/auth'

export type AuthState = {
  user: User | null
  logIn: (email: string, password: string) => Promise<void>
  logOut: () => void
}

export const AuthContext = createContext<AuthState | null>(null)

// The logged-in user, from any component below <AuthProvider>
export function useAuth(): AuthState {
  const auth = useContext(AuthContext)
  if (auth === null) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return auth
}
