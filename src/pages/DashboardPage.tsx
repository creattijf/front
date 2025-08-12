import { useMemo, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getTasks } from '../api/tasksApi'
import type { Task } from '../types'
import {
  Box,
  Card,
  CardContent,
  Container,
  Grid,
  Stack,
  Typography,
  Chip,
  Button,
  alpha,
  useTheme,
} from '@mui/material'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { startOfDay, endOfDay, isWithinInterval, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, parseISO, subDays, isSameDay } from 'date-fns'
import { ru } from 'date-fns/locale'
import CountUp from 'react-countup'
import { motion } from 'framer-motion'
import StarRoundedIcon from '@mui/icons-material/StarRounded'
import EmojiEventsRoundedIcon from '@mui/icons-material/EmojiEventsRounded'
import WhatshotRoundedIcon from '@mui/icons-material/WhatshotRounded'
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded'
import { celebrateCenter } from '../lib/confetti'
import Loader from '../components/Loader'

function getTaskDate(t: Task): Date | null {
  // Для статистики считаем дату по updated_at (когда статус менялся),
  // если её нет — используем due_date; если и его нет — created_at.
  const s = t.updated_at || (t.due_date ? `${t.due_date}T00:00:00` : t.created_at)
  if (!s) return null
  try {
    return parseISO(s)
  } catch {
    return null
  }
}

function rangeCount(tasks: Task[], from: Date, to: Date) {
  const all = tasks.filter((t) => {
    const d = getTaskDate(t)
    return d ? isWithinInterval(d, { start: from, end: to }) : false
  })
  const done = all.filter((t) => t.completed)
  return { all: all.length, done: done.length }
}

function makeRings(tasks: Task[]) {
  const now = new Date()
  const today = rangeCount(tasks, startOfDay(now), endOfDay(now))
  const week = rangeCount(tasks, startOfWeek(now, { weekStartsOn: 1 }), endOfWeek(now, { weekStartsOn: 1 }))
  const month = rangeCount(tasks, startOfMonth(now), endOfMonth(now))
  return [
    { key: 'today', label: 'Сегодня', ...today },
    { key: 'week', label: 'Неделя', ...week },
    { key: 'month', label: 'Месяц', ...month },
  ].map((r) => ({ ...r, pct: r.all ? Math.round((r.done / r.all) * 100) : 0 }))
}

function makeSeries(tasks: Task[]) {
  // Последние 14 дней: кол-во завершённых задач в день
  const now = new Date()
  const days = Array.from({ length: 14 }, (_, i) => subDays(now, 13 - i))
  const map = new Map<string, number>()
  for (const d of days) {
    map.set(format(d, 'yyyy-MM-dd'), 0)
  }
  tasks.forEach((t) => {
    if (!t.completed) return
    const d = getTaskDate(t)
    if (!d) return
    const key = format(d, 'yyyy-MM-dd')
    if (map.has(key)) map.set(key, (map.get(key) || 0) + 1)
  })
  return days.map((d) => ({
    date: format(d, 'dd MMM', { locale: ru }),
    value: map.get(format(d, 'yyyy-MM-dd')) || 0,
  }))
}

function calcStreak(tasks: Task[]) {
  // Стрик: сколько подряд дней (до сегодня) были завершённые задачи
  const doneDates = new Set(
    tasks
      .filter((t) => t.completed)
      .map((t) => {
        const d = getTaskDate(t)
        return d ? format(d, 'yyyy-MM-dd') : ''
      })
      .filter(Boolean)
  )
  let streak = 0
  let day = new Date()
  while (true) {
    const key = format(day, 'yyyy-MM-dd')
    if (doneDates.has(key)) {
      streak += 1
      day = subDays(day, 1)
    } else {
      break
    }
  }
  return streak
}

function calcAchievements(tasks: Task[]) {
  const totalDone = tasks.filter((t) => t.completed).length
  const streak = calcStreak(tasks)

  return [
    {
      key: 'first5',
      label: 'Первые 5 задач',
      desc: 'Отличное начало!',
      unlocked: totalDone >= 5,
      icon: <StarRoundedIcon />,
      color: '#7C3AED',
    },
    {
      key: 'streak7',
      label: 'Серия 7 дней',
      desc: 'Вы в огне!',
      unlocked: streak >= 7,
      icon: <WhatshotRoundedIcon />,
      color: '#F59E0B',
    },
    {
      key: 'total25',
      label: '25 задач',
      desc: 'Сильный прогресс',
      unlocked: totalDone >= 25,
      icon: <EmojiEventsRoundedIcon />,
      color: '#22C55E',
    },
  ]
}

function RingCard({ label, pct, done, all }: { label: string; pct: number; done: number; all: number }) {
  const t = useTheme()
  const size = 140
  const thickness = 12
  const bg = t.palette.mode === 'dark' ? alpha('#fff', 0.08) : alpha('#000', 0.06)
  const gradient = `conic-gradient(${t.palette.primary.main} ${pct}%, ${alpha(t.palette.primary.main, 0.15)} ${pct}% 100%)`

  return (
    <Card
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        backdropFilter: 'saturate(160%) blur(16px)',
        background: t.palette.mode === 'dark' ? alpha('#0E1324', 0.5) : alpha('#FFFFFF', 0.75),
        border: `1px solid ${alpha(t.palette.mode === 'dark' ? '#FFFFFF' : '#0B1021', 0.12)}`,
      }}
    >
      <Stack alignItems="center" spacing={1.5}>
        <Typography variant="subtitle2" color="text.secondary">
          {label}
        </Typography>
        <Box
          sx={{
            position: 'relative',
            width: size,
            height: size,
            borderRadius: '50%',
            background: gradient,
            transition: 'background .6s ease',
            display: 'grid',
            placeItems: 'center',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: thickness,
              borderRadius: '50%',
              background: t.palette.background.paper,
            },
          }}
        >
          <Stack alignItems="center" sx={{ zIndex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1 }}>
              <CountUp end={pct} duration={1.1} />%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {done}/{all}
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Card>
  )
}

function MiniChart({ data }: { data: { date: string; value: number }[] }) {
  const t = useTheme()
  return (
    <Card
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 3,
        height: '100%',
        backdropFilter: 'saturate(160%) blur(16px)',
        background: t.palette.mode === 'dark' ? alpha('#0E1324', 0.5) : alpha('#FFFFFF', 0.75),
        border: `1px solid ${alpha(t.palette.mode === 'dark' ? '#FFFFFF' : '#0B1021', 0.12)}`,
      }}
    >
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Завершения (14 дней)
      </Typography>
      <Box sx={{ height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ left: 0, right: 0, top: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={t.palette.primary.main} stopOpacity={0.6} />
                <stop offset="100%" stopColor={t.palette.primary.main} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} width={24} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke={t.palette.primary.main} fill="url(#g1)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </Card>
  )
}

function Badge({ unlocked, label, desc, icon, color }: { unlocked: boolean; label: string; desc: string; icon: React.ReactNode; color: string }) {
  const t = useTheme()
  return (
    <motion.div
      initial={{ rotateY: 0 }}
      whileHover={{ rotateY: 10, translateY: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      style={{ transformStyle: 'preserve-3d' }}
    >
      <Card
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          minHeight: 110,
          position: 'relative',
          overflow: 'hidden',
          backdropFilter: 'saturate(160%) blur(16px)',
          background: unlocked ? alpha(color, 0.08) : alpha('#000', t.palette.mode === 'dark' ? 0.15 : 0.04),
          border: `1px solid ${alpha(unlocked ? color : t.palette.text.primary, 0.2)}`,
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            opacity: unlocked ? 0.4 : 0,
            background: `radial-gradient(400px 200px at 0% 0%, ${alpha(color, 0.4)}, transparent 60%)`,
          }}
        />
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 1.5,
              display: 'grid',
              placeItems: 'center',
              background: unlocked
                ? `linear-gradient(135deg, ${alpha(color, 0.9)}, ${alpha(color, 0.6)})`
                : alpha(t.palette.text.primary, 0.1),
              color: unlocked ? '#fff' : alpha(t.palette.text.primary, 0.6),
              boxShadow: unlocked ? '0 8px 20px rgba(0,0,0,.2)' : 'none',
            }}
          >
            {icon}
          </Box>
          <Stack>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              {label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {desc}
            </Typography>
          </Stack>
          <Chip
            size="small"
            label={unlocked ? 'Открыто' : 'Заблокировано'}
            color={unlocked ? 'success' : 'default'}
            sx={{ ml: 'auto' }}
          />
        </Stack>
      </Card>
    </motion.div>
  )
}

export default function DashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ['tasks'], queryFn: getTasks })
  const tasks = data || []
  const t = useTheme()

  // Кольца
  const rings = useMemo(() => makeRings(tasks), [tasks])

  // Серия (14 дней)
  const series = useMemo(() => makeSeries(tasks), [tasks])

  // Ачивки
  const ach = useMemo(() => calcAchievements(tasks), [tasks])

  // Конфетти при первом открытии новых ачивок (раз за сессию)
  useEffect(() => {
    const sessionKey = 'ach_confetti_shown'
    const already = sessionStorage.getItem(sessionKey)
    const anyNew = ach.some((a) => a.unlocked)
    if (!already && anyNew) {
      celebrateCenter({ scale: 1.2 })
      sessionStorage.setItem(sessionKey, '1')
    }
  }, [ach])

  if (isLoading) return <Loader fullscreen />

  const todayDone = rings.find((r) => r.key === 'today')?.done || 0

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <Button href="/tasks" startIcon={<ArrowBackRoundedIcon />}>
          К задачам
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Дашборд
        </Typography>
        <Chip
          size="small"
          label={`Сегодня: ${todayDone}`}
          color="primary"
          sx={{ ml: 1, borderRadius: 1.5 }}
        />
      </Stack>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {rings.map((r) => (
          <Grid item xs={12} sm={6} md={4} key={r.key}>
            <RingCard label={r.label} pct={r.pct} done={r.done} all={r.all} />
          </Grid>
        ))}
        <Grid item xs={12} md={12}>
          <MiniChart data={series} />
        </Grid>
      </Grid>

      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
        Ачивки и серия
      </Typography>
      <Grid container spacing={2}>
        {ach.map((a) => (
          <Grid item xs={12} sm={6} md={4} key={a.key}>
            <Badge unlocked={a.unlocked} label={a.label} desc={a.desc} icon={a.icon} color={a.color} />
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}