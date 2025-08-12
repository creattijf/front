import { Card, CardContent, Stack, Skeleton } from '@mui/material'

export default function TaskSkeleton() {
  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Skeleton variant="circular" width={24} height={24} />
          <Stack sx={{ flex: 1 }} spacing={1}>
            <Skeleton variant="text" width="60%" />
            <Skeleton variant="text" width="90%" />
            <Skeleton variant="text" width="40%" />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  )
}