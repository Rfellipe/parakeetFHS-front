import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { AuthUser } from '../../types/domain'
import { apiClient } from '../../services/client'

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void apiClient.auth
      .me()
      .then(setUser)
      .catch(() => {
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: async (email, password) => {
        const authUser = await apiClient.auth.login(email, password)
        setUser(authUser)
      },
      logout: async () => {
        await apiClient.auth.logout()
        setUser(null)
      },
      refreshSession: async () => {
        const authUser = await apiClient.auth.refresh()
        setUser(authUser)
      },
    }),
    [loading, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
