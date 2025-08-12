// src/components/settings/ThemeSettingsDialog.tsx
import { Dialog, DialogTitle, DialogContent, Tabs, Tab, Box, IconButton } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import { useState } from 'react'
import AccentPicker from './AccentPicker'
import WallpaperTheme from './WallpaperTheme'

export default function ThemeSettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState(0)
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
        Настройки темы
        <IconButton onClick={onClose} sx={{ ml: 'auto' }}><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Акценты" />
          <Tab label="Обои" />
        </Tabs>
        <Box hidden={tab !== 0}><AccentPicker /></Box>
        <Box hidden={tab !== 1}><WallpaperTheme /></Box>
      </DialogContent>
    </Dialog>
  )
}