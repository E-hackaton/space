import { useEffect, useRef } from 'react'

import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import styles from './Starfield.module.css'

interface Star {
  x: number
  y: number
  radius: number
  phase: number
  speed: number
}

interface ShootingStar {
  x: number
  y: number
  age: number
}

/** Une étoile pour environ 9 000 px² d'écran, avec un plafond pour rester léger sur mobile. */
const STAR_DENSITY = 9000
const MAX_STARS = 220
/** Une étoile filante environ toutes les 7 secondes. */
const SHOOTING_STAR_INTERVAL_MS = 7000
const SHOOTING_STAR_LIFETIME = 45 // en images

function createStars(width: number, height: number): Star[] {
  const count = Math.min(MAX_STARS, Math.round((width * height) / STAR_DENSITY))
  return Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: Math.random() * 1.2 + 0.3,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.002 + 0.0005,
  }))
}

/**
 * Ciel étoilé animé en fond de page : scintillement et étoiles filantes.
 * Purement décoratif (aria-hidden). Une image fixe si l'utilisateur réduit les animations.
 */
export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    let stars: Star[] = []
    let shooting: ShootingStar | null = null
    let lastShootingStart = performance.now()
    let frame = 0

    // Le canvas est dimensionné en pixels physiques pour rester net sur les écrans haute densité.
    function resize() {
      if (!canvas || !context) return
      const ratio = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * ratio
      canvas.height = window.innerHeight * ratio
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      stars = createStars(window.innerWidth, window.innerHeight)
    }

    function draw(time: number) {
      if (!context) return
      context.clearRect(0, 0, window.innerWidth, window.innerHeight)

      for (const star of stars) {
        const twinkle = reducedMotion ? 0.8 : 0.35 + 0.65 * Math.abs(Math.sin(time * star.speed + star.phase))
        context.globalAlpha = twinkle
        context.fillStyle = '#ffffff'
        context.beginPath()
        context.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
        context.fill()
      }

      if (!reducedMotion) drawShootingStar(time)
      context.globalAlpha = 1
    }

    function drawShootingStar(time: number) {
      if (!context) return
      if (!shooting && time - lastShootingStart > SHOOTING_STAR_INTERVAL_MS) {
        shooting = { x: Math.random() * window.innerWidth * 0.7, y: Math.random() * window.innerHeight * 0.4, age: 0 }
        lastShootingStart = time
      }
      if (!shooting) return

      const progress = shooting.age / SHOOTING_STAR_LIFETIME
      const headX = shooting.x + shooting.age * 9
      const headY = shooting.y + shooting.age * 4
      const gradient = context.createLinearGradient(headX - 90, headY - 40, headX, headY)
      gradient.addColorStop(0, 'rgba(234, 254, 7, 0)')
      gradient.addColorStop(1, `rgba(255, 255, 255, ${1 - progress})`)
      context.strokeStyle = gradient
      context.lineWidth = 1.5
      context.beginPath()
      context.moveTo(headX - 90, headY - 40)
      context.lineTo(headX, headY)
      context.stroke()

      shooting.age += 1
      if (shooting.age > SHOOTING_STAR_LIFETIME) shooting = null
    }

    function loop(time: number) {
      draw(time)
      frame = window.requestAnimationFrame(loop)
    }

    resize()
    window.addEventListener('resize', resize)
    if (reducedMotion) {
      draw(0) // une seule image, sans mouvement
    } else {
      frame = window.requestAnimationFrame(loop)
    }

    return () => {
      window.removeEventListener('resize', resize)
      window.cancelAnimationFrame(frame)
    }
  }, [reducedMotion])

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
}
