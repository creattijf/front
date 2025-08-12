import { Alert } from '@mui/material'

export default function ErrorBanner({ message }: { message?: string }) {
  if (!message) return null
  return <Alert severity="error" sx={{ my: 2 }}>{message}</Alert>
}