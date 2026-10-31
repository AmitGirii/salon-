import { useCallback, useEffect, useRef, type ElementRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { ANIM } from '@/config/animation.config'
import { CAMERA_POSES, ORBIT_LIMITS, resolvePose, type CameraPose } from '@/config/camera.config'
import { cameraRange } from '@/utils/collision'
import { useCurrentPose, useExperience } from '@/hooks/useExperienceStore'

type Controls = ElementRef<typeof OrbitControls>

/**
 * Drives the cinematic cameras.
 *
 * Scripted moves and user orbiting both want to own `camera.position`, so only
 * one ever does at a time:
 *
 *   • During a move, GSAP tweens an internal pose and the camera is written
 *     directly from it. `controls.update()` is NOT called — letting
 *     OrbitControls clamp mid-flight against the PREVIOUS pose's limits was
 *     what used to leave the camera somewhere unrelated to the pose it was
 *     flying to.
 *   • On arrival the settled aim is handed over, and OrbitControls takes the
 *     visitor's input from there.
 *   • The next move reads the live camera back in as its start, so there is
 *     never a jump.
 *
 * Orbiting is clamped to a per-pose azimuth window, and the dolly to the walls
 * themselves, so no composition can be spun or reversed into plaster.
 */
export default function CameraController({ isMobile }: { isMobile: boolean }) {
  const controlsRef = useRef<Controls>(null)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  /** Frames are on demand: every camera change has to ask for one. */
  const invalidate = useThree((s) => s.invalidate)
  /** Lets <AdaptiveDpr> ease resolution during a flight, as it does for a drag. */
  const regress = useThree((s) => s.performance.regress)
  const get = useThree((s) => s.get)

  const phase = useExperience((s) => s.phase)

  /** The pose the camera is being driven to, tweened by GSAP. */
  const pose = useRef({
    pos: new THREE.Vector3(),
    target: new THREE.Vector3(),
    fov: 45,
  })
  const moving = useRef(false)
  const tween = useRef<gsap.core.Tween[]>([])
  const initialised = useRef(false)
  /** The move in flight, with the wall-clock time it must be finished by. */
  const inFlight = useRef<{ pose: CameraPose; deadline: number } | null>(null)

  /**
   * Either the section the visitor scrolled to, or the view they picked —
   * `resolvePoseId` owns that decision so nothing here has to. Any change to
   * it flies the camera; nothing else in this file cares which way it came.
   */
  const poseId = useCurrentPose()

  /** Lands the camera on a pose and hands control to OrbitControls. */
  const settle = useCallback(
    (next: CameraPose) => {
      tween.current.forEach((t) => t.kill())
      tween.current = []
      moving.current = false
      inFlight.current = null

      pose.current.pos.set(...next.position)
      pose.current.target.set(...next.target)
      pose.current.fov = next.fov

      camera.position.copy(pose.current.pos)
      camera.fov = next.fov
      camera.updateProjectionMatrix()

      const c = controlsRef.current
      if (c) {
        // Hand the settled aim over before re-enabling, so OrbitControls
        // rebuilds its spherical state from where the camera actually is.
        c.target.copy(pose.current.target)
        c.enabled = true
        applyLimits(c, next, camera)
      }
      // Draw the landed frame.
      invalidate()
    },
    [camera, invalidate],
  )

  useEffect(() => {
    const controls = controlsRef.current
    const next = resolvePose(CAMERA_POSES[poseId], isMobile)

    // First mount: snap rather than fly, so the hero frame is correct on
    // paint instead of swinging in from the origin.
    if (!initialised.current) {
      initialised.current = true
      settle(next)
      return
    }

    // Loop stopped (the box is off screen): nobody can see a flight, so the
    // camera simply lands. A tween here would still tick GSAP for two seconds
    // and ask <AdaptiveDpr> to resize the drawing buffer twice, for nothing.
    if (get().frameloop === 'never') {
      settle(next)
      return
    }

    // Fly from wherever the camera actually is.
    //
    // The target comes from our own record, never from `controls.target`:
    // panning is disabled, so nothing else can have moved it, and reading it
    // back risks picking up a default left by a remount.
    pose.current.pos.copy(camera.position)
    pose.current.fov = camera.fov

    tween.current.forEach((t) => t.kill())
    moving.current = true
    if (controls) controls.enabled = false

    const duration = phase === 'intro' ? ANIM.explore.cameraFly : ANIM.scroll.cameraSettle
    const ease = ANIM.scroll.ease

    /*
     * A wall-clock deadline, not merely the tween's own duration.
     *
     * GSAP's ticker applies lag smoothing: once a frame takes longer than half
     * a second it assumes the tab was backgrounded and clamps the step to
     * 33 ms. On a device slow enough to trigger that, a two-second move takes
     * closer to a minute of real time and the camera visibly hangs part-way
     * between two views. This guarantees it always arrives.
     */
    inFlight.current = { pose: next, deadline: performance.now() + duration * 1000 + 1500 }

    tween.current = [
      gsap.to(pose.current.pos, {
        x: next.position[0],
        y: next.position[1],
        z: next.position[2],
        duration,
        ease,
        // One request per GSAP tick is enough; fiber coalesces them.
        onUpdate: () => {
          if (get().frameloop === 'never') return
          regress()
          invalidate()
        },
      }),
      gsap.to(pose.current.target, {
        x: next.target[0],
        y: next.target[1],
        z: next.target[2],
        duration,
        ease,
      }),
      gsap.to(pose.current, {
        fov: next.fov,
        duration,
        ease,
        onComplete: () => settle(next),
      }),
    ]

    return () => {
      tween.current.forEach((t) => t.kill())
    }
    // `phase` intentionally excluded: it changes mid-flight during the intro
    // and would restart the tween it is meant to describe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poseId, isMobile, camera, settle, invalidate, regress, get])

  useFrame(() => {
    if (!moving.current) return

    const flight = inFlight.current
    if (flight && performance.now() > flight.deadline) {
      settle(flight.pose)
      return
    }

    camera.position.copy(pose.current.pos)
    camera.lookAt(pose.current.target)

    if (Math.abs(camera.fov - pose.current.fov) > 0.01) {
      camera.fov = pose.current.fov
      camera.updateProjectionMatrix()
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      /*
       * Drei asks for a frame on every change (which is how damping keeps
       * running in demand mode), and `regress` lets <AdaptiveDpr> ease the
       * resolution down during a drag so the gesture never stutters.
       */
      regress
      enablePan={false}
      /*
       * Wheel zoom is off. The wheel scrolls the page on this site, and having
       * OrbitControls dolly on the same gesture was what drove the camera into
       * the walls. Pinch-zoom stays on touch, where nothing competes for it.
       */
      enableZoom={isMobile}
      enableDamping
      dampingFactor={ORBIT_LIMITS.dampingFactor}
      rotateSpeed={ORBIT_LIMITS.rotateSpeed}
      zoomSpeed={ORBIT_LIMITS.zoomSpeed}
      minPolarAngle={ORBIT_LIMITS.minPolarAngle}
      maxPolarAngle={ORBIT_LIMITS.maxPolarAngle}
      minDistance={ORBIT_LIMITS.minDistance}
      maxDistance={ORBIT_LIMITS.maxDistance}
      /*
       * `ONE` is deliberately absent: one finger is left to scroll the PAGE,
       * two fingers orbit and pinch. With one finger bound to rotate, a phone
       * visitor could not scroll past the hero at all — the canvas swallowed
       * every swipe. The canvas also carries `touch-action: pan-y`, which is
       * what actually guarantees the browser keeps the gesture.
       */
      touches={{ TWO: THREE.TOUCH.DOLLY_ROTATE }}
    />
  )
}

/**
 * Clamps orbiting to a window around the pose's own viewing direction, and the
 * dolly to the room itself, so no composition can be spun or reversed into a
 * wall.
 */
function applyLimits(controls: Controls | null, pose: CameraPose, camera: THREE.Camera) {
  if (!controls) return
  const range = ((pose.azimuthRange ?? 22) * Math.PI) / 180

  const offset = new THREE.Vector3().subVectors(camera.position, controls.target)
  const azimuth = Math.atan2(offset.x, offset.z)

  controls.minAzimuthAngle = azimuth - range
  controls.maxAzimuthAngle = azimuth + range

  /*
   * Bound the dolly by the walls rather than by a hand-tuned number, so no
   * pose can reverse out through the shopfront however carelessly it is
   * written. `cameraRange` returns the span of the view ray that is actually
   * inside the building; the authored distances then narrow it further.
   *
   * The pose's own distance is always kept inside the range — clamping the
   * camera away from the framing it was authored for would be a cure worse
   * than the disease.
   */
  const dir = offset.clone().normalize()
  const here = offset.length()
  const ceiling = pose.maxDistance ?? ORBIT_LIMITS.maxDistance
  const room = cameraRange(controls.target, dir, Math.max(ceiling, here) + 1)

  const near = Math.min(Math.max(pose.minDistance ?? ORBIT_LIMITS.minDistance, room.near), here)
  const far = Math.max(Math.min(ceiling, room.far), here)

  controls.minDistance = near
  controls.maxDistance = Math.max(near + 0.1, far)
  controls.update()
}
