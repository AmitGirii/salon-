import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from 'react'
import { CAMERA_VIEWS } from '@/config/camera.config'
import { setCameraMode, setExperience, useCurrentPose, useExperience } from '@/hooks/useExperienceStore'
import { useDeviceProfile } from '@/hooks/useDeviceProfile'
import StaticSalon from '@/scenes/StaticSalon'
import { idle } from '@/utils/idle'

/** three.js stays in its own chunk and is only fetched when this section needs it. */
const SalonExperience = lazy(() => import('@/scenes/SalonExperience'))

/**
 * If the viewer cannot come up — the chunk fails to download on a bad
 * connection, the GPU refuses a context, a driver throws — the section shows
 * the photographs instead. Without this an error inside the canvas would
 * unmount the whole page, which is a worse outcome than a missing viewer on
 * any phone in the world.
 */
class ViewerBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('[Cut N Curl] The 3D viewer could not start — showing the photographs.', error)
  }

  render() {
    return this.state.failed ? <StaticSalon /> : this.props.children
  }
}

const PLACEHOLDER = '/media/salon-styling-wide.jpg'

/**
 * "The Salon" — the interactive 3D room, now a section rather than the site.
 *
 * The film is the hero; this is the part of the page for the visitor who wants
 * to look around for themselves. The viewer is a contained box, not a fixed
 * layer behind everything, and it costs nothing until it is needed.
 *
 * ON A DESKTOP it warms up by itself, in idle time, in stages — the three.js
 * chunk, then the procedural textures, then the canvas, then one shader
 * program per idle slice, then one frame off screen — a few seconds after the
 * title card leaves, or sooner if the section is scrolled within ~900 px.
 * Until then the box shows the real photograph of the same room.
 *
 * ON A PHONE the same warm-up runs by itself, with a longer breather after
 * the title card, and with one extra guard: the photograph stays on top until
 * every shader program is compiled and the first frame has been drawn off
 * screen (`salonWarm`). The room then fades in over the photograph. It never
 * draws a frame on a phone before it is ready, so the handover is a fade,
 * never a freeze — and the warm-up itself is one program per idle slice,
 * never while the page is being scrolled.
 *
 * It only draws while the box is near the screen, and even then only on
 * demand — see SalonExperience. Scrolled past, it draws nothing.
 *
 * On a device that cannot run WebGL, the box shows the cross-fading
 * photography instead. Either way the section always has something in it.
 */
export default function StationsSection() {
  const profile = useDeviceProfile()
  const fallback = profile.tier === 'none'
  const onPhone = profile.isMobile && !fallback
  const host = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  const [active, setActive] = useState(false)
  const currentPose = useCurrentPose()
  const introDone = useExperience((s) => s.introDone)
  const warm = useExperience((s) => s.salonWarm)

  /*
   * The staged warm-up. Each stage in its own idle moment (and never while
   * the page is being scrolled — see utils/idle.ts), so no single one is long
   * enough to be felt:
   *
   *   1. fetch and evaluate the three.js chunk;
   *   2. paint the procedural textures and build the shared geometry;
   *   3. mount the canvas (the room follows a moment later — see
   *      SalonExperience — and its shaders and first frame after that).
   *
   * Desktop: two seconds after the title card. Phone: two and a half.
   */
  useEffect(() => {
    if (!introDone || near || fallback) return
    let alive = true
    let cancel = () => {}
    const run = () => {
      cancel = idle(() => {
        import('@/scenes/SalonExperience').then((m) => {
          if (!alive) return
          cancel = idle(() => {
            m.warmAssets()
            cancel = idle(() => {
              if (alive) setNear(true)
            })
          })
        })
      })
    }
    const t = window.setTimeout(run, onPhone ? 2500 : 2000)
    return () => {
      alive = false
      window.clearTimeout(t)
      cancel()
    }
  }, [introDone, near, fallback, onPhone])

  useEffect(() => {
    const el = host.current
    if (!el) return

    // Only spend frames when the box is close to being seen.
    const draw = new IntersectionObserver(([e]) => setActive(e.isIntersecting), {
      rootMargin: '300px 0px',
    })
    draw.observe(el)

    // Mount early so the shaders are warm before the box is seen.
    const mount = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setNear(true)
          mount.disconnect()
        }
      },
      { rootMargin: '900px 0px' },
    )
    mount.observe(el)
    return () => {
      mount.disconnect()
      draw.disconnect()
    }
  }, [])

  // Open on the styling stations — the room's signature view.
  useEffect(() => {
    if (near) setCameraMode('stations')
  }, [near])

  /*
   * The visitor is looking at the box on a phone and the room is not warm
   * yet: tell the warm-up to stop yielding to idle time and finish now.
   */
  useEffect(() => {
    setExperience({ salonHurry: onPhone && near && active && !warm })
  }, [onPhone, near, active, warm])

  /*
   * Fail-safe. The room is shown on a phone once it is warm — but it must
   * ALWAYS be shown. If warm has not arrived a few seconds after the visitor
   * started looking (or a while after mounting off screen), show it anyway:
   * whatever is not compiled yet compiles on the first frames. A room that
   * arrives with one hitch beats a photograph that never becomes the room.
   */
  const [forced, setForced] = useState(false)
  useEffect(() => {
    if (!onPhone || !near || warm || forced) return
    const t = window.setTimeout(() => setForced(true), active ? 6000 : 15000)
    return () => window.clearTimeout(t)
  }, [onPhone, near, warm, forced, active])

  /*
   * A lost WebGL context (Android under memory pressure, or back from a long
   * time in the background): rebuild the viewer with a fresh one. The
   * photograph covers the box while it warms again. After three losses the
   * device plainly cannot hold a context, and the photographs take over.
   */
  const [epoch, setEpoch] = useState(0)
  const onContextLost = () => {
    setExperience({ salonWarm: false })
    setForced(false)
    setEpoch((n) => n + 1)
  }
  const gaveUp = epoch >= 3

  /** The room is mounted and, on a phone, warm (or overdue): show and draw it. */
  const shown = warm || forced
  const ready = near && (!onPhone || shown)
  const live = active && (!onPhone || shown)

  const placeholder = (
    <img
      className="salon__placeholder"
      src={PLACEHOLDER}
      alt="The styling floor at Cut N Curl"
      loading="lazy"
      decoding="async"
    />
  )

  return (
    <div className="panel panel--sheet salon">
      <header className="salon__head">
        <p className="label" data-reveal>
          The Salon
        </p>
        <h2 className="display salon__title" data-reveal>
          Three stations, one long mirror,
          <em> and very good light</em>
        </h2>
        <p className="salon__body" data-reveal>
          A reconstruction of the room itself — backlit capsule mirrors on the styling wall,
          the marble floor, and the makeup room behind the curtain. Choose a view, then drag
          to look around.
        </p>
      </header>

      {/* No reveal on the box itself: a transition on a canvas-sized surface
          is a compositor cost a phone notices. The headings above carry it. */}
      <div className="salon__viewer" ref={host}>
        {fallback || gaveUp ? (
          <StaticSalon />
        ) : near ? (
          <ViewerBoundary>
            <Suspense fallback={placeholder}>
              <SalonExperience
                key={epoch}
                profile={profile}
                contained
                active={live}
                onContextLost={onContextLost}
              />
            </Suspense>
          </ViewerBoundary>
        ) : (
          placeholder
        )}

        {/* Phone, before the room is warm: the photograph stays on top of the
            mounted, not-yet-drawing canvas, and the room fades in under it. */}
        {onPhone && near && !ready && !gaveUp && (
          <img className="salon__placeholder salon__placeholder--cover" src={PLACEHOLDER} alt="" aria-hidden="true" />
        )}

        {!fallback && !gaveUp && ready && (
          <div className="salon__views" role="group" aria-label="Camera view">
            {CAMERA_VIEWS.map((v) => {
              const isActive = currentPose === v.pose
              return (
                <button
                  key={v.pose}
                  type="button"
                  className={`salon__view${isActive ? ' is-active' : ''}`}
                  aria-current={isActive ? 'true' : undefined}
                  onClick={() => setCameraMode(v.pose)}
                >
                  {v.label}
                </button>
              )
            })}
          </div>
        )}

        {!fallback && !gaveUp && ready && <p className="salon__hint label">Drag to look · two fingers on a phone</p>}
      </div>
    </div>
  )
}
