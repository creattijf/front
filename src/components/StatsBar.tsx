import { Box, LinearProgress, Stack, Typography } from '@mui/material'

export default function StatsBar({ total, done }: { total: number; done: number }) {
  const value = total ? Math.round((done / total) * 100) : 0
  return (
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="body2" sx={{ opacity: 0.8 }}>Прогресс</Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>{done}/{total}</Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={value}
        sx={{
          height: 10, borderRadius: 999,
          '& .MuiLinearProgress-bar': {
            borderRadius: 999,
            background: (t) => `linear-gradient(90deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
          },
        }}
      />
    </Stack>
  )
}