import { useEffect, useMemo, useState } from 'react'
import type { TokenInfo } from '../../types/domain'
import { apiClient } from '../../services/client'
import { AuthContext, type AuthContextValue } from './AuthContext'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<TokenInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void (async () => {
      try {
        const token = await apiClient.auth.refresh()
        setSession(token.success ? token.data : null)
      } catch {
        setSession(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      loading,
      login: async (email, pass) => {
        const token = await apiClient.auth.login(email, pass)
        if (!token.success) {
          throw new Error(token.error.message)
        }
        setSession(token.data)
      },
      logout: async () => {
        await apiClient.auth.logout()
        setSession(null)
      },
      refreshSession: async () => {
        const token = await apiClient.auth.refresh()
        setSession(token.success ? token.data : null)
      },
    }),
    [loading, session]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
