// src/components/Header.tsx
import { useState } from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Tooltip,
  Avatar,
  Stack,
  useTheme,
} from '@mui/material'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import LogoutIcon from '@mui/icons-material/Logout'
import LoginIcon from '@mui/icons-material/Login'
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt'
import PaletteIcon from '@mui/icons-material/Palette'
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded'
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded'
import SearchIcon from '@mui/icons-material/Search'
import { alpha } from '@mui/material/styles'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../providers/AuthProvider'
import { useThemeCustomization } from '../providers/ColorModeProvider'

import ThemeSettingsDialog from './settings/ThemeSettingsDialog'
import NotificationBell from './notifications/NotificationBell'
import NotificationDrawer from './notifications/NotificationDrawer'
import CommandPalette from './CommandPalette'

export default function Header() {
  const theme = useTheme()
  const { isAuthenticated, email, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const { mode, setMode } = useThemeCustomization()

  const [themeOpen, setThemeOpen] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)

  const toggleMode = () => setMode(mode === 'dark' ? 'light' : 'dark')

  const goTasks = () => navigate('/tasks')
  const goDashboard = () => navigate('/dashboard')
  const onLogin = () => navigate('/login')
  const onRegister = () => navigate('/register')

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <>
      <AppBar position="sticky" color="transparent" elevation={0}>
        <Toolbar
          sx={{
            display: 'flex',
            gap: 2,
            backdropFilter: 'saturate(160%) blur(8px)',
            borderBottom: `1px solid ${alpha(theme.palette.mode === 'dark' ? '#FFFFFF' : '#0B1021', 0.08)}`,
          }}
        >
          {/* Брендинг */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer' }}
            onClick={() => navigate(isAuthenticated ? '/tasks' : '/login')}
          >
            <Avatar
              variant="rounded"
              sx={{
                width: 28,
                height: 28,
                borderRadius: 2,
                background: (t) =>
                  `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
                boxShadow: '0 6px 16px rgba(124,58,237,.35)',
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                background: (t) =>
                  `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: 0.4,
              }}
            >
              ToDo
            </Typography>
          </Box>

          {/* Навигация (только после входа) */}
          {isAuthenticated && (
            <Stack direction="row" spacing={1} sx={{ ml: 1, display: { xs: 'none', sm: 'flex' } }}>
              <Button
                size="small"
                startIcon={<ViewListRoundedIcon />}
                onClick={goTasks}
                variant={isActive('/tasks') ? 'contained' : 'text'}
                color={isActive('/tasks') ? 'primary' : 'inherit'}
                sx={{
                  borderRadius: 2,
                  ...(isActive('/tasks') && {
                    boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                  }),
                }}
              >
                Список
              </Button>
              <Button
                size="small"
                startIcon={<DashboardRoundedIcon />}
                onClick={goDashboard}
                variant={isActive('/dashboard') ? 'contained' : 'text'}
                color={isActive('/dashboard') ? 'primary' : 'inherit'}
                sx={{
                  borderRadius: 2,
                  ...(isActive('/dashboard') && {
                    boxShadow: `0 6px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                  }),
                }}
              >
                Дашборд
              </Button>
            </Stack>
          )}

          <Box sx={{ flexGrow: 1 }} />

          {/* Командная палитра */}
          <Tooltip title="Командная палитра (Ctrl/Cmd + K)">
            <IconButton color="inherit" size="small" onClick={() => setCmdOpen(true)}>
              <SearchIcon />
            </IconButton>
          </Tooltip>

          {/* Уведомления */}
          <NotificationBell />

          {/* Настройки темы */}
          <Tooltip title="Настройки темы">
            <IconButton color="inherit" size="small" onClick={() => setThemeOpen(true)}>
              <PaletteIcon />
            </IconButton>
          </Tooltip>

          {/* Светлая/тёмная */}
          <Tooltip title={mode === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
            <IconButton onClick={toggleMode} color="inherit" size="small">
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          {/* Авторизация */}
          {isAuthenticated ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="body2" sx={{ opacity: 0.85, display: { xs: 'none', sm: 'block' } }}>
                {email}
              </Typography>
              <Tooltip title="Выйти">
                <IconButton color="inherit" onClick={logout} size="small">
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button color="inherit" startIcon={<LoginIcon />} onClick={onLogin}>
                Войти
              </Button>
              <Button color="inherit" startIcon={<PersonAddAltIcon />} onClick={onRegister}>
                Регистрация
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      {/* Модалки/оверлеи */}
      <ThemeSettingsDialog open={themeOpen} onClose={() => setThemeOpen(false)} />
      <NotificationDrawer />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </>
  )
}