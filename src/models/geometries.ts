/**
 * Shared geometry library.
 *
 * Every repeated piece of salon furniture is built from these cached
 * geometries, so seven styling chairs upload one seat, one backrest and one
 * armrest to the GPU rather than seven of each.
 *
 * Geometries are created lazily on first use and cached for the lifetime of
 * the scene; `disposeGeometries()` releases them when the canvas unmounts.
 */

import * as THREE from 'three'

const cache = new Map<string, THREE.BufferGeometry>()

function cached<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  const hit = cache.get(key)
  if (hit) return hit as T
  const geo = make()
  cache.set(key, geo)
  return geo
}

/** Rounded rectangle outline, used as the profile for extruded slabs. */
export function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const radius = Math.min(r, w / 2, h / 2)
  const x = -w / 2
  const y = -h / 2
  const s = new THREE.Shape()
  s.moveTo(x + radius, y)
  s.lineTo(x + w - radius, y)
  s.quadraticCurveTo(x + w, y, x + w, y + radius)
  s.lineTo(x + w, y + h - radius)
  s.quadraticCurveTo(x + w, y + h, x + w - radius, y + h)
  s.lineTo(x + radius, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - radius)
  s.lineTo(x, y + radius)
  s.quadraticCurveTo(x, y, x + radius, y)
  return s
}

/**
 * A slab with rounded corners AND softened edges.
 *
 * Upholstery never has a knife edge; the bevel is what stops the white leather
 * reading as a cardboard box under the salon's raking LED light.
 */
export function roundedSlab(
  w: number,
  h: number,
  d: number,
  cornerRadius = 0.05,
  bevel = 0.012,
): THREE.ExtrudeGeometry {
  const key = `slab:${w},${h},${d},${cornerRadius},${bevel}`
  return cached(key, () => {
    const depth = Math.max(0.001, d - bevel * 2)
    const geo = new THREE.ExtrudeGeometry(roundedRectShape(w, h, cornerRadius), {
      depth,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelOffset: 0,
      bevelSegments: 2,
      curveSegments: 5,
    })
    geo.translate(0, 0, -(depth / 2))
    geo.computeVertexNormals()
    return geo
  })
}

export const box = (w: number, h: number, d: number) =>
  cached(`box:${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d))

export const cylinder = (rt: number, rb: number, h: number, seg = 20) =>
  cached(`cyl:${rt},${rb},${h},${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg))

/** Partial-sweep cylinder — used for arched crowns and curved bulkheads. */
export const cylinderArc = (r: number, h: number, seg = 20, thetaLength = Math.PI) =>
  cached(
    `cylArc:${r},${h},${seg},${thetaLength}`,
    () => new THREE.CylinderGeometry(r, r, h, seg, 1, false, 0, thetaLength),
  )

/**
 * Open-ended partial cylinder — the wrap-around shell of a tub chair.
 * Rendered with a double-sided material, since you see the inside of the back.
 */
export const cylinderShell = (
  r: number,
  h: number,
  thetaStart: number,
  thetaLength: number,
  seg = 28,
) =>
  cached(
    `shell:${r},${h},${thetaStart.toFixed(3)},${thetaLength.toFixed(3)},${seg}`,
    () => new THREE.CylinderGeometry(r, r, h, seg, 1, true, thetaStart, thetaLength),
  )

/** Torus arc — top rims, footrest brackets and the curved ceiling strips. */
export const torusArc = (radius: number, tube: number, arc: number, seg = 26, tubeSeg = 10) =>
  cached(
    `torus:${radius},${tube},${arc.toFixed(3)},${seg},${tubeSeg}`,
    () => new THREE.TorusGeometry(radius, tube, tubeSeg, seg, arc),
  )

export const sphere = (r: number, seg = 16) =>
  cached(`sph:${r},${seg}`, () => new THREE.SphereGeometry(r, seg, seg / 2))

export const plane = (w: number, h: number) =>
  cached(`pln:${w},${h}`, () => new THREE.PlaneGeometry(w, h))

/* ------------------------------------------------- styling chair geometry */

/**
 * Styling chair, measured off the walkthrough.
 *
 * The real chair is a shield-backed tub: a curved upholstered panel standing
 * behind a visible seat cushion, capped with a thin champagne band along its
 * top edge, on a champagne column and a heavy round disc, with a bracket
 * footrest reaching forward from the column.
 *
 * The back is a section of a LARGE cylinder rather than a small one — radius
 * 0.42 with a 1.5 rad sweep gives a gently curved shield about 0.57 m across.
 * A small radius wrapped right around the seat and read as a drum.
 */
export const CHAIR = {
  baseRadius: 0.25,
  baseHeight: 0.036,
  columnRadius: 0.048,
  columnHeight: 0.28,
  hydraulicRadius: 0.064,
  hydraulicHeight: 0.14,

  seatWidth: 0.52,
  seatDepth: 0.5,
  seatThickness: 0.13,
  seatY: 0.47,

  /** Curved back panel: big radius, modest sweep. */
  backRadius: 0.42,
  backArc: 1.5,
  backHeight: 0.56,
  /** The panel's axis sits forward of the seat, so the shield bows behind it. */
  backAxisZ: 0.14,
  /** Champagne band capping the top edge, clearly visible in the reference. */
  rimTube: 0.015,

  armLength: 0.36,
  armWidth: 0.085,
  armY: 0.66,

  footrestY: 0.25,
  footrestReach: 0.34,
  footrestPad: 0.19,
} as const

export const chairGeometries = {
  base: () => cylinder(CHAIR.baseRadius, CHAIR.baseRadius * 0.95, CHAIR.baseHeight, 40),
  column: () => cylinder(CHAIR.columnRadius, CHAIR.columnRadius, CHAIR.columnHeight, 20),
  hydraulic: () => cylinder(CHAIR.hydraulicRadius, CHAIR.hydraulicRadius * 1.1, CHAIR.hydraulicHeight, 20),
  seat: () => roundedSlab(CHAIR.seatWidth, CHAIR.seatDepth, CHAIR.seatThickness, 0.075),
  /** Theta 0 points at +Z, so centring the sweep on PI puts the panel behind. */
  back: () =>
    cylinderShell(
      CHAIR.backRadius,
      CHAIR.backHeight,
      Math.PI - CHAIR.backArc / 2,
      CHAIR.backArc,
      24,
    ),
  rim: () => torusArc(CHAIR.backRadius, CHAIR.rimTube, CHAIR.backArc, 26, 8),
  arm: () => roundedSlab(CHAIR.armLength, CHAIR.armWidth, 0.075, 0.03),
  footrestArm: () => cylinder(0.014, 0.014, CHAIR.footrestReach, 10),
  footrestPad: () => roundedSlab(CHAIR.footrestPad, 0.13, 0.022, 0.012, 0.006),
  /** Simplified stand-ins used by the LOD at distance. */
  lodSeat: () => box(CHAIR.seatWidth, CHAIR.seatThickness, CHAIR.seatDepth),
  lodBack: () => box(CHAIR.seatWidth * 0.95, CHAIR.backHeight, 0.14),
}

export function disposeGeometries() {
  cache.forEach((g) => g.dispose())
  cache.clear()
}
