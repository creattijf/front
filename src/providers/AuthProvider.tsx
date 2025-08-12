import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerAuthBridge } from '../lib/authBridge'
import { getAccessToken, getRefreshToken, setTokens, clearTokens, setUserEmail, getUserEmail } from '../lib/tokenStorage'
import * as authApi from '../api/authApi'
import type { Tokens } from '../types'
import axios from 'axios'

type AuthContextValue = {
  initializing: boolean
  isAuthenticated: boolean
  email: string | null
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, username: string, password: string, password2: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [initializing, setInitializing] = useState(true)
  const [email, setEmail] = useState<string | null>(getUserEmail())
  const [tokens, setTokensState] = useState<Tokens | null>(() => {
    const access = getAccessToken()
    const refresh = getRefreshToken()
    return access && refresh ? { access, refresh } : null
  })
  const navigate = useNavigate()

  const isAuthenticated = !!tokens?.refresh

  // Регистрация callback'ов для перехватчика
  useEffect(() => {
    registerAuthBridge({
      onLogout: () => {
        setTokensState(null)
        setEmail(null)
        navigate('/login', { replace: true })
      },
      onAccessTokenUpdated: (access) => {
        setTokensState((prev) => (prev ? { ...prev, access } : { access, refresh: getRefreshToken() || '' }))
      },
    })
  }, [navigate])

  // Инициализация: если есть refresh — пытаемся обновить access
  useEffect(() => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
    const raw = axios.create({ baseURL })
    async function bootstrap() {
      const refresh = getRefreshToken()
      if (refresh) {
        try {
          const { data } = await raw.post('/auth/token/refresh/', { refresh })
          if (data?.access) {
            setTokensState({ access: data.access, refresh })
          } else {
            clearTokens()
            setTokensState(null)
          }
        } catch {
          clearTokens()
          setTokensState(null)
        }
      }
      setInitializing(false)
    }
    bootstrap()
  }, [])

  const login = useCallback(async (emailArg: string, password: string) => {
    try {
      const t = await authApi.login(emailArg, password)
      setTokens(t)
      setTokensState(t)
      setEmail(emailArg)
      setUserEmail(emailArg)
      return true
    } catch (e) {
      return false
    }
  }, [])

  const register = useCallback(
  async (emailArg: string, username: string, password: string, password2: string) => {
    try {
      await authApi.registerUser({ email: emailArg, username, password, password2 })
      const ok = await login(username, password)
      return ok
    } catch {
      return false
    }
  },
  [login]
)

  const logout = useCallback(() => {
    clearTokens()
    setUserEmail(null)
    setTokensState(null)
    setEmail(null)
    navigate('/login', { replace: true })
  }, [navigate])

  const value = useMemo<AuthContextValue>(
    () => ({ initializing, isAuthenticated, email, login, register, logout }),
    [initializing, isAuthenticated, email, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}