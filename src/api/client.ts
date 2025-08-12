import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { authBridge } from '../lib/authBridge'
import { clearTokens, getAccessToken, getRefreshToken, setAccessToken } from '../lib/tokenStorage'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export const api = axios.create({
  baseURL,
})

// Подкладываем Bearer access
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

const AUTH_FREE = ['/auth/login/', '/auth/register/', '/auth/token/refresh/']

let refreshingPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (refreshingPromise) return refreshingPromise

  const refresh = getRefreshToken()
  if (!refresh) {
    clearTokens()
    authBridge.onLogout?.()
    return null
  }

  const raw = axios.create({ baseURL })
  refreshingPromise = raw
    .post('/auth/token/refresh/', { refresh })
    .then((res) => {
      const newAccess: string | undefined = res.data?.access
      if (newAccess) {
        setAccessToken(newAccess)
        authBridge.onAccessTokenUpdated?.(newAccess)
        return newAccess
      }
      clearTokens()
      authBridge.onLogout?.()
      return null
    })
    .catch(() => {
      clearTokens()
      authBridge.onLogout?.()
      return null
    })
    .finally(() => {
      refreshingPromise = null
    })

  return refreshingPromise
}

// Авто-рефреш access и повтор запроса
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (typeof error)['config'] & { _retry?: boolean }
    const status = error.response?.status
    const url = original?.url || ''

    if (!original || original._retry) {
      return Promise.reject(error)
    }

    if (status === 401 && !AUTH_FREE.some((p) => url.includes(p))) {
      original._retry = true
      const newAccess = await refreshAccessToken()
      if (newAccess) {
        original.headers = original.headers || {}
        original.headers.Authorization = `Bearer ${newAccess}`
        return api(original)
      }
      // Рефреш не удался — logout уже выполнен в refreshAccessToken
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)