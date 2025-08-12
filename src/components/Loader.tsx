import { Box, CircularProgress } from '@mui/material'

export default function Loader({ fullscreen = false }: { fullscreen?: boolean }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        ...(fullscreen
          ? { height: '100vh', width: '100vw' }
          : { py: 4 }),
      }}
    >
      <CircularProgress />
    </Box>
  )
}