import type { Tokens } from '../types'

const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'
const EMAIL_KEY = 'user_email'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

export function setTokens(tokens: Tokens) {
  localStorage.setItem(ACCESS_KEY, tokens.access)
  localStorage.setItem(REFRESH_KEY, tokens.refresh)
}

export function setAccessToken(access: string) {
  localStorage.setItem(ACCESS_KEY, access)
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

export function setUserEmail(email: string | null) {
  if (email) localStorage.setItem(EMAIL_KEY, email)
  else localStorage.removeItem(EMAIL_KEY)
}

export function getUserEmail(): string | null {
  return localStorage.getItem(EMAIL_KEY)
}