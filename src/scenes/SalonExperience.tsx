import { Suspense, useEffect, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { CAMERA_POSES, resolvePose } from '@/config/camera.config'
import SalonScene from '@/components/3d/SalonScene'
import { chairGeometries } from '@/models/geometries'
import {
  getFabricRoughnessMap,
  getMarbleColorMap,
  getMarbleRoughnessMap,
  getWallRoughnessMap,
} from '@/materials/salonMaterials'
import { idle } from '@/utils/idle'
import type { DeviceProfile } from '@/utils/perf'

/**
 * Paints the procedural textures and builds the shared chair geometry ahead of
 * the mount, so that the mount itself is only React work and WebGL uploads.
 * Everything here is cached at module level; the components pick up the
 * cached copies and paint nothing.
 */
export function warmAssets() {
  getMarbleColorMap(1)
  getMarbleRoughnessMap(1)
  getWallRoughnessMap(6)
  getFabricRoughnessMap()
  for (const build of Object.values(chairGeometries)) build()
}

/**
 * The WebGL layer.
 *
 * Lives in its own lazily-imported chunk so that three.js — by far the largest
 * dependency — is never on the path to first paint.
 *
 * Two ways to mount it:
 *
 *   • default — a fixed layer behind the whole page (the original 3D-first
 *     layout; kept so the experience can be brought back as a full page).
 *   • `contained` — fills whatever positioned box it is placed in. This is
 *     how the homepage uses it now: a viewer inside "The Salon" section.
 *
 * `active={false}` stops the render loop without unmounting. The scene stays
 * warm — geometry uploaded, shaders compiled — but draws nothing, so a viewer
 * the visitor has scrolled past costs no GPU time at all.
 *
 * WHILE ACTIVE, FRAMES ARE DRAWN ON DEMAND, NOT CONTINUOUSLY.
 *
 * Nothing in this room moves on its own. A frame is only worth drawing when
 * the camera is flying between views or the visitor is dragging — and each
 * frame is expensive: the marble floor and the three mirror banks are true
 * reflections, so one frame is four extra renders of the whole room before
 * bloom and anti-aliasing. Drawing that continuously while the box merely
 * sat on screen was what starved the page's scrolling and made the section
 * feel like it hung. With `demand`, a settled room costs nothing per frame:
 * the camera controller and OrbitControls ask for frames while they move,
 * and the scroll thread gets the GPU back the moment they stop.
 */

/**
 * Asks for a few frames whenever the viewer becomes active — the first draws
 * the environment map and the settled camera, the rest let the reflections
 * and bloom converge — and otherwise stays silent.
 */
function Wake({ active }: { active: boolean }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    if (active) invalidate(4)
  }, [active, invalidate])
  return null
}
export default function SalonExperience({
  profile,
  contained = false,
  active = true,
  onContextLost,
}: {
  profile: DeviceProfile
  contained?: boolean
  active?: boolean
  /** The GPU took the WebGL context away (memory pressure, a long background). */
  onContextLost?: () => void
}) {
  const hero = resolvePose(CAMERA_POSES.stations, profile.isMobile)

  /*
   * The mount is staged. The canvas — and its WebGL context, which is the one
   * genuinely slow thing to create — goes up first, on its own. The room
   * follows in the next idle moment. Neither step is long enough to be felt.
   * If the box is already on screen, the room mounts at once.
   */
  const [roomReady, setRoomReady] = useState(false)
  useEffect(() => idle(() => setRoomReady(true)), [])

  return (
    <div className={`canvas-layer${contained ? ' canvas-layer--contained' : ''}`} aria-hidden="true">
      <Canvas
        dpr={profile.dpr}
        shadows={profile.shadows ? 'soft' : false}
        gl={{
          antialias: !profile.postProcessing, // the composer does its own MSAA
          alpha: false,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
          preserveDrawingBuffer: false,
        }}
        camera={{
          position: hero.position,
          fov: hero.fov,
          near: 0.08,
          far: 60,
        }}
        // The scene has no interactive meshes; skipping raycasting on every
        // pointer move is free performance.
        events={undefined}
        /*
         * Android reclaims WebGL contexts under memory pressure and after a
         * long spell in the background. A lost context is a black box that
         * never redraws (the loop is on demand, and nothing asks). Tell the
         * section, which rebuilds the viewer with a fresh context.
         */
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => {
            e.preventDefault()
            onContextLost?.()
          })
        }}
        frameloop={active ? 'demand' : 'never'}
        /*
         * While the visitor drags, resolution may drop as far as 3/4 so the
         * gesture stays fluid; it restores the moment they let go. Without a
         * floor, drei's default dips to half and the drop is visible.
         */
        performance={{ min: 0.75 }}
        /*
         * fiber's default re-measures the canvas 50 ms after every scroll
         * gesture (a forced layout, and an invalidate). The box never moves
         * relative to the page; a ResizeObserver still catches real resizes.
         */
        resize={{ scroll: false, debounce: { scroll: 50, resize: 0 } }}
      >
        <Wake active={active} />
        <color attach="background" args={['#EFE7DC']} />
        <fog attach="fog" args={['#EFE7DC', 22, 46]} />
        {(roomReady || active) && (
          <Suspense fallback={null}>
            <SalonScene profile={profile} />
          </Suspense>
        )}
      </Canvas>
    </div>
  )
}
