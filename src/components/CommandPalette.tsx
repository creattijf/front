// src/components/CommandPalette.tsx
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Dialog, Paper, InputBase, List, ListItemButton, ListItemIcon, ListItemText,
  Stack, Typography, Chip, alpha, useTheme, Box, Divider, Skeleton, Tooltip, IconButton
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import AddCircleRoundedIcon from '@mui/icons-material/AddCircleRounded'
import TodayRoundedIcon from '@mui/icons-material/TodayRounded'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded'
import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded'
import FilterAltRoundedIcon from '@mui/icons-material/FilterAltRounded'
import TagRoundedIcon from '@mui/icons-material/TagRounded'
import PriorityHighRoundedIcon from '@mui/icons-material/PriorityHighRounded'
import InfoRoundedIcon from '@mui/icons-material/InfoRounded'
import { motion, AnimatePresence } from 'framer-motion'
import Fuse from 'fuse.js'
import { useHotkeys } from 'react-hotkeys-hook'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import * as chrono from 'chrono-node' // ВАЖНО: namespace-импорт
import { useQuery } from '@tanstack/react-query'
import { getTasks } from '../api/tasksApi'
import type { Task } from '../types'

type Item =
  | { kind: 'task'; task: Task; matches?: Fuse.FuseResultMatch[] }
  | { kind: 'action'; id: string; label: string; icon: React.ReactNode; run: () => void }
  | { kind: 'view'; id: string; label: string; icon: React.ReactNode; run: () => void }
  | { kind: 'history'; q: string }

type Props = {
  open: boolean
  onClose: () => void
  onCreateQuick?: (payload: {
    title: string
    date?: Date | null
    tags?: string[]
    priority?: 'high' | 'medium' | 'low' | null
  }) => void
}

const MRU_KEY = 'cmd_palette_mru_v1'
const listVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.05 } } }
const itemVariants = { hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }

function loadMRU(): string[] {
  try {
    const raw = localStorage.getItem(MRU_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}
function saveMRU(arr: string[]) {
  try { localStorage.setItem(MRU_KEY, JSON.stringify(arr.slice(0, 8))) } catch {}
}

function highlight(text: string, matches?: Fuse.FuseResultMatch[], key?: string) {
  if (!matches || !key) return text
  const m = matches.find((mm) => mm.key === key)
  if (!m || !m.indices?.length) return text
  const parts: React.ReactNode[] = []
  let last = 0
  m.indices.forEach(([start, end], i) => {
    if (start > last) parts.push(<span key={`n-${i}-${last}`}>{text.slice(last, start)}</span>)
    parts.push(
      <mark key={`m-${i}-${start}`} style={{ background: 'transparent', color: 'inherit', padding: 0 }}>
        <span style={{ background: 'linear-gradient(90deg, rgba(124,58,237,.28), rgba(6,182,212,.28))', borderRadius: 4 }}>
          {text.slice(start, end + 1)}
        </span>
      </mark>
    )
    last = end + 1
  })
  if (last < text.length) parts.push(<span key={`t-${last}`}>{text.slice(last)}</span>)
  return <>{parts}</>
}

function parseQuick(s: string) {
  const tags = [...s.matchAll(/#([\p{L}\d_-]+)/giu)].map((m) => m[1])
  const prioRaw = s.match(/!(high|low|med|medium|высокий|низкий|средний)/i)?.[1]?.toLowerCase()
  const priority =
    prioRaw === 'high' || prioRaw === 'высокий' ? 'high' :
    prioRaw === 'low' || prioRaw === 'низкий' ? 'low' :
    prioRaw ? 'medium' : null
  const date = (chrono as any).ru?.parseDate?.(s) || chrono.parseDate(s)
  const title = s
    .replace(/#([\p{L}\d_-]+)/giu, '')
    .replace(/!(high|low|med|medium|высокий|низкий|средний)/gi, '')
    .trim()
  return { title, tags, priority, date }
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <Box
      component="kbd"
      sx={{
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        fontSize: 11,
        px: .75,
        py: .25,
        borderRadius: 1,
        border: '1px solid rgba(0,0,0,.2)',
        boxShadow: 'inset 0 -1px 0 rgba(0,0,0,.2)',
        background: 'linear-gradient(#fff, #f3f3f3)',
      }}
    >
      {children}
    </Box>
  )
}

export default function CommandPalette({ open, onClose, onCreateQuick }: Props) {
  const t = useTheme()
  const nav = useNavigate()
  const { data, isLoading } = useQuery({ queryKey: ['tasks'], queryFn: getTasks })
  const tasks = data || []

  const actionsBase: Item[] = useMemo(
    () => [
      { kind: 'view', id: 'today', label: 'Фильтр: Сегодня', icon: <TodayRoundedIcon />, run: () => nav('/tasks?view=today') },
      { kind: 'view', id: 'dashboard', label: 'Перейти: Дашборд', icon: <DashboardRoundedIcon />, run: () => nav('/dashboard') },
      { kind: 'action', id: 'notify', label: 'Открыть уведомления', icon: <NotificationsRoundedIcon />, run: () => nav('/tasks#notifications') },
      { kind: 'action', id: 'filters', label: 'Фильтры: Настроить', icon: <FilterAltRoundedIcon />, run: () => nav('/tasks#filters') },
    ],
    [nav]
  )

  const fuse = useMemo(() => new Fuse<Task>(tasks, {
    keys: ['title', 'description'],
    threshold: 0.35,
    ignoreLocation: true,
    includeMatches: true,
    minMatchCharLength: 2,
  }), [tasks])

  const [q, setQ] = useState('')
  const [cursor, setCursor] = useState(0)
  const [mru, setMru] = useState<string[]>(() => loadMRU())
  const inputRef = useRef<HTMLInputElement>(null)

  // РЕЗУЛЬТАТЫ — СЧИТАЕМ ДО useHotkeys
  const results: Item[] = useMemo(() => {
    const base: Item[] = []
    if (q.trim().length > 0) {
      const parsed = parseQuick(q)
      if (parsed.title) {
        base.push({
          kind: 'action',
          id: 'create-quick',
          label:
            `Создать: “${parsed.title}”` +
            (parsed.date ? ` · ${format(parsed.date, 'd MMM HH:mm', { locale: ru })}` : '') +
            (parsed.priority ? ` · !${parsed.priority}` : ''),
          icon: <AddCircleRoundedIcon />,
          run: () => {
            if (onCreateQuick) onCreateQuick({ title: parsed.title, date: parsed.date || undefined, tags: parsed.tags, priority: parsed.priority as any })
            else nav('/tasks')
          },
        })
      }
      const hits = fuse.search(q, { limit: 8 })
      base.push(...hits.map(h => ({ kind: 'task', task: h.item, matches: h.matches }) as Item))
      base.push(...actionsBase)
    } else {
      if (mru.length) {
        base.push(...mru.map((qq) => ({ kind: 'history', q: qq } as Item)))
      } else {
        base.push(...actionsBase)
      }
      base.push(...tasks.slice(0, 6).map((task) => ({ kind: 'task', task } as Item)))
    }
    return base
  }, [q, fuse, actionsBase, tasks, mru, onCreateQuick, nav])

  const total = results.length

  function commitMRU(raw: string) {
    const s = raw.trim()
    if (!s) return
    const next = [s, ...mru.filter((x) => x.toLowerCase() !== s.toLowerCase())].slice(0, 8)
    setMru(next)
    saveMRU(next)
  }

  const handleEnter = () => {
    const it = results[cursor]
    if (!it) return
    if (it.kind === 'task') {
      nav('/tasks')
      onClose()
    } else if (it.kind === 'history') {
      setQ(it.q)
      setCursor(0)
    } else {
      it.run()
      commitMRU(q)
      onClose()
    }
  }

  // хоткеи — ПОСЛЕ results/handleEnter
  useHotkeys('mod+k', (e) => { e.preventDefault(); if (!open) { setQ(''); setCursor(0) } }, { enableOnFormTags: true }, [open])
  useHotkeys('esc', () => open && onClose(), {}, [open])
  useHotkeys('down', () => open && setCursor((c) => Math.min(c + 1, Math.max(total - 1, 0))), {}, [open, total])
  useHotkeys('up', () => open && setCursor((c) => Math.max(c - 1, 0)), {}, [open])
  useHotkeys('enter', () => open && handleEnter(), {}, [open, cursor, q, total])

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 0) }, [open])

  const tokenInfo = useMemo(() => parseQuick(q), [q])

  const glassPaper = {
    p: 0,
    borderRadius: 3,
    backdropFilter: 'saturate(160%) blur(16px)',
    background: t.palette.mode === 'dark' ? alpha('#0E1324', 0.72) : alpha('#FFFFFF', 0.9),
    border: `1px solid ${alpha(t.palette.mode === 'dark' ? '#FFFFFF' : '#0B1021', 0.12)}`,
    overflow: 'hidden',
    position: 'relative' as const,
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: glassPaper }}>
      <Paper elevation={0} sx={{ px: 2, py: 1.5, borderRadius: 'inherit', borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <SearchIcon sx={{ opacity: 0.7 }} />
          <InputBase
            inputRef={inputRef}
            placeholder='Поиск или команда… (например, "создать завтра 9:00 #звонки !high")'
            fullWidth
            value={q}
            onChange={(e) => { setQ(e.target.value); setCursor(0) }}
            sx={{ fontSize: 16 }}
          />
        </Stack>
        {!!(tokenInfo.tags.length || tokenInfo.priority || tokenInfo.date) && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1, pl: 4 }}>
            {tokenInfo.tags.map((tag) => (
              <Chip key={tag} size="small" icon={<TagRoundedIcon />} label={`#${tag}`} />
            ))}
            {tokenInfo.priority && (
              <Chip size="small" icon={<PriorityHighRoundedIcon />} color="warning" label={`!${tokenInfo.priority}`} />
            )}
            {tokenInfo.date && (
              <Chip size="small" label={format(tokenInfo.date, 'd MMM HH:mm', { locale: ru })} />
            )}
          </Stack>
        )}
      </Paper>

      <Box sx={{ px: 1.5, py: 1 }}>
        {isLoading ? (
          <Stack spacing={1.2} sx={{ p: 2 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Stack key={i} direction="row" spacing={1.5} alignItems="center">
                <Skeleton variant="circular" width={24} height={24} />
                <Stack sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="90%" />
                </Stack>
              </Stack>
            ))}
          </Stack>
        ) : total === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
            Нет результатов
          </Typography>
        ) : (
          <motion.div variants={listVariants} initial="hidden" animate="show">
            <List sx={{ maxHeight: 420, overflowY: 'auto', pt: 0 }}>
              <AnimatePresence initial={false}>
                {results.map((it, i) => {
                  const active = i === cursor
                  const commonSx = {
                    borderRadius: 2,
                    mb: .5,
                    transition: 'background .15s, transform .08s',
                    '&.Mui-selected': { background: alpha(t.palette.primary.main, 0.12) },
                    '&:hover': { transform: 'translateY(-1px)' },
                  }
                  if (it.kind === 'history') {
                    return (
                      <motion.div key={`hist-${it.q}-${i}`} variants={itemVariants}>
                        {i === 0 && <Typography variant="overline" sx={{ opacity: .7, px: 1, display: 'block' }}>История</Typography>}
                        <ListItemButton selected={active} onMouseEnter={() => setCursor(i)} onClick={() => { setQ(it.q); setCursor(0) }} sx={commonSx}>
                          <ListItemIcon sx={{ minWidth: 36 }}><HistoryRoundedIcon sx={{ opacity: .8 }} /></ListItemIcon>
                          <ListItemText primary={it.q} primaryTypographyProps={{ fontWeight: 600 }} />
                        </ListItemButton>
                      </motion.div>
                    )
                  }
                  if (it.kind === 'task') {
                    return (
                      <motion.div key={`task-${it.task.id}`} variants={itemVariants}>
                        {i === 0 && <Typography variant="overline" sx={{ opacity: .7, px: 1, display: 'block' }}>Задачи</Typography>}
                        <ListItemButton selected={active} onMouseEnter={() => setCursor(i)} onClick={handleEnter} sx={commonSx}>
                          <ListItemIcon sx={{ minWidth: 36 }}>
                            <Chip size="small" label={it.task.completed ? '✓' : '•'} color={it.task.completed ? 'success' : 'default'} variant="outlined" />
                          </ListItemIcon>
                          <ListItemText
                            primary={highlight(it.task.title, it.matches, 'title')}
                            secondary={it.task.description ? highlight(it.task.description.length > 120 ? it.task.description.slice(0, 120) + '…' : it.task.description, it.matches, 'description') : undefined}
                            primaryTypographyProps={{ fontWeight: 600 }}
                          />
                          {it.task.due_date && <Chip size="small" label={format(new Date(it.task.due_date), 'd MMM', { locale: ru })} />}
                        </ListItemButton>
                      </motion.div>
                    )
                  }
                  return (
                    <motion.div key={`${it.kind}-${(it as any).id}-${i}`} variants={itemVariants}>
                      {i === 0 && <Typography variant="overline" sx={{ opacity: .7, px: 1, display: 'block' }}>Действия</Typography>}
                      <ListItemButton selected={active} onMouseEnter={() => setCursor(i)} onClick={handleEnter} sx={commonSx}>
                        <ListItemIcon sx={{ minWidth: 36 }}>{(it as any).icon || <InfoRoundedIcon />}</ListItemIcon>
                        <ListItemText primary={(it as any).label} primaryTypographyProps={{ fontWeight: 600 }} />
                      </ListItemButton>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </List>
          </motion.div>
        )}
      </Box>

      <Divider />
      <Stack direction="row" spacing={1} sx={{ px: 2, py: 1.5, opacity: .75, alignItems: 'center' }}>
        <Kbd>↑/↓</Kbd><Typography variant="caption">Навигация</Typography>
        <Kbd>Enter</Kbd><Typography variant="caption">Выполнить</Typography>
        <Kbd>Esc</Kbd><Typography variant="caption">Закрыть</Typography>
      </Stack>
    </Dialog>
  )
}