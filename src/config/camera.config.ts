/**
 * CAMERA CONFIGURATION
 * ---------------------------------------------------------------------------
 * Every cinematic camera position in the salon. Poses are authored for a
 * desktop landscape viewport; the `mobile` block overrides FOV/placement on
 * narrow portrait screens, where a landscape framing would crop badly.
 *
 * Coordinates are metres in the room space defined by `room.config.ts`.
 */

import type { SectionId } from './site.config'

export type Vec3 = [number, number, number]

export type CameraPose = {
  id: string
  label: string
  position: Vec3
  target: Vec3
  fov: number
  /** How far the visitor may orbit around this pose, in degrees. */
  azimuthRange?: number
  minDistance?: number
  maxDistance?: number
  /** Portrait / small-screen overrides. */
  mobile?: Partial<Pick<CameraPose, 'position' | 'target' | 'fov'>>
}

export const CAMERA_POSES = {
  /**
   * 1 · HERO — down the length of the hall.
   *
   * The room is long and narrow, so the flattering shot is the one the
   * walkthrough itself opens with: stand off-centre near the reception and
   * look up the room, catching the arches receding down both walls, the
   * parallel band on the ceiling and the marble running away to the bench.
   */
  hero: {
    id: 'hero',
    label: 'Hero',
    position: [0.78, 1.6, -5.75],
    target: [-0.2, 1.3, 1.6],
    fov: 44,
    azimuthRange: 20,
    minDistance: 3.2,
    maxDistance: 8.4,
    mobile: { position: [0.66, 1.62, -6.2], target: [-0.15, 1.32, 1.5], fov: 62 },
  },

  /** 2 · RECEPTION — the marble block under the curved comb of light. */
  reception: {
    id: 'reception',
    label: 'Reception',
    position: [1.3, 1.68, -7.5],
    target: [-0.45, 1.5, -5.8],
    fov: 46,
    azimuthRange: 18,
    minDistance: 1.5,
    maxDistance: 3.4,
    mobile: { position: [1.05, 1.7, -7.5], target: [-0.4, 1.52, -5.85], fov: 64 },
  },

  /** 3 · NAIL BAR — the "Nail Art" shelving in the back studio. */
  nails: {
    id: 'nails',
    label: 'Nail Bar',
    position: [-4.7, 1.52, 3.15],
    target: [-2.45, 1.38, 3.5],
    fov: 45,
    azimuthRange: 18,
    minDistance: 1.3,
    maxDistance: 3.0,
    mobile: { position: [-5.1, 1.54, 3.3], target: [-2.45, 1.4, 3.5], fov: 62 },
  },

  /** 4 · STYLING STATIONS — raking down the west wall of arches. */
  stations: {
    id: 'stations',
    label: 'Styling Stations',
    position: [1.45, 1.42, 0.9],
    target: [-1.85, 1.5, -3.9],
    fov: 43,
    azimuthRange: 20,
    minDistance: 2.6,
    maxDistance: 6.4,
    mobile: { position: [1.5, 1.46, 1.6], target: [-1.8, 1.5, -3.7], fov: 60 },
  },

  /** 5 · MIRROR — the long backlit mirror over the makeup vanity. */
  mirror: {
    id: 'mirror',
    label: 'The Mirror',
    // A three-quarter view: the mirror square-on filled the frame and showed
    // nothing of the vanity it sits above.
    position: [-3.9, 1.62, 1.35],
    target: [-5.15, 1.25, 4.2],
    fov: 45,
    azimuthRange: 18,
    minDistance: 2.0,
    maxDistance: 3.6,
    mobile: { position: [-4.15, 1.64, 1.1], target: [-5.05, 1.28, 4.2], fov: 64 },
  },

  /** 6 · WASH BAY — the L'Oréal wall along the studio's south side. */
  wash: {
    id: 'wash',
    label: 'Wash Bay',
    position: [-5.3, 1.6, 3.2],
    target: [-5.0, 1.4, 0.5],
    fov: 45,
    azimuthRange: 18,
    minDistance: 1.6,
    maxDistance: 3.2,
    mobile: { position: [-5.4, 1.62, 3.6], target: [-5.0, 1.42, 0.5], fov: 62 },
  },

  /** 7 · FLOOR — wide diagonal across the styling floor, used for Team. */
  floor: {
    id: 'floor',
    label: 'The Floor',
    position: [-1.5, 1.75, -5.2],
    target: [1.3, 1.2, 1.8],
    fov: 46,
    azimuthRange: 18,
    minDistance: 3.0,
    maxDistance: 8.2,
    mobile: { position: [-1.35, 1.78, -5.7], target: [1.2, 1.22, 1.7], fov: 64 },
  },

  /** 8 · STATION DETAIL — one arch and its chair, used for the booking CTA. */
  station_detail: {
    id: 'station_detail',
    label: 'Station',
    position: [0.55, 1.35, -0.35],
    target: [-2.05, 1.42, -1.5],
    fov: 40,
    azimuthRange: 15,
    minDistance: 1.4,
    maxDistance: 3.6,
    mobile: { position: [0.4, 1.4, -0.05], target: [-2.0, 1.42, -1.45], fov: 58 },
  },

  /** 9 · ENTRANCE — pull back to the shopfront for the closing frame. */
  entrance: {
    id: 'entrance',
    label: 'Entrance',
    position: [0.1, 1.72, -7.35],
    target: [0, 1.3, 1.2],
    fov: 48,
    azimuthRange: 16,
    minDistance: 3.5,
    maxDistance: 8.8,
    mobile: { position: [0.05, 1.74, -7.45], target: [0, 1.32, 1.1], fov: 66 },
  },
} as const satisfies Record<string, CameraPose>

export type CameraPoseId = keyof typeof CAMERA_POSES

/**
 * Views offered in the on-screen switcher.
 *
 * Picking one moves the camera and nothing else — the page does not scroll.
 * These deliberately do NOT name a page section: the switcher is a viewer for
 * the room, not a set of anchor links. Which pose is live at any moment is
 * resolved in `hooks/useExperienceStore`.
 */
export const CAMERA_VIEWS: { pose: CameraPoseId; label: string }[] = [
  { pose: 'hero', label: 'Hero' },
  { pose: 'reception', label: 'Reception' },
  { pose: 'nails', label: 'Nail Bar' },
  { pose: 'stations', label: 'Stations' },
  { pose: 'mirror', label: 'Mirror' },
  { pose: 'floor', label: 'The Floor' },
]

/** Which pose the camera flies to as each page section scrolls into view. */
export const SECTION_CAMERA: Record<SectionId, CameraPoseId> = {
  hero: 'hero',
  story: 'reception',
  services: 'nails',
  stations: 'stations',
  gallery: 'mirror',
  team: 'floor',
  booking: 'station_detail',
  contact: 'entrance',
}

/**
 * Shared orbit limits — keeps the camera out of the ceiling and the floor.
 *
 * Note what is NOT here: wheel zoom. On a scroll-driven page the wheel belongs
 * to the page, and letting OrbitControls dolly on the same gesture drove the
 * camera into the walls. Pinch-zoom survives on touch, where nothing competes
 * for it.
 */
export const ORBIT_LIMITS = {
  minPolarAngle: Math.PI * 0.22,
  maxPolarAngle: Math.PI * 0.56,
  minDistance: 1.5,
  maxDistance: 9,
  dampingFactor: 0.055,
  rotateSpeed: 0.55,
  zoomSpeed: 0.65,
} as const

export const resolvePose = (pose: CameraPose, isMobile: boolean): CameraPose =>
  isMobile && pose.mobile ? { ...pose, ...pose.mobile } : pose
