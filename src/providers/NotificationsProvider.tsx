// src/providers/NotificationsProvider.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useSnackbar } from 'notistack'

export type NotificationType = 'success' | 'error' | 'info' | 'warning' | 'reminder'
export type AppNotification = {
  id: string
  type: NotificationType
  title?: string
  message: string
  createdAt: string // ISO
  read: boolean
  meta?: Record<string, any>
  source?: 'toast' | 'system' | 'reminder'
}

type Ctx = {
  items: AppNotification[]
  unreadCount: number
  open: boolean
  openDrawer: () => void
  closeDrawer: () => void
  add: (n: Omit<AppNotification, 'id' | 'createdAt' | 'read'> & { id?: string }) => AppNotification
  addToast: (type: NotificationType, message: string, opts?: { title?: string }) => void
  markRead: (id: string) => void
  markAllRead: () => void
  remove: (id: string) => void
  clearAll: () => void
}

const NotificationsCtx = createContext<Ctx | null>(null)
const LS_KEY = 'notifications_list_v1'

function load(): AppNotification[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}
function save(list: AppNotification[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(list))
  } catch {}
}

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { enqueueSnackbar } = useSnackbar()
  const [items, setItems] = useState<AppNotification[]>(() => load())
  const [open, setOpen] = useState(false)

  useEffect(() => save(items), [items])

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items])

  const openDrawer = useCallback(() => setOpen(true), [])
  const closeDrawer = useCallback(() => setOpen(false), [])

  const add = useCallback<Ctx['add']>((n) => {
    const id = n.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const next: AppNotification = {
      id,
      type: n.type,
      title: n.title,
      message: n.message,
      createdAt: new Date().toISOString(),
      read: false,
      source: n.source || 'system',
      meta: n.meta,
    }
    setItems((prev) => [next, ...prev].slice(0, 300))
    return next
  }, [])

  const addToast = useCallback<Ctx['addToast']>(
    (type, message, opts) => {
      enqueueSnackbar(message, { variant: type === 'warning' ? 'warning' : type })
      add({ type, message, title: opts?.title, source: 'toast' })
    },
    [enqueueSnackbar, add]
  )

  const markRead = useCallback((id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])
  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })))
  }, [])
  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((n) => n.id !== id))
  }, [])
  const clearAll = useCallback(() => setItems([]), [])

  const value = useMemo<Ctx>(
    () => ({ items, unreadCount, open, openDrawer, closeDrawer, add, addToast, markRead, markAllRead, remove, clearAll }),
    [items, unreadCount, open, openDrawer, closeDrawer, add, addToast, markRead, markAllRead, remove, clearAll]
  )

  return <NotificationsCtx.Provider value={value}>{children}</NotificationsCtx.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationsCtx)
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider')
  return ctx
}