// src/components/notifications/NotificationDrawer.tsx
import { useEffect, useMemo, useState } from 'react'
import {
  Box, Drawer, Stack, Typography, IconButton, List, ListItem, ListItemAvatar, Avatar, ListItemText,
  Divider, Button, Chip, Skeleton, Tooltip, alpha, useTheme
} from '@mui/material'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import InfoRoundedIcon from '@mui/icons-material/InfoRounded'
import WarningAmberRoundedIcon from '@mui/icons-material/WarningAmberRounded'
import ErrorRoundedIcon from '@mui/icons-material/ErrorRounded'
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded'
import DeleteSweepRoundedIcon from '@mui/icons-material/DeleteSweepRounded'
import CloseRoundedIcon from '@mui/icons-material/CloseRounded'
import { formatDistanceToNowStrict, isToday, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useNotifications, AppNotification } from '../../providers/NotificationsProvider'

function typeMeta(type: AppNotification['type'], t: ReturnType<typeof useTheme>) {
  switch (type) {
    case 'success':
      return { icon: <CheckCircleRoundedIcon />, bg: alpha('#22C55E', 0.1), fg: '#22C55E' }
    case 'warning':
      return { icon: <WarningAmberRoundedIcon />, bg: alpha('#F59E0B', 0.1), fg: '#F59E0B' }
    case 'error':
      return { icon: <ErrorRoundedIcon />, bg: alpha('#EF4444', 0.12), fg: '#EF4444' }
    default:
      return { icon: <InfoRoundedIcon />, bg: alpha(t.palette.primary.main, 0.12), fg: t.palette.primary.main }
  }
}

export default function NotificationDrawer() {
  const { items, open, closeDrawer, markRead, markAllRead, remove, clearAll } = useNotifications()
  const t = useTheme()

  // “загрузка” при открытии — показываем Skeleton shimmer
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (open) {
      setLoading(true)
      const id = setTimeout(() => setLoading(false), 400)
      return () => clearTimeout(id)
    }
  }, [open])

  const grouped = useMemo(() => {
    const today: AppNotification[] = []
    const earlier: AppNotification[] = []
    for (const n of items) {
      const dt = n.createdAt ? parseISO(n.createdAt) : new Date()
      if (isToday(dt)) today.push(n)
      else earlier.push(n)
    }
    return { today, earlier }
  }, [items])

  const renderItem = (n: AppNotification) => {
    const m = typeMeta(n.type, t)
    const dt = n.createdAt ? parseISO(n.createdAt) : new Date()
    const timeAgo = formatDistanceToNowStrict(dt, { addSuffix: true, locale: ru })

    return (
      <ListItem
        key={n.id}
        alignItems="flex-start"
        sx={{
          borderRadius: 2,
          mb: 1,
          bgcolor: n.read ? 'transparent' : alpha(m.fg, 0.06),
          border: `1px solid ${alpha(n.read ? t.palette.divider : m.fg, n.read ? 0.4 : 0.35)}`,
          transition: 'background .2s, border-color .2s, transform .08s',
          '&:hover': { transform: 'translateY(-1px)' },
        }}
        secondaryAction={
          <Stack direction="row" spacing={0.5}>
            {!n.read && (
              <Tooltip title="Отметить как прочитанное">
                <IconButton size="small" onClick={() => markRead(n.id)}>
                  <MarkEmailReadRoundedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Удалить">
              <IconButton size="small" color="error" onClick={() => remove(n.id)}>
                <CloseRoundedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        }
      >
        <ListItemAvatar>
          <Avatar sx={{ bgcolor: m.bg, color: m.fg }}>{m.icon}</Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {n.title || (n.type === 'success' ? 'Успех' : n.type === 'error' ? 'Ошибка' : n.type === 'warning' ? 'Предупреждение' : 'Инфо')}
              </Typography>
              {!n.read && <Chip size="small" label="Новая" color="primary" variant="outlined" sx={{ height: 20 }} />}
              <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                {timeAgo}
              </Typography>
            </Stack>
          }
          secondary={<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{n.message}</Typography>}
        />
      </ListItem>
    )
  }

  const renderSkeleton = () => (
    <Stack spacing={1.5}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Stack direction="row" spacing={1.5} key={i} sx={{ alignItems: 'flex-start' }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Stack sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="90%" />
          </Stack>
        </Stack>
      ))}
    </Stack>
  )

  return (
    <Drawer anchor="right" open={open} onClose={closeDrawer} PaperProps={{
      sx: {
        width: { xs: 340, sm: 380, md: 420 },
        p: 2,
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
        backdropFilter: 'saturate(160%) blur(14px)',
        background: t.palette.mode === 'dark' ? alpha('#0E1324', 0.6) : alpha('#FFFFFF', 0.8),
        borderLeft: `1px solid ${alpha(t.palette.mode === 'dark' ? '#FFFFFF' : '#0B1021', 0.12)}`,
      },
    }}>
      <Stack spacing={2} sx={{ height: '100%' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="h6" sx={{ fontWeight: 800 }}>Уведомления</Typography>
          <Box sx={{ flex: 1 }} />
          <Tooltip title="Прочитать всё">
            <IconButton size="small" onClick={markAllRead}><MarkEmailReadRoundedIcon /></IconButton>
          </Tooltip>
          <Tooltip title="Очистить всё">
            <IconButton size="small" color="error" onClick={clearAll}><DeleteSweepRoundedIcon /></IconButton>
          </Tooltip>
        </Stack>

        <Divider />

        {loading ? (
          renderSkeleton()
        ) : (
          <Stack spacing={2} sx={{ overflowY: 'auto' }}>
            <Box>
              <Typography variant="overline" sx={{ opacity: 0.7 }}>Сегодня</Typography>
              <List sx={{ mt: 1, p: 0 }}>
                {grouped.today.length === 0
                  ? <Typography variant="body2" color="text.secondary">Пока нет</Typography>
                  : grouped.today.map(renderItem)}
              </List>
            </Box>

            <Box>
              <Typography variant="overline" sx={{ opacity: 0.7 }}>Ранее</Typography>
              <List sx={{ mt: 1, p: 0 }}>
                {grouped.earlier.length === 0
                  ? <Typography variant="body2" color="text.secondary">Пока нет</Typography>
                  : grouped.earlier.map(renderItem)}
              </List>
            </Box>
          </Stack>
        )}
      </Stack>
    </Drawer>
  )
}