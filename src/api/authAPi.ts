import { api } from './client'
import type { Tokens } from '../types'

export async function login(loginStr: string, password: string): Promise<Tokens> {
  // Отправляем и username, и email — бэкенд возьмет нужное поле
  const { data } = await api.post('/auth/login/', { username: loginStr, email: loginStr, password })
  return { access: data.access, refresh: data.refresh }
}

export async function registerUser(params: {
  email: string
  username: string
  password: string
  password2: string
}): Promise<void> {
  await api.post('/auth/register/', params)
}