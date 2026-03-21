import { useEffect, useRef } from 'react'

// Animated cyber grid background with particle streaks
export default function HyperspeedBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Particles — vertical streaks simulating motion
    const particles = Array.from({ length: 60 }, () => ({
      x:     Math.random() * window.innerWidth,
      y:     Math.random() * window.innerHeight,
      speed: 0.3 + Math.random() * 1.2,
      len:   20 + Math.random() * 80,
      alpha: 0.05 + Math.random() * 0.15,
      width: 0.5 + Math.random() * 1,
    }))

    let frame = 0

    const draw = () => {
      frame++
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Grid
      ctx.strokeStyle = 'rgba(0,255,180,0.025)'
      ctx.lineWidth = 0.5
      const gs = 36
      for (let x = 0; x < canvas.width + gs; x += gs) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
      }
      for (let y = 0; y < canvas.height + gs; y += gs) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
      }

      // Horizontal glow lines (rare, slow)
      if (frame % 80 === 0) {
        const y = Math.random() * canvas.height
        const grad = ctx.createLinearGradient(0, y, canvas.width, y)
        grad.addColorStop(0,   'transparent')
        grad.addColorStop(0.4, `rgba(0,255,180,0.04)`)
        grad.addColorStop(0.5, `rgba(0,255,180,0.09)`)
        grad.addColorStop(0.6, `rgba(0,255,180,0.04)`)
        grad.addColorStop(1,   'transparent')
        ctx.fillStyle = grad
        ctx.fillRect(0, y - 1, canvas.width, 2)
      }

      // Vertical streaks
      particles.forEach(p => {
        p.y += p.speed
        if (p.y > canvas.height + p.len) {
          p.y = -p.len
          p.x = Math.random() * canvas.width
        }
        const grad = ctx.createLinearGradient(p.x, p.y - p.len, p.x, p.y)
        grad.addColorStop(0,   'transparent')
        grad.addColorStop(1,   `rgba(0,255,180,${p.alpha})`)
        ctx.strokeStyle = grad
        ctx.lineWidth   = p.width
        ctx.beginPath()
        ctx.moveTo(p.x, p.y - p.len)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
      })

      raf = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
