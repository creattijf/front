import { api } from './client'
import type { Task } from '../types'

export async function getTasks(): Promise<Task[]> {
  const { data } = await api.get('/tasks/')
  return data
}

export async function createTask(params: { title: string; description?: string; due_date?: string | null }): Promise<Task> {
  const { data } = await api.post('/tasks/', params)
  return data
}

export async function updateTask(
  id: number,
  params: { title: string; description: string; completed: boolean; due_date?: string | null }
): Promise<Task> {
  const { data } = await api.put(`/tasks/${id}/`, params)
  return data
}

export async function deleteTask(id: number): Promise<void> {
  await api.delete(`/tasks/${id}/`)
}