import { useEffect, useRef } from 'react'

export type TiltOptions = {
  maxTilt?: number        
  scale?: number          
  perspective?: number    
  smoothing?: number      
  resetSmoothing?: number 
  disabled?: boolean
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

export function useTilt<T extends HTMLElement = HTMLDivElement>(opts: TiltOptions = {}) {
  const ref = useRef<T | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const {
      maxTilt = 8,
      scale = 1.02,
      perspective = 900,
      smoothing = 0.1,
      resetSmoothing = 0.08,
      disabled = false,
    } = opts

    if (disabled || prefersReducedMotion()) {
      // Без анимаций
      el.style.transform = `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`
      return
    }

    let rect = el.getBoundingClientRect()
    let raf = 0

    let targetX = 0, targetY = 0, targetScale = 1
    let currentX = 0, currentY = 0, currentScale = 1
    let hover = false

    const updateRect = () => { rect = el.getBoundingClientRect() }

    const onEnter = () => {
      hover = true
      targetScale = scale
      updateRect()
      start()
    }

    const onMove = (e: MouseEvent) => {
      if (!hover) return
      // нормализуем координаты курсора в пределах элемента (0..1)
      const px = (e.clientX - rect.left) / rect.width
      const py = (e.clientY - rect.top) / rect.height
      // вычисляем целевые углы
      const tiltX = (0.5 - py) * 2 * maxTilt
      const tiltY = (px - 0.5) * 2 * maxTilt
      targetX = tiltX
      targetY = tiltY
    }

    const onLeave = () => {
      hover = false
      targetX = 0
      targetY = 0
      targetScale = 1
      start()
    }

    const tick = () => {
      const k = hover ? smoothing : resetSmoothing
      currentX += (targetX - currentX) * k
      currentY += (targetY - currentY) * k
      currentScale += (targetScale - currentScale) * k

      el.style.willChange = 'transform'
      el.style.transform = `perspective(${perspective}px) rotateX(${currentX}deg) rotateY(${currentY}deg) scale(${currentScale})`

      const done =
        Math.abs(targetX - currentX) < 0.01 &&
        Math.abs(targetY - currentY) < 0.01 &&
        Math.abs(targetScale - currentScale) < 0.002

      if (!done) {
        raf = requestAnimationFrame(tick)
      } else {
        el.style.transform = `perspective(${perspective}px) rotateX(${targetX}deg) rotateY(${targetY}deg) scale(${targetScale})`
        raf = 0
      }
    }

    const start = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }

    // события
    el.addEventListener('mouseenter', onEnter, { passive: true })
    el.addEventListener('mousemove', onMove, { passive: true })
    el.addEventListener('mouseleave', onLeave)
    window.addEventListener('resize', updateRect)

    // базовые стили для 3D
    const prevTransformStyle = el.style.transformStyle
    const prevBackface = el.style.backfaceVisibility
    el.style.transformStyle = 'preserve-3d'
    el.style.backfaceVisibility = 'hidden'

    return () => {
      el.removeEventListener('mouseenter', onEnter)
      el.removeEventListener('mousemove', onMove)
      el.removeEventListener('mouseleave', onLeave)
      window.removeEventListener('resize', updateRect)
      if (raf) cancelAnimationFrame(raf)
      el.style.willChange = ''
      el.style.transformStyle = prevTransformStyle
      el.style.backfaceVisibility = prevBackface
      el.style.transform = ''
    }
  }, [opts.maxTilt, opts.scale, opts.perspective, opts.smoothing, opts.resetSmoothing, opts.disabled])

  return ref
}