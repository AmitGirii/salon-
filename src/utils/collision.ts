/**
 * Keeps the cinematic camera inside the building.
 *
 * The salon is described in `room.config.ts` as a union of boxes. Nothing here
 * simulates a person any more — the first-person walkthrough was removed — so
 * all that remains is the geometry the camera is allowed to occupy, and how
 * far along a view ray it may travel before it would be standing in plaster.
 */

import { CAMERA_VOLUMES } from '@/config/room.config'

/** True when the cinematic camera may occupy this point. */
export function cameraInside(x: number, y: number, z: number): boolean {
  for (const v of CAMERA_VOLUMES) {
    if (x >= v.minX && x <= v.maxX && z >= v.minZ && z <= v.maxZ && y >= v.minY && y <= v.maxY) {
      return true
    }
  }
  return false
}

/**
 * The stretch of the view ray, measured out from `target`, on which the camera
 * is inside the building.
 *
 * Nearly every pose aims AT something — a mirror, the wash wall, the nail
 * shelves — so the target itself usually sits on or just through a wall, and
 * therefore outside the walkable volume. An earlier version marched outward
 * and stopped at the first point that was outside, which for those poses was
 * the very first step: it reported a maximum dolly of zero and OrbitControls
 * then yanked the camera to its minimum distance from the wall. That is why
 * "Nail Bar" showed a wall rather than the nail bar.
 *
 * So: march the whole ray, note where it ENTERS the room and where it leaves
 * again, and return that span. `near` keeps the camera from dollying forward
 * into the wall behind the target; `far` keeps it from reversing out through
 * the one behind itself.
 */
export function cameraRange(
  target: { x: number; y: number; z: number },
  dir: { x: number; y: number; z: number },
  limit: number,
  step = 0.05,
): { near: number; far: number } {
  const inside = (d: number) =>
    cameraInside(target.x + dir.x * d, target.y + dir.y * d, target.z + dir.z * d)

  let near = 0
  let far = 0
  let entered = false

  for (let d = step; d <= limit; d += step) {
    if (inside(d)) {
      if (!entered) {
        entered = true
        near = d
      }
      far = d
    } else if (entered) {
      break // left the room again; the first clear span is the one we want
    }
  }

  if (!entered) return { near: 0, far: limit }

  /*
   * Refine both ends against the wall.
   *
   * A 5 cm march can leave the reported edge up to a step short of the real
   * one, and a pose standing nearer the wall than that would then be reported
   * as out of range — the camera would be pulled off its authored framing for
   * the sake of a rounding error. Six bisections put each edge within a
   * millimetre.
   */
  const refine = (insideAt: number, outsideAt: number) => {
    let lo = insideAt
    let hi = outsideAt
    for (let i = 0; i < 6; i++) {
      const mid = (lo + hi) / 2
      if (inside(mid)) lo = mid
      else hi = mid
    }
    return lo
  }

  return {
    near: near > step ? refine(near, near - step) : near,
    far: refine(far, Math.min(far + step, limit + step)),
  }
}
