import { Box, Typography, Button, Stack } from '@mui/material'
import Lottie from 'lottie-react'
import emptyAnim from '../assets/empty.json'

export default function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Box sx={{ textAlign: 'center', py: 8, opacity: 0.95 }}>
      <Box sx={{ mx: 'auto', width: 260, height: 200, mb: 2 }}>
        <Lottie animationData={emptyAnim} loop autoplay style={{ width: '100%', height: '100%' }} />
      </Box>
      <Stack spacing={1} alignItems="center">
        <Typography variant="h6" sx={{ fontWeight: 800 }}>Пока нет задач</Typography>
        <Typography variant="body2" color="text.secondary">Создайте первую — это займет секунду</Typography>
        <Button variant="contained" sx={{ mt: 1 }} onClick={onCreate}>Новая задача</Button>
      </Stack>
    </Box>
  )
}