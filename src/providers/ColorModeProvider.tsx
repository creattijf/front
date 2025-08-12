// src/providers/ColorModeProvider.tsx
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { CssBaseline, GlobalStyles, ThemeProvider, createTheme, PaletteMode, alpha } from '@mui/material'

type Customization = {
  mode: PaletteMode
  accentPrimary: string
  accentSecondary: string
  wallpaper?: string | null
  setMode: (m: PaletteMode) => void
  setAccent: (primary: string, secondary: string) => void
  setWallpaper: (src: string | null) => void
  applyPalette: (p: { primary?: string | null; secondary?: string | null }) => void
  clearWallpaper: () => void
}

const CustomizationCtx = createContext<Customization | null>(null)

const LS_MODE = 'color_mode'
const LS_ACCENT_PRIMARY = 'accent_primary'
const LS_ACCENT_SECONDARY = 'accent_secondary'
const LS_WALLPAPER = 'wallpaper_src'

function getInitial<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    if (!v) return fallback
    return (v as unknown as T) ?? fallback
  } catch {
    return fallback
  }
}

export function ColorModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<PaletteMode>(() => (getInitial(LS_MODE, 'light') as PaletteMode))
  const [accentPrimary, setAccentPrimary] = useState<string>(() => getInitial(LS_ACCENT_PRIMARY, '#7C3AED'))
  const [accentSecondary, setAccentSecondary] = useState<string>(() => getInitial(LS_ACCENT_SECONDARY, '#06B6D4'))
  const [wallpaper, setWallpaperState] = useState<string | null>(() => {
    const w = localStorage.getItem(LS_WALLPAPER)
    return w || null
  })

  useEffect(() => { localStorage.setItem(LS_MODE, mode) }, [mode])
  useEffect(() => { localStorage.setItem(LS_ACCENT_PRIMARY, accentPrimary) }, [accentPrimary])
  useEffect(() => { localStorage.setItem(LS_ACCENT_SECONDARY, accentSecondary) }, [accentSecondary])
  useEffect(() => {
    if (wallpaper) localStorage.setItem(LS_WALLPAPER, wallpaper)
    else localStorage.removeItem(LS_WALLPAPER)
  }, [wallpaper])

  const setAccent = (primary: string, secondary: string) => {
    setAccentPrimary(primary)
    setAccentSecondary(secondary)
  }
  const applyPalette = (p: { primary?: string | null; secondary?: string | null }) => {
    if (p.primary) setAccentPrimary(p.primary)
    if (p.secondary) setAccentSecondary(p.secondary)
  }
  const setWallpaper = (src: string | null) => setWallpaperState(src)
  const clearWallpaper = () => setWallpaperState(null)

  const theme = useMemo(() => {
    const isDark = mode === 'dark'
    const primary = { main: accentPrimary }
    const secondary = { main: accentSecondary }

    return createTheme({
      palette: {
        mode,
        primary,
        secondary,
        background: {
          default: isDark ? '#0B1021' : '#F6F7FB',
          paper: isDark ? alpha('#0E1324', 0.7) : alpha('#FFFFFF', 0.75),
        },
        text: {
          primary: isDark ? '#E8ECF3' : '#0B1021',
          secondary: isDark ? alpha('#E8ECF3', 0.75) : alpha('#0B1021', 0.7),
        },
      },
      shape: { borderRadius: 14 },
      typography: {
        fontFamily: `"Inter Variable", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial`,
        h5: { fontWeight: 800, letterSpacing: 0.2 },
        h6: { fontWeight: 700 },
        button: { fontWeight: 700, textTransform: 'none', letterSpacing: 0.3 },
      },
      shadows: [
        'none',
        '0 2px 10px rgba(0,0,0,.06)',
        '0 6px 16px rgba(0,0,0,.08)',
        '0 10px 24px rgba(0,0,0,.10)',
        ...Array(21).fill('0 10px 24px rgba(0,0,0,.10)'),
      ] as any,
      components: {
        MuiPaper: { styleOverrides: { root: { backgroundImage: 'none', backdropFilter: 'saturate(160%) blur(12px)' } } },
        MuiCard: {
          styleOverrides: {
            root: {
              border: `1px solid ${alpha(isDark ? '#FFFFFF' : '#0B1021', 0.12)}`,
              transition: 'transform .2s ease, box-shadow .2s ease, border-color .2s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 10px 24px rgba(0,0,0,.12)',
                borderColor: alpha(isDark ? '#FFFFFF' : '#0B1021', 0.18),
              },
            },
          },
        },
        MuiButton: {
          styleOverrides: {
            contained: {
              background: `linear-gradient(135deg, ${primary.main} 0%, ${secondary.main} 100%)`,
              boxShadow: `0 8px 20px ${alpha(primary.main, .35)}`,
              '&:hover': { filter: 'brightness(1.08)', boxShadow: `0 10px 24px ${alpha(primary.main, .45)}` },
            },
            outlined: { borderWidth: 2, '&:hover': { borderWidth: 2 } },
          },
        },
      },
    })
  }, [mode, accentPrimary, accentSecondary])

  // Фон: обои (если заданы) + aurora + noise
  const backgroundStyle = useMemo(() => {
    const aurora = mode === 'dark'
      ? `radial-gradient(1000px 600px at 0% 0%, ${alpha(accentPrimary, .18)}, transparent 60%),
         radial-gradient(800px 500px at 100% 20%, ${alpha(accentSecondary, .18)}, transparent 60%),
         ${theme.palette.background.default}`
      : `radial-gradient(1000px 600px at 0% 0%, ${alpha(accentPrimary, .14)}, transparent 60%),
         radial-gradient(800px 500px at 100% 20%, ${alpha(accentSecondary, .16)}, transparent 60%),
         ${theme.palette.background.default}`
    if (!wallpaper) return aurora
    // overlay градиент + обои
    return `
      linear-gradient(${mode === 'dark' ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.35)'}, ${mode === 'dark' ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.35)'}),
      url("${wallpaper}") center/cover fixed no-repeat,
      ${aurora}
    `
  }, [wallpaper, mode, accentPrimary, accentSecondary, theme.palette.background.default])

  const value: Customization = {
    mode,
    accentPrimary,
    accentSecondary,
    wallpaper,
    setMode,
    setAccent,
    setWallpaper,
    applyPalette,
    clearWallpaper,
  }

  return (
    <CustomizationCtx.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={{
          'html, body, #root': { height: '100%' },
          '@keyframes subtleMove': {
            '0%': { backgroundPosition: '0% 0%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 0%' },
          },
          body: {
            background: backgroundStyle,
            backgroundSize: '200% 200%',
            animation: 'subtleMove 28s ease-in-out infinite',
            backgroundAttachment: 'fixed',
          },
          'body::after': {
            content: '""',
            position: 'fixed',
            inset: 0,
            pointerEvents: 'none',
            opacity: 0.05,
            mixBlendMode: 'soft-light',
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' opacity='1'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          },
        }} />
        {children}
      </ThemeProvider>
    </CustomizationCtx.Provider>
  )
}

export function useThemeCustomization() {
  const ctx = useContext(CustomizationCtx)
  if (!ctx) throw new Error('useThemeCustomization must be used within ColorModeProvider')
  return ctx
}