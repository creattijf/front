// src/components/settings/AccentPicker.tsx
import { Box, Stack, Typography, Button, Chip } from '@mui/material'
import { useThemeCustomization } from '../../providers/ColorModeProvider'

const PRESETS = [
  { name: 'Grape/Teal', primary: '#7C3AED', secondary: '#06B6D4' },
  { name: 'Pink/Orange', primary: '#EC4899', secondary: '#F97316' },
  { name: 'Blue/Cyan', primary: '#3B82F6', secondary: '#06B6D4' },
  { name: 'Emerald/Lime', primary: '#10B981', secondary: '#84CC16' },
  { name: 'Rose/Purple', primary: '#F43F5E', secondary: '#A78BFA' },
]

export default function AccentPicker() {
  const { accentPrimary, accentSecondary, setAccent } = useThemeCustomization()

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Акцентные цвета</Typography>

      <Stack direction="row" spacing={1} flexWrap="wrap">
        {PRESETS.map((p) => (
          <Chip
            key={p.name}
            label={p.name}
            onClick={() => setAccent(p.primary, p.secondary)}
            sx={{
              mr: 1, mb: 1,
              background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
              color: '#fff',
              fontWeight: 700,
            }}
          />
        ))}
      </Stack>

      <Stack direction="row" spacing={2} alignItems="center">
        <Box>
          <Typography variant="caption">Primary</Typography>
          <input
            type="color"
            value={accentPrimary}
            onChange={(e) => setAccent(e.target.value, accentSecondary)}
            style={{ width: 44, height: 44, border: 'none', background: 'transparent', cursor: 'pointer' }}
          />
        </Box>
        <Box>
          <Typography variant="caption">Secondary</Typography>
          <input
            type="color"
            value={accentSecondary}
            onChange={(e) => setAccent(accentPrimary, e.target.value)}
            style={{ width: 44, height: 44, border: 'none', background: 'transparent', cursor: 'pointer' }}
          />
        </Box>
        <Button variant="outlined" onClick={() => setAccent('#7C3AED', '#06B6D4')} sx={{ borderWidth: 2 }}>
          Сброс
        </Button>
      </Stack>

      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
        </Typography>
      </Box>
    </Stack>
  )
}