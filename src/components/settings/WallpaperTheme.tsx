// src/components/settings/WallpaperTheme.tsx
import { useRef, useState } from 'react'
import { Box, Stack, Typography, Button, TextField, Chip } from '@mui/material'
import { useThemeCustomization } from '../../providers/ColorModeProvider'

type Swatch = { name: string; hex: string }

export default function WallpaperTheme() {
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [swatches, setSwatches] = useState<Swatch[]>([])
  const { applyPalette, setWallpaper, clearWallpaper } = useThemeCustomization()

  async function getVibrant() {
    const mod: any = await import('node-vibrant')
    return mod?.default ?? mod
  }

  const analyze = async (src: string) => {
    try {
      const Vibrant = await getVibrant()
      const palette = await Vibrant.from(src).getPalette()
      const picks: Swatch[] = []
      if (palette.Vibrant?.hex) picks.push({ name: 'Vibrant', hex: palette.Vibrant.hex })
      if (palette.LightVibrant?.hex) picks.push({ name: 'LightVibrant', hex: palette.LightVibrant.hex })
      if (palette.DarkVibrant?.hex) picks.push({ name: 'DarkVibrant', hex: palette.DarkVibrant.hex })
      if (palette.Muted?.hex) picks.push({ name: 'Muted', hex: palette.Muted.hex })
      if (palette.LightMuted?.hex) picks.push({ name: 'LightMuted', hex: palette.LightMuted.hex })
      if (palette.DarkMuted?.hex) picks.push({ name: 'DarkMuted', hex: palette.DarkMuted.hex })
      setSwatches(picks)
    } catch (e) {
      console.error('Vibrant error', e)
      setSwatches([])
    }
  }

  const onPickFile = () => fileRef.current?.click()

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      const src = String(reader.result) 
      setPreview(src)
      analyze(src)
    }
    reader.readAsDataURL(f)
  }

  const onAnalyzeUrl = () => {
    if (!url) return
    setPreview(url)
    analyze(url) 
  }

  const applyVibrant = () => {
    if (swatches.length === 0) return
    const primary =
      swatches.find((s) => s.name.includes('Vibrant'))?.hex || swatches[0].hex
    const secondary =
      swatches.find((s) => s.name === 'LightVibrant')?.hex ||
      swatches.find((s) => s.name.includes('Muted'))?.hex ||
      primary
    applyPalette({ primary, secondary })
  }

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Тема по обоям</Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
        <Button variant="outlined" onClick={onPickFile} sx={{ borderWidth: 2 }}>
          Загрузить изображение
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={onFile}
        />
        <TextField
          size="small"
          placeholder="URL изображения (нужен CORS)"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Button variant="contained" onClick={onAnalyzeUrl}>Анализ</Button>
      </Stack>

      {preview && (
        <Box
          sx={{
            mt: 1,
            width: '100%',
            height: 180,
            borderRadius: 2,
            background: `url("${preview}") center/cover no-repeat`,
            border: '1px solid',
            borderColor: 'divider',
          }}
        />
      )}

      {swatches.length > 0 && (
        <>
          <Typography variant="caption" color="text.secondary">Палитра:</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {swatches.map((s) => (
              <Chip
                key={s.name}
                label={s.name}
                onClick={() => applyPalette({ primary: s.hex })}
                sx={{
                  mr: 1,
                  mb: 1,
                  background: s.hex,
                  color: '#fff',
                  fontWeight: 700,
                }}
              />
            ))}
          </Stack>

          <Stack direction="row" spacing={1.5}>
            <Button variant="contained" onClick={applyVibrant}>Применить палитру</Button>
            <Button variant="outlined" onClick={() => setWallpaper(preview)} sx={{ borderWidth: 2 }}>
              Установить обои фоном
            </Button>
            <Button variant="text" onClick={clearWallpaper}>Убрать обои</Button>
          </Stack>
        </>
      )}

      <Typography variant="caption" color="text.secondary">
      </Typography>
    </Stack>
  )
}