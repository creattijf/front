import { useState, useMemo } from 'react'
import {
  Box, Button, IconButton, InputAdornment, LinearProgress, Stack, TextField, Typography, Alert, Divider
} from '@mui/material'
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import PersonOutlineIcon from '@mui/icons-material/PersonOutline'
import LockIcon from '@mui/icons-material/LockOutlined'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import Visibility from '@mui/icons-material/Visibility'
import { useAuth } from '../providers/AuthProvider'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayoutPro from '../components/auth/AuthLayoutPro'
import { keyframes } from '@mui/system'
import GoogleIcon from '@mui/icons-material/Google'
import GitHubIcon from '@mui/icons-material/GitHub'

const shine = keyframes`
  0% { transform: translateX(-150%); }
  100% { transform: translateX(150%); }
`

function estimateStrength(pw: string) {
  let s = 0
  if (pw.length >= 8) s += 25
  if (/[A-Z]/.test(pw)) s += 20
  if (/[a-z]/.test(pw)) s += 15
  if (/\d/.test(pw)) s += 20
  if (/[^A-Za-z0-9]/.test(pw)) s += 20
  return Math.min(100, s)
}

export default function RegisterPage() {
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPass1, setShowPass1] = useState(false)
  const [showPass2, setShowPass2] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  const strength = useMemo(() => estimateStrength(password), [password])
  const strengthColor = strength > 70 ? 'success' : strength > 45 ? 'warning' : 'error'
  const mismatch = password && password2 && password !== password2

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2.5,
      backgroundColor: 'rgba(255,255,255,0.04)',
      '& fieldset': { borderColor: 'divider' },
      '&:hover fieldset': { borderColor: 'primary.main' },
      '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: 2 },
    },
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (mismatch) {
      setError('Пароли не совпадают')
      return
    }
    setLoading(true)
    const ok = await register(email, username, password, password2)
    setLoading(false)
    if (ok) navigate('/tasks')
    else setError('Не удалось зарегистрироваться. Проверьте корректность данных.')
  }

  return (
    <AuthLayoutPro
      title="Создать аккаунт ✨"
      subtitle="Быстрый старт и красивый интерфейс для задач"
    >
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2.2}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AlternateEmailIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={fieldSx}
            fullWidth
          />

          <TextField
            label="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonOutlineIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={fieldSx}
            fullWidth
          />

          <Stack spacing={1}>
            <TextField
              label="Пароль"
              type={showPass1 ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton aria-label="показать пароль" onClick={() => setShowPass1((s) => !s)} edge="end" size="small">
                      {showPass1 ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={fieldSx}
              fullWidth
            />
            <Stack direction="row" alignItems="center" spacing={1}>
              <LinearProgress
                variant="determinate"
                value={strength}
                color={strengthColor as any}
                sx={{
                  flex: 1,
                  height: 8,
                  borderRadius: 999,
                  '& .MuiLinearProgress-bar': { borderRadius: 999 },
                }}
              />
              <Typography variant="caption" sx={{ minWidth: 64, textAlign: 'right', opacity: .75 }}>
                {strength >= 80 ? 'сильный' : strength >= 50 ? 'норм' : 'слабый'}
              </Typography>
            </Stack>
          </Stack>

          <TextField
            label="Повторите пароль"
            type={showPass2 ? 'text' : 'password'}
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            error={Boolean(mismatch)}
            helperText={mismatch ? 'Пароли не совпадают' : ' '}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton aria-label="показать пароль" onClick={() => setShowPass2((s) => !s)} edge="end" size="small">
                    {showPass2 ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={fieldSx}
            fullWidth
          />

          {error && <Alert severity="error">{error}</Alert>}

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            size="large"
            sx={{
              position: 'relative',
              overflow: 'hidden',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0, left: 0,
                width: '40%', height: '100%',
                background: 'linear-gradient(120deg, rgba(255,255,255,.22), rgba(255,255,255,0))',
                transform: 'translateX(-150%)',
                animation: `${shine} 1.8s ease-in-out 400ms infinite`,
                pointerEvents: 'none',
              },
            }}
          >
            {loading ? 'Создаем...' : 'Зарегистрироваться'}
          </Button>

          <Stack direction="row" alignItems="center" spacing={2} sx={{ my: .5 }}>
            <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
            <Typography variant="caption" color="text.secondary">или продолжить с</Typography>
            <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
          </Stack>

          <Stack direction="row" spacing={1.2}>
            <Button fullWidth variant="outlined" startIcon={<GoogleIcon />} sx={{ borderWidth: 2 }}>
              Google
            </Button>
            <Button fullWidth variant="outlined" startIcon={<GitHubIcon />} sx={{ borderWidth: 2 }}>
              GitHub
            </Button>
          </Stack>

          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            Уже есть аккаунт? <Link to="/login">Войдите</Link>
          </Typography>
        </Stack>
      </Box>
    </AuthLayoutPro>
  )
}