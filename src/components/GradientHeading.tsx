// src/components/GradientHeading.tsx
import { Typography, TypographyProps } from '@mui/material'

export default function GradientHeading(props: TypographyProps) {
  return (
    <Typography
      {...props}
      sx={{
        ...props.sx,
        fontFamily: `"Outfit Variable","Inter Variable",system-ui`,
        fontWeight: 800,
        letterSpacing: 0.4,
        background: (t) => `linear-gradient(135deg, ${t.palette.primary.main}, ${t.palette.secondary.main})`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}
    />
  )
}