import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Task } from '../types'

const STORAGE_KEY = 'task_order_v1'

function load(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function save(ids: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
  } catch {}
}

export function useTaskOrder(tasks: Task[]) {
  const [order, setOrder] = useState<number[]>(() => load())

  // Синхронизация: выкидываем отсутствующие id, добавляем новые в конец
  useEffect(() => {
    const ids = tasks.map((t) => t.id)
    const setIds = new Set(ids)
    const cleaned = order.filter((id) => setIds.has(id))
    const missing = ids.filter((id) => !cleaned.includes(id))
    const next = [...cleaned, ...missing]
    if (next.length !== order.length || next.some((v, i) => v !== order[i])) {
      setOrder(next)
      save(next)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks.map((t) => t.id).join(',')])

  const orderedIds = useMemo(() => (order.length ? order : tasks.map((t) => t.id)), [order, tasks])

  const orderedTasks = useMemo(() => {
    const index = new Map(orderedIds.map((id, i) => [id, i]))
    return [...tasks].sort(
      (a, b) =>
        (index.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
        (index.get(b.id) ?? Number.MAX_SAFE_INTEGER)
    )
  }, [tasks, orderedIds])

  const setOrderByIds = useCallback((ids: number[]) => {
    setOrder(ids)
    save(ids)
  }, [])

  // Помогает заменить временный id на настоящий после успешного создания
  const replaceTempId = useCallback((tmpId: number, realId: number) => {
    setOrder((prev) => {
      const idx = prev.indexOf(tmpId)
      if (idx === -1) {
        if (prev.includes(realId)) return prev
        const next = [...prev, realId]
        save(next)
        return next
      }
      const next = [...prev]
      next[idx] = realId
      save(next)
      return next
    })
  }, [])

  return { orderedTasks, orderedIds, setOrderByIds, replaceTempId }
}