import { useState } from 'react'
import {
  Box, Button, Checkbox, FormControlLabel, IconButton, InputAdornment, Stack, TextField, Typography, Alert, Divider
} from '@mui/material'
import AlternateEmailIcon from '@mui/icons-material/AlternateEmail'
import LockIcon from '@mui/icons-material/LockOutlined'
import VisibilityOff from '@mui/icons-material/VisibilityOff'
import Visibility from '@mui/icons-material/Visibility'
import GoogleIcon from '@mui/icons-material/Google'
import GitHubIcon from '@mui/icons-material/GitHub'
import { useAuth } from '../providers/AuthProvider'
import { useNavigate, Link } from 'react-router-dom'
import AuthLayoutPro from '../components/auth/AuthLayoutPro'
import { keyframes } from '@mui/system'

const shine = keyframes`
  0% { transform: translateX(-150%); }
  100% { transform: translateX(150%); }
`

export default function LoginPage() {
  const { login } = useAuth()
  const [loginStr, setLoginStr] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

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
    setLoading(true)
    const ok = await login(loginStr, password)
    setLoading(false)
    if (ok) navigate('/tasks')
    else setError('Неверный логин/пароль')
  }

  return (
    <AuthLayoutPro
      title="Добро пожаловать 👋"
      subtitle="Войдите по email или username, чтобы продолжить"
    >
      <Box component="form" onSubmit={handleSubmit}>
        <Stack spacing={2.2}>
          <TextField
            label="Email или Username"
            value={loginStr}
            onChange={(e) => setLoginStr(e.target.value)}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AlternateEmailIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={fieldSx}
            autoFocus
            fullWidth
          />

          <TextField
            label="Пароль"
            type={showPass ? 'text' : 'password'}
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
                  <IconButton aria-label="показать пароль" onClick={() => setShowPass((s) => !s)} edge="end" size="small">
                    {showPass ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={fieldSx}
            fullWidth
          />

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <FormControlLabel
              control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} />}
              label="Запомнить меня"
            />
            <Typography variant="body2" sx={{ opacity: .7 }}>Забыли пароль?</Typography>
          </Stack>

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
                top: 0,
                left: 0,
                width: '40%',
                height: '100%',
                background: 'linear-gradient(120deg, rgba(255,255,255,.22), rgba(255,255,255,0))',
                transform: 'translateX(-150%)',
                animation: `${shine} 1.8s ease-in-out 400ms infinite`,
                pointerEvents: 'none',
              },
            }}
          >
            {loading ? 'Входим...' : 'Войти'}
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
            Нет аккаунта? <Link to="/register">Зарегистрируйтесь</Link>
          </Typography>
        </Stack>
      </Box>
    </AuthLayoutPro>
  )
}