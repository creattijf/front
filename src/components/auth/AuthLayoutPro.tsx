import { ReactNode } from 'react'
import {
  Box,
  Grid,
  Paper,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material'
import { useTheme, alpha } from '@mui/material/styles'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import { keyframes } from '@mui/system'
import { motion as m } from 'framer-motion'

type Props = {
  title: string
  subtitle?: string
  children: ReactNode
}

const float = keyframes`
  0% { transform: translateY(0) }
  50% { transform: translateY(-16px) }
  100% { transform: translateY(0) }
`

export default function AuthLayoutPro({ title, subtitle, children }: Props) {
  const t = useTheme()
  const isDark = t.palette.mode === 'dark'
  const mdUp = useMediaQuery(t.breakpoints.up('md'))

  return (
    <Grid container sx={{ minHeight: '100vh', position: 'relative' }}>
      {/* Левая панель */}
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          display: { xs: 'none', md: 'block' },
          background:
            isDark
              ? 'radial-gradient(900px 500px at 0% 0%, rgba(124,58,237,.18), transparent 60%), radial-gradient(700px 400px at 100% 20%, rgba(6,182,212,.18), transparent 60%), #0B1021'
              : 'radial-gradient(900px 500px at 0% 0%, rgba(124,58,237,.14), transparent 60%), radial-gradient(700px 400px at 100% 20%, rgba(6,182,212,.16), transparent 60%), #F6F7FB',
        }}
      >
        {/* Свечение */}
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 0,
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              width: 280,
              height: 280,
              top: '8%',
              left: '8%',
              borderRadius: '50%',
              filter: 'blur(28px)',
              opacity: isDark ? 0.18 : 0.16,
              background: `radial-gradient(closest-side, ${t.palette.primary.main}, transparent 70%)`,
              animation: `${float} 14s ease-in-out infinite`,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              width: 220,
              height: 220,
              bottom: '12%',
              right: '14%',
              borderRadius: '50%',
              filter: 'blur(28px)',
              opacity: isDark ? 0.14 : 0.12,
              background: `radial-gradient(closest-side, ${t.palette.secondary.main}, transparent 70%)`,
              animation: `${float} 18s ease-in-out infinite`,
              animationDelay: '300ms',
            }}
          />
        </Box>

        {/* Контент */}
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            px: 8,
          }}
        >
          <Stack spacing={3} component={m.div}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: .4 }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 34,
                  height: 34,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
                  boxShadow: '0 10px 24px rgba(124,58,237,.35)',
                }}
              />
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  background: `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: 0.4,
                }}
              >
                ToDo
              </Typography>
            </Stack>

            <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: .4, lineHeight: 1.1 }}>
              Сфокусируйтесь на главном
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520 }}>
              Управляйте задачами в красивом и быстром интерфейсе. Анимации, стеклянный стиль и аккуратные детали.
            </Typography>

            <Stack spacing={1.2}>
              {['Красивый и чистый дизайн', 'Мгновенные действия', 'Адаптивно на всех экранах'].map((s) => (
                <Stack key={s} direction="row" spacing={1.2} alignItems="center">
                  <CheckCircleRoundedIcon color="success" fontSize="small" />
                  <Typography variant="body2">{s}</Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Box>
      </Grid>

      {/* Правая панель с формой (стекло + градиентный кант) */}
      <Grid
        item
        xs={12}
        md={6}
        sx={{
          display: 'grid',
          placeItems: 'center',
          px: { xs: 2, sm: 4, md: 6 },
          py: { xs: 6, md: 8 },
          position: 'relative',
        }}
      >
        <Paper
          elevation={0}
          component={m.div}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: .35 }}
          sx={{
            width: '100%',
            maxWidth: 560,
            p: { xs: 3, sm: 4, md: 5 },
            borderRadius: 4,
            backdropFilter: 'saturate(160%) blur(16px)',
            background: isDark ? alpha('#0E1324', 0.6) : alpha('#FFFFFF', 0.75),
            border: `1px solid ${alpha(isDark ? '#FFFFFF' : '#0B1021', 0.12)}`,
            boxShadow: isDark ? '0 12px 36px rgba(0,0,0,.45)' : '0 12px 36px rgba(0,0,0,.12)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: 0,
              borderRadius: 'inherit',
              padding: '1px',
              background: `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
              pointerEvents: 'none',
              opacity: 0.6,
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0, left: '-150%',
              width: '120%', height: '100%',
              pointerEvents: 'none',
              background: 'linear-gradient(120deg, transparent 0%, rgba(255,255,255,.24) 20%, rgba(255,255,255,.10) 35%, transparent 60%)',
              transform: 'skewX(-12deg)',
              transition: 'left .7s ease',
            },
            '&:hover::after': { left: '150%' },
          }}
        >
          <Stack spacing={mdUp ? 3 : 2}>
            <Stack spacing={0.6}>
              <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: .2 }}>{title}</Typography>
              {subtitle && <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
            </Stack>

            <Box>{children}</Box>
          </Stack>
        </Paper>
      </Grid>
    </Grid>
  )
}