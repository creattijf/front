// src/components/week/WeekSidebar.tsx
import { useMemo } from 'react'
import { Box, Stack, Typography, IconButton, Chip, LinearProgress, Divider, Tooltip, Button } from '@mui/material'
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew'
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos'
import TodayIcon from '@mui/icons-material/Today'
import AddIcon from '@mui/icons-material/Add'
import { addDays, format, isSameDay, startOfWeek } from 'date-fns'
import { ru } from 'date-fns/locale'
import type { Task } from '../../types'
import { alpha, useTheme } from '@mui/material/styles'

function dayKey(d: Date) { return format(d, 'yyyy-MM-dd') }

export default function WeekSidebar({
  anchor,
  tasks,
  onPrevWeek,
  onNextWeek,
  onThisWeek,
  onQuickAdd,
  onSelectDay,       
  plannerMode,
  onToggleMode,
}: {
  anchor: Date
  tasks: Task[]
  onPrevWeek: () => void
  onNextWeek: () => void
  onThisWeek: () => void
  onQuickAdd: (date: Date) => void
  onSelectDay: (date: Date) => void  
  plannerMode: boolean
  onToggleMode: (v: boolean) => void
}) {
  const t = useTheme()
  const weekStart = startOfWeek(anchor, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  const rangeLabel = `${format(days[0], 'd MMM', { locale: ru })} — ${format(days[6], 'd MMM', { locale: ru })}`

  const grouped = useMemo(() => {
    const map = Object.fromEntries(days.map(d => [dayKey(d), [] as Task[]]))
    for (const x of tasks) {
      const k = x.due_date || ''
      if (k && map[k]) map[k].push(x)
    }
    return map as Record<string, Task[]>
  }, [tasks, anchor])

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 16,
        alignSelf: 'start',
        p: 2.25,
        borderRadius: 3,
        backdropFilter: 'saturate(160%) blur(16px)',
        background: t.palette.mode === 'dark' ? alpha('#0E1324', 0.5) : alpha('#FFFFFF', 0.75),
        border: `1px solid ${alpha(t.palette.mode === 'dark' ? '#FFFFFF' : '#0B1021', 0.12)}`,
        minWidth: { md: 320 },   
      }}
    >
      <Stack spacing={2}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>План на неделю</Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Предыдущая неделя"><IconButton size="small" onClick={onPrevWeek}><ArrowBackIosNewIcon fontSize="inherit" /></IconButton></Tooltip>
            <Tooltip title="Следующая неделя"><IconButton size="small" onClick={onNextWeek}><ArrowForwardIosIcon fontSize="inherit" /></IconButton></Tooltip>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <Chip size="small" icon={<TodayIcon />} label="Эта неделя" onClick={onThisWeek} sx={{ borderRadius: 1.5 }} />
          <Typography variant="caption" color="text.secondary">{rangeLabel}</Typography>
        </Stack>

        <Divider />

        <Stack spacing={1}>
          {days.map((d) => {
            const key = dayKey(d)
            const list = grouped[key] || []
            const total = list.length
            const done = list.filter(x => x.completed).length
            const pct = total ? Math.round(done / total * 100) : 0
            const today = isSameDay(d, new Date())

            return (
              <Box
                key={key}
                onClick={() => onSelectDay(d)}     // <— клик по дню
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.25,
                  px: 1, py: 0.75, borderRadius: 2, cursor: 'pointer',
                  transition: 'background-color .2s, transform .08s',
                  '&:hover': {
                    backgroundColor: alpha(t.palette.primary.main, today ? 0.12 : 0.06),
                  },
                  '&:active': { transform: 'scale(0.997)' },
                }}
              >
                <Stack sx={{ minWidth: 90 }}>
                  <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                    {format(d, 'EEE', { locale: ru })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {format(d, 'd MMM', { locale: ru })}
                  </Typography>
                </Stack>

                <Box sx={{ flex: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{
                      height: 8, borderRadius: 999,
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 999,
                        background: (th) => `linear-gradient(90deg, ${th.palette.primary.main}, ${th.palette.secondary.main})`,
                      },
                    }}
                  />
                </Box>

                <Chip
                  size="small"
                  label={`${done}/${total}`}
                  color={today ? 'primary' : 'default'}
                  sx={{ ml: 1 }}
                />

                <Tooltip title="Добавить задачу на день">
                  <IconButton size="small" onClick={(e) => { e.stopPropagation(); onQuickAdd(d) }}>
                    <AddIcon fontSize="inherit" />
                  </IconButton>
                </Tooltip>
              </Box>
            )
          })}
        </Stack>

        <Divider />

        <Button
          fullWidth
          variant={plannerMode ? 'contained' : 'outlined'}
          onClick={() => onToggleMode(!plannerMode)}
          sx={{ borderWidth: plannerMode ? 0 : 2 }}
        >
          {plannerMode ? 'Режим: Неделя' : 'Режим: Список'}
        </Button>
      </Stack>
    </Box>
  )
}