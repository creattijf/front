// src/components/notifications/NotificationBell.tsx
import { Badge, IconButton, Tooltip } from '@mui/material'
import NotificationsRoundedIcon from '@mui/icons-material/NotificationsRounded'
import { useNotifications } from '../../providers/NotificationsProvider'

export default function NotificationBell() {
  const { unreadCount, openDrawer } = useNotifications()
  return (
    <Tooltip title="Уведомления">
      <IconButton color="inherit" size="small" onClick={openDrawer}>
        <Badge badgeContent={unreadCount} color="error" max={99}>
          <NotificationsRoundedIcon />
        </Badge>
      </IconButton>
    </Tooltip>
  )
}