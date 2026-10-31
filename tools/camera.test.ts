/**
 * Camera containment checks.
 *
 * Run with: npm run test:camera
 *
 * Guards the property that every cinematic pose depends on: the camera can
 * never end up inside a wall, and — just as importantly — is never dragged off
 * the framing it was authored for.
 *
 * This exists because both failures shipped at once. `cameraRange`'s
 * predecessor stopped marching at the first point outside the room, and since
 * most poses aim AT a wall (a mirror, the wash bay, the nail shelves) their
 * target is outside by definition, so it reported a maximum dolly of zero.
 * OrbitControls then hauled the camera to its minimum distance and "Nail Bar"
 * showed a blank wall instead of the nail bar.
 */

import { CAMERA_POSES, ORBIT_LIMITS, resolvePose, type CameraPose } from '../src/config/camera.config'
import { CAMERA_VOLUMES } from '../src/config/room.config'
import { cameraInside, cameraRange } from '../src/utils/collision'

let failures = 0
const check = (name: string, ok: boolean, detail = '') => {
  if (ok) {
    console.log(`  PASS  ${name}`)
  } else {
    failures++
    console.log(`  FAIL  ${name}${detail ? ` — ${detail}` : ''}`)
  }
}

type V = { x: number; y: number; z: number }
const vec = ([x, y, z]: readonly number[]): V => ({ x, y, z })
const sub = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z })
const len = (v: V) => Math.hypot(v.x, v.y, v.z)
const norm = (v: V): V => {
  const l = len(v) || 1
  return { x: v.x / l, y: v.y / l, z: v.z / l }
}
const at = (t: V, d: V, k: number): V => ({ x: t.x + d.x * k, y: t.y + d.y * k, z: t.z + d.z * k })
const show = (v: V) => `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`

const poses = Object.entries(CAMERA_POSES) as [string, CameraPose][]

console.log('\nCamera volumes')
console.log(`        ${CAMERA_VOLUMES.length} volumes covering the hall, the makeup room and the doorway`)

/* ---- 1. Every authored pose sits inside the building ---- */
console.log('\nAuthored poses are inside the room')
for (const [id, pose] of poses) {
  for (const isMobile of [false, true]) {
    const p = resolvePose(pose, isMobile)
    const eye = vec(p.position)
    check(
      `${id}${isMobile ? ' (mobile)' : ''} camera position`,
      cameraInside(eye.x, eye.y, eye.z),
      show(eye),
    )
  }
}

/* ---- 2. The dolly range always contains the pose's own distance ---- */
console.log('\nDolly range keeps the authored framing')
for (const [id, pose] of poses) {
  for (const isMobile of [false, true]) {
    const p = resolvePose(pose, isMobile)
    const eye = vec(p.position)
    const target = vec(p.target)
    const offset = sub(eye, target)
    const here = len(offset)
    const ceiling = p.maxDistance ?? ORBIT_LIMITS.maxDistance
    const range = cameraRange(target, norm(offset), Math.max(ceiling, here) + 1)

    const label = `${id}${isMobile ? ' (mobile)' : ''}`
    check(
      `${label} range spans its own distance`,
      range.near <= here + 1e-6 && range.far >= here - 1e-6,
      `distance ${here.toFixed(2)} outside [${range.near.toFixed(2)}, ${range.far.toFixed(2)}]`,
    )
  }
}

/* ---- 3. Dollying anywhere in the allowed range stays inside ---- */
console.log('\nNo reachable dolly position leaves the room')
let escapes = 0
let firstEscape = ''
let samples = 0
for (const [id, pose] of poses) {
  for (const isMobile of [false, true]) {
    const p = resolvePose(pose, isMobile)
    const eye = vec(p.position)
    const target = vec(p.target)
    const offset = sub(eye, target)
    const here = len(offset)
    const dir = norm(offset)
    const ceiling = p.maxDistance ?? ORBIT_LIMITS.maxDistance
    const room = cameraRange(target, dir, Math.max(ceiling, here) + 1)

    // Mirrors what applyLimits hands to OrbitControls.
    const near = Math.min(Math.max(p.minDistance ?? ORBIT_LIMITS.minDistance, room.near), here)
    const far = Math.max(Math.min(ceiling, room.far), here)

    for (let d = near; d <= far; d += 0.05) {
      samples++
      const q = at(target, dir, d)
      if (!cameraInside(q.x, q.y, q.z)) {
        escapes++
        if (!firstEscape) firstEscape = `${id}${isMobile ? ' (mobile)' : ''} at ${d.toFixed(2)}m → ${show(q)}`
      }
    }
  }
}
check('every dolly position within the limits is inside', escapes === 0, firstEscape)
console.log(`        ${samples} positions tested across ${poses.length} poses`)

/* ---- 4. A target on a wall still yields a usable range ---- */
console.log('\nWall-facing targets')
for (const [id, pose] of poses) {
  const target = vec(pose.target)
  const outside = !cameraInside(target.x, target.y, target.z)
  if (!outside) continue
  const offset = sub(vec(pose.position), target)
  const range = cameraRange(target, norm(offset), len(offset) + 2)
  check(`${id} aims at a wall and still has room to stand`, range.far > range.near, `range ${range.near.toFixed(2)}–${range.far.toFixed(2)}`)
}

console.log(failures === 0 ? '\nAll camera checks passed.\n' : `\n${failures} check(s) failed.\n`)
process.exit(failures === 0 ? 0 : 1)
