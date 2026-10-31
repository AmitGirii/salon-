import { useEffect, useState } from 'react'
import { ANIM } from '@/config/animation.config'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'

/**
 * Cinematic fallback for devices that cannot run the 3D salon.
 *
 * Rather than showing a "your browser is not supported" apology, this plays
 * the real photography of the salon as a slow cross-fading Ken Burns sequence.
 * Every section of the site keeps working; only the interactive camera is
 * missing. On a weak device that is a straight upgrade over a 6 fps canvas.
 *
 * Triggered when WebGL is unavailable, when a software renderer is detected,
 * or with `?fallback=1`.
 */

const PLATES = [
  { src: '/media/salon-styling-wide.jpg', origin: '48% 55%' },
  { src: '/media/salon-makeup-room.jpg', origin: '52% 60%' },
  { src: '/media/gallery-reception-wide.jpg', origin: '40% 45%' },
  { src: '/media/gallery-wash-loreal.jpg', origin: '55% 50%' },
]

export default function StaticSalon() {
  const [index, setIndex] = useState(0)
  const reducedMotion = usePrefersReducedMotion()

  useEffect(() => {
    if (reducedMotion) return
    const id = window.setInterval(
      () => setIndex((i) => (i + 1) % PLATES.length),
      (ANIM.fallback.duration * 1000) / 2,
    )
    return () => window.clearInterval(id)
  }, [reducedMotion])

  return (
    <div className="canvas-layer static-salon" aria-hidden="true">
      {PLATES.map((plate, i) => (
        <div
          key={plate.src}
          className={`static-salon__plate${i === index ? ' is-active' : ''}${reducedMotion ? ' is-still' : ''}`}
          style={{
            backgroundImage: `url(${plate.src})`,
            backgroundPosition: plate.origin,
          }}
        />
      ))}
      <div className="static-salon__wash" />
    </div>
  )
}
