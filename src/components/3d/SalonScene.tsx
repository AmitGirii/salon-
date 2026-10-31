import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { AdaptiveDpr, BakeShadows } from '@react-three/drei'
import { LIGHTING } from '@/config/lighting.config'
import { getExperience, setExperience, useExperience } from '@/hooks/useExperienceStore'
import { disposeGeometries } from '@/models/geometries'
import { disposeSharedMaterials } from '@/materials/sharedMaterials'
import { disposeGeneratedTextures } from '@/materials/salonMaterials'
import { createFrameWatchdog, type DeviceProfile } from '@/utils/perf'
import { idle, scrolledRecently } from '@/utils/idle'

import LightingSystem from './LightingSystem'
import SalonModel from './SalonModel'
import CameraController from './CameraController'
import Effects from './Effects'

/**
 * Compiles the room's shaders ONE PROGRAM AT A TIME, in idle moments.
 *
 * The viewer mounts with its render loop stopped, well before it is seen, so
 * this runs while the visitor is still reading the top of the page. Where the
 * GPU driver offers `KHR_parallel_shader_compile`, each program is built off
 * the main thread. Many phone drivers do not really honour it: they link
 * synchronously, and compiling the twenty-odd programs here in one call — as
 * three's `compileAsync(scene)` does, and as drei's `<Preload>` did — held the
 * main thread AND the GPU for several seconds on a Samsung. The browser's
 * compositor shares that GPU, so the whole phone appeared to freeze a few
 * seconds after the page opened. One program per idle slice, each slice
 * waiting for the page to be still, is the difference between a freeze and
 * nothing anyone notices.
 *
 * Then, in the idle moment after the last program, ONE frame is drawn while
 * the box is still off screen. That first frame is the heaviest the room ever
 * draws — it bakes the environment map and allocates the reflection and bloom
 * buffers — and it used to land at the exact moment the section scrolled into
 * view. Drawn early, arrival is just another frame.
 *
 * If the visitor reaches the box before this finishes, three.js simply
 * compiles whatever is left on the first visible frame, as before.
 */
function WarmShaders() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  const advance = useThree((s) => s.advance)
  const invalidate = useThree((s) => s.invalidate)
  const get = useThree((s) => s.get)
  useEffect(() => {
    let alive = true
    let cancel = () => {}

    // One job per object that introduces a material not yet seen: shared
    // materials (the seven chairs, the gold trim) compile once.
    const seen = new Set<THREE.Material>()
    const jobs: THREE.Object3D[] = []
    scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined
      if (!m) return
      const mats = Array.isArray(m) ? m : [m]
      if (mats.some((x) => !seen.has(x))) {
        mats.forEach((x) => seen.add(x))
        jobs.push(o)
      }
    })
    const total = jobs.length

    // Idle time by default; at once when the visitor is already looking at
    // the box (`salonHurry`) AND has stopped scrolling — they are waiting,
    // and a photograph that never turns into the room is worse than a brief
    // stall. Someone merely scrolling past the box still gets idle time, so
    // the compile never lands on their gesture.
    const later = (fn: () => void) => {
      if (getExperience().salonHurry && !scrolledRecently()) {
        const id = window.setTimeout(fn, 0)
        cancel = () => window.clearTimeout(id)
      } else {
        cancel = idle(fn)
      }
    }

    const next = () => {
      if (!alive) return
      const o = jobs.shift()
      if (!o) {
        later(() => {
          if (!alive) return
          // Off screen the loop is stopped, so step it by hand; on screen it
          // is on demand, so just ask.
          if (get().frameloop === 'never') advance(performance.now())
          else invalidate()
          setExperience({ salonWarm: true })
          console.info(`[Cut N Curl] Salon warm: ${total} programs compiled, first frame drawn.`)
        })
        return
      }
      // The object is compiled against the real scene, so its program sees the
      // room's lights and environment and is the one that will be used.
      gl.compileAsync(o, camera, scene)
        .catch(() => {})
        .then(() => {
          if (alive) later(next)
        })
    }
    later(next)

    return () => {
      alive = false
      cancel()
    }
  }, [gl, scene, camera, advance, invalidate, get])
  return null
}

/**
 * Everything that lives inside the <Canvas>.
 *
 * Responsibilities beyond composition:
 *   • Configuring the renderer's tone mapping to match the lighting rig.
 *   • Watching real frame times and shedding quality if the device cannot
 *     hold a usable rate — a stuttering premium site is worse than a simpler
 *     smooth one.
 *   • Releasing the shared geometry/material/texture caches on unmount, since
 *     those deliberately outlive individual components.
 */
export default function SalonScene({ profile }: { profile: DeviceProfile }) {
  const gl = useThree((s) => s.gl)
  const degraded = useExperience((s) => s.degraded)

  const tier = degraded && profile.tier === 'high' ? 'medium' : profile.tier
  const usePost = profile.postProcessing && !degraded

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = LIGHTING.toneMappingExposure
    gl.outputColorSpace = THREE.SRGBColorSpace
  }, [gl])

  // Report ready once the first frames have actually been drawn, rather than
  // when React finishes mounting — the difference is very visible.
  const framesDrawn = useRef(0)
  const watchdog = useRef(
    createFrameWatchdog(() => {
      console.info('[Cut N Curl] Sustained frame drops — reducing scene quality.')
      setExperience({ degraded: true })
    }),
  )

  useFrame((_, delta) => {
    if (framesDrawn.current < 3) {
      framesDrawn.current++
      if (framesDrawn.current === 3) setExperience({ phase: 'intro', progress: 1 })
      return
    }
    // Frames are drawn on demand, so a long gap between two of them is a
    // settled room, not a dropped frame. Only contiguous frames are judged.
    if (delta < 0.25) watchdog.current(delta)
  })

  useEffect(
    () => () => {
      disposeGeometries()
      disposeSharedMaterials()
      disposeGeneratedTextures()
    },
    [],
  )

  return (
    <>
      <LightingSystem tier={tier} />
      <SalonModel tier={tier} />

      <CameraController isMobile={profile.isMobile} />

      {usePost && <Effects />}

      {/* Drops resolution rather than frame rate when the GPU is struggling. */}
      <AdaptiveDpr pixelated={false} />

      {/*
        Shadow maps only ever need drawing once: nothing in this salon moves.
        Re-baked whenever the tier changes, since that changes the map size.
      */}
      {tier === 'high' && <BakeShadows key={`shadows-${tier}`} />}

      <WarmShaders />
    </>
  )
}
