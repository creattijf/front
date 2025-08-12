// src/lib/confetti.ts
import confetti, { Options } from 'canvas-confetti'

let instance: ReturnType<typeof confetti.create> | null = null
let canvas: HTMLCanvasElement | null = null

const COLORS = ['#7C3AED', '#06B6D4', '#22C55E', '#F59E0B', '#EF4444', '#A78BFA']

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false
  return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function ensureInstance() {
  if (instance) return instance
  canvas = document.createElement('canvas')
  canvas.style.cssText = `
    position: fixed; inset: 0; width: 100%; height: 100%;
    pointer-events: none; z-index: 9999; will-change: transform;
  `
  document.body.appendChild(canvas)
  instance = confetti.create(canvas, { resize: true, useWorker: true })
  return instance
}

function toOriginFromElement(el: HTMLElement) {
  const r = el.getBoundingClientRect()
  const x = (r.left + r.width / 2) / window.innerWidth
  const y = (r.top + r.height / 2) / window.innerHeight
  return { x, y }
}

function shoot(opts: Options) {
  const c = ensureInstance()
  c({ disableForReducedMotion: true, zIndex: 9999, colors: COLORS, ...opts })
}

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

/**
 * Большой красивый взрыв в точке элемента 
 */
export function celebrateAt(el: HTMLElement, options?: { scale?: number; colors?: string[] }) {
  if (prefersReducedMotion()) return
  const origin = toOriginFromElement(el)
  const scale = options?.scale ?? 1

  // Центральный “сфера-взрыв”
  shoot({
    particleCount: Math.round(140 * scale),
    spread: 360,
    startVelocity: 55,
    gravity: 0.9,
    decay: 0.91,
    ticks: 240,
    scalar: 1 * scale,
    origin,
    drift: rand(-0.5, 0.5),
    colors: options?.colors || COLORS,
    shapes: ['square', 'circle'],
  })

  // (двойной веер)
  const side = 90 // от центра
  setTimeout(() => {
    shoot({
      particleCount: Math.round(60 * scale),
      angle: 60,
      spread: 70,
      startVelocity: 48,
      gravity: 1.0,
      ticks: 180,
      scalar: 0.9 * scale,
      origin: { x: Math.min(0.98, origin.x + side / window.innerWidth), y: origin.y },
      colors: options?.colors || COLORS,
    })
    shoot({
      particleCount: Math.round(60 * scale),
      angle: 120,
      spread: 70,
      startVelocity: 48,
      gravity: 1.0,
      ticks: 180,
      scalar: 0.9 * scale,
      origin: { x: Math.max(0.02, origin.x - side / window.innerWidth), y: origin.y },
      colors: options?.colors || COLORS,
    })
  }, 120)

  // Искры/блеск (маленькие быстрые частицы)
  setTimeout(() => {
    shoot({
      particleCount: Math.round(70 * scale),
      spread: 50,
      startVelocity: 35,
      gravity: 1.2,
      decay: 0.9,
      ticks: 120,
      scalar: 0.7 * scale,
      origin,
      colors: options?.colors || COLORS,
    })
  }, 220)
}

/**
 * Центровой салют на весь экран (для крупных событий)
 */
export function celebrateCenter(options?: { scale?: number; colors?: string[] }) {
  if (prefersReducedMotion()) return
  const center = { x: 0.5, y: 0.4 }
  const scale = options?.scale ?? 1.2

  // Тройной залп с лёгким смещением по вертикали
  celebrateAtPoint(center, { scale, colors: options?.colors })
  setTimeout(() => celebrateAtPoint({ x: 0.5, y: 0.35 }, { scale: scale * 0.9, colors: options?.colors }), 180)
  setTimeout(() => celebrateAtPoint({ x: 0.5, y: 0.45 }, { scale: scale * 0.9, colors: options?.colors }), 360)
}

function celebrateAtPoint(origin: { x: number; y: number }, options?: { scale?: number; colors?: string[] }) {
  const scale = options?.scale ?? 1
  shoot({
    particleCount: Math.round(160 * scale),
    spread: 360,
    startVelocity: 55,
    gravity: 0.9,
    decay: 0.91,
    ticks: 240,
    scalar: 1 * scale,
    origin,
    colors: options?.colors || COLORS,
  })
  setTimeout(() => {
    shoot({
      particleCount: Math.round(80 * scale),
      angle: 60,
      spread: 75,
      startVelocity: 52,
      gravity: 1.0,
      ticks: 180,
      scalar: 0.9 * scale,
      origin: { x: Math.min(0.95, origin.x + 0.08), y: origin.y },
      colors: options?.colors || COLORS,
    })
    shoot({
      particleCount: Math.round(80 * scale),
      angle: 120,
      spread: 75,
      startVelocity: 52,
      gravity: 1.0,
      ticks: 180,
      scalar: 0.9 * scale,
      origin: { x: Math.max(0.05, origin.x - 0.08), y: origin.y },
      colors: options?.colors || COLORS,
    })
  }, 120)
}

/**
 * Режим “фейерверков” сверху экрана в течение durationMs
 */
export function fireworks(durationMs = 2500) {
  if (prefersReducedMotion()) return
  const end = Date.now() + durationMs

  ;(function frame() {
    shoot({
      particleCount: Math.round(rand(36, 56)),
      startVelocity: rand(35, 55),
      spread: rand(20, 60),
      ticks: 200,
      gravity: rand(0.8, 1.1),
      origin: { x: Math.random(), y: Math.random() * 0.3 }, // верхняя треть экрана
      scalar: rand(0.8, 1.1),
      drift: rand(-0.4, 0.4),
    })
    if (Date.now() < end) requestAnimationFrame(frame)
  })()
}


export function teardownConfetti() {
  if (canvas?.parentNode) {
    canvas.parentNode.removeChild(canvas)
  }
  canvas = null
  instance = null
}