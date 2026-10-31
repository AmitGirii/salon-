/**
 * SALON ARCHITECTURE CONFIGURATION
 * ---------------------------------------------------------------------------
 * Reconstructed from the salon's own reference material for Cut N Curl,
 * 281/L Model Town, Rewari.
 *
 * REVISED against the 1080p walkthrough (`Final3 (3).mp4`), which shows far
 * more of the room than the earlier portrait footage did. Several things in
 * the first reconstruction were wrong and are corrected here:
 *
 *   • The styling hall is SYMMETRIC. Mirrors and chairs run down BOTH long
 *     walls, not one. The earlier model had a single wall of mirrors facing an
 *     empty room.
 *   • The mirrors are not free-standing ovals on a flat wall. Each sits inside
 *     an ARCHED NICHE recessed into the plaster, lit from behind so the warm
 *     halo falls on the inside of the recess. That detail is the single
 *     strongest piece of the salon's identity.
 *   • The hall is much NARROWER than modelled — roughly 4.6 m across, not 6.8.
 *     Scale came from staff standing in frame: a 1.7 m person against the
 *     floor-to-ceiling height puts the ceiling at ~3.0 m, and the walkway
 *     between the two chair rows at a little over 2 m.
 *   • The walls carry recessed rectangular PANEL MOULDING — plain shadow
 *     reveals in ivory plaster, not the gold inlay previously modelled.
 *   • An armless upholstered BENCH sits against the panelled end wall.
 *   • The reception ceiling carries seven CURVED strips that arc off the
 *     soffit and bend down the wall behind the desk.
 *
 * WHAT IS OBSERVED vs. WHAT IS INFERRED
 * -------------------------------------
 * Observed: everything above, plus the marble block reception desk with its
 * lit base reveal, the arched product niche beside it, the L'Oréal wash wall,
 * the "Nail Art" shelving, the long backlit makeup mirror over its drawered
 * vanity, the treatment bed, and the nested-diamond ceiling figure.
 *
 * Inferred: absolute room lengths, and how the two rooms connect. The video
 * never shows a floor plan, so the layout is a best fit that keeps every
 * observed element in a coherent, correctly-proportioned space.
 *
 * All units are METRES. +X is right, +Y is up, +Z is toward the back of the
 * salon. A visitor enters at the south end (minZ).
 */

export type Rect = { minX: number; maxX: number; minZ: number; maxZ: number }

export const ROOM = {
  /** Floor-to-ceiling height, from staff standing against the wall in frame. */
  height: 3.0,
  /** The back studio sits under a slightly lower slab. */
  studioHeight: 2.88,
  wallThickness: 0.12,

  /**
   * Main hall: entrance → reception → the symmetric styling floor → bench.
   * 4.6 m across, which is what the two facing chair rows and the walkway
   * between them measure out to.
   */
  hall: { minX: -2.3, maxX: 2.3, minZ: -8.0, maxZ: 3.6 } as Rect,

  /** Back studio, opening off the hall's west wall. */
  studio: { minX: -7.4, maxX: -2.3, minZ: 0.4, maxZ: 4.4 } as Rect,

  /** Opening cut through the shared wall at x = hall.minX. */
  doorway: { x: -2.3, minZ: 1.2, maxZ: 2.7, height: 2.3 },

  /** Glazed shopfront at the south end — the scene's only daylight source. */
  entrance: { z: -8.0, minX: -1.15, maxX: 1.15, height: 2.4, sillHeight: 0.0 },
} as const

/** Zone anchors used by the camera rig. */
export const ZONES = {
  entrance: { x: 0, z: -7.3 },
  reception: { x: -0.4, z: -6.1 },
  styling: { x: 0, z: -2.4 },
  bench: { x: 0, z: 3.2 },
  studio: { x: -4.8, z: 2.4 },
  wash: { x: -4.8, z: 0.9 },
  makeup: { x: -4.8, z: 3.9 },
} as const

export type ZoneId = keyof typeof ZONES

/* ---------------------------------------------------------------- STATIONS */

/**
 * The arched mirror niche.
 *
 * A capsule — semicircular top and bottom — recessed into the wall, with the
 * mirror inset a little way inside it. The gap between the two is what the
 * concealed LED washes, and it is why the halo in the reference reads as a
 * glowing outline rather than as a lamp.
 *
 * Sized from the walkthrough: the mirrors stand nearly floor-to-ceiling, about
 * 1.94 m of glass starting 0.42 m off the floor, and are notably slender —
 * roughly 0.62 m across.
 */
export const MIRROR_ARCH = {
  /** The recess cut into the plaster. */
  niche: { width: 0.8, height: 2.2, bottom: 0.3, depth: 0.1 },
  /** The glass sitting inside it. */
  glass: { width: 0.62, height: 1.94, bottom: 0.42 },
  /** How far the glass stands proud of the back of the recess. */
  glassOffset: 0.055,
} as const

export type StationSide = 'west' | 'east'

export type Station = {
  id: string
  side: StationSide
  z: number
  /** Wall plane the niche is cut into. */
  wallX: number
  /** Where the chair stands, and which way it faces. */
  chair: { x: number; z: number; rotationY: number }
  /** The console under the mirror. */
  console: { x: number; z: number; rotationY: number }
}

const STATION_Z = [-4.4, -2.9, -1.4, 0.1]

/**
 * Seven stations: four down the west wall, three down the east. The video
 * shows them facing each other across the walkway, aligned rather than
 * staggered, with the fourth east bay given over to product shelving.
 */
export const STYLING_STATIONS: Station[] = [
  ...STATION_Z.map((z, i) => ({
    id: `w${i + 1}`,
    side: 'west' as const,
    z,
    wallX: ROOM.hall.minX,
    chair: { x: ROOM.hall.minX + 1.02, z, rotationY: -Math.PI / 2 },
    console: { x: ROOM.hall.minX + 0.19, z, rotationY: -Math.PI / 2 },
  })),
  ...STATION_Z.slice(0, 3).map((z, i) => ({
    id: `e${i + 1}`,
    side: 'east' as const,
    z,
    wallX: ROOM.hall.maxX,
    chair: { x: ROOM.hall.maxX - 1.02, z, rotationY: Math.PI / 2 },
    console: { x: ROOM.hall.maxX - 0.19, z, rotationY: Math.PI / 2 },
  })),
]

/** The console below each mirror: a slab top on a drawered box. */
export const STATION_CONSOLE = {
  width: 0.74,
  depth: 0.34,
  height: 0.79,
  topThickness: 0.035,
} as const

/** Armless upholstered bench against the panelled end wall. */
export const BENCH = {
  x: 0,
  z: ROOM.hall.maxZ - 0.42,
  width: 2.24,
  depth: 0.62,
  seatHeight: 0.42,
  backHeight: 0.34,
  /** Channel seams across the seat, as in the reference. */
  channels: 7,
} as const

/**
 * Tall open shelving on the east wall past the last mirror — the white cubby
 * unit visible at the right of the wide shots.
 */
export const DISPLAY_SHELF = {
  x: ROOM.hall.maxX,
  z: 1.05,
  width: 1.6,
  height: 2.3,
  depth: 0.3,
  columns: 3,
  rows: 5,
} as const

/* ------------------------------------------------------------ WALL PANELS */

/**
 * Recessed rectangular moulding.
 *
 * Plain shadow reveals cut into ivory plaster — no gold, no applied frame.
 * The end wall carries a pair of nested rectangles; the side walls carry
 * single panels in the bays between the arches.
 */
export type WallPanel = {
  wall: 'north' | 'west' | 'east'
  /** Position along the wall: x for the north wall, z for the side walls. */
  along: number
  y: number
  width: number
  height: number
  /** Draw a second rectangle inside this one. */
  nested?: boolean
}

export const WALL_PANELS: WallPanel[] = [
  { wall: 'north', along: 0, y: 1.68, width: 2.4, height: 1.86, nested: true },
  { wall: 'west', along: -3.65, y: 1.5, width: 0.82, height: 1.66 },
  { wall: 'west', along: -2.15, y: 1.5, width: 0.82, height: 1.66 },
  { wall: 'west', along: -0.65, y: 1.5, width: 0.82, height: 1.66 },
  { wall: 'east', along: -3.65, y: 1.5, width: 0.82, height: 1.66 },
  { wall: 'east', along: -2.15, y: 1.5, width: 0.82, height: 1.66 },
  { wall: 'east', along: -0.65, y: 1.5, width: 0.82, height: 1.66 },
]

/* ------------------------------------------------------------- RECEPTION */

export const RECEPTION = {
  /**
   * A solid marble block, not a joinery desk — a single Calacatta volume with
   * a lit reveal running along the base of the front face.
   */
  desk: { x: -0.35, z: -6.25, width: 2.4, depth: 0.76, height: 1.06 },
  /** Warm slot glowing under the front face. */
  baseReveal: { height: 0.055, inset: 0.09 },
  /** Wall behind the desk, carrying the curved strips overhead. */
  backWall: { z: -5.45, height: ROOM.height },
  /** Arched niche of floating shelves on the east wall, with a cabinet below. */
  productNiche: {
    x: ROOM.hall.maxX,
    z: -6.0,
    width: 0.95,
    height: 1.5,
    bottom: 1.04,
    depth: 0.16,
    shelves: 3,
  },
  cabinet: { x: ROOM.hall.maxX - 0.21, z: -6.0, width: 1.1, height: 0.92, depth: 0.42 },
} as const

/* -------------------------------------------------- BACK STUDIO: WASH BAY */

/** L'Oréal wall along the studio's south side. */
export const WASH_BAY = {
  z: ROOM.studio.minZ,
  band: { y: 2.4, height: 0.44, minX: -7.0, maxX: -2.75 },
  niches: [
    { y: 1.76, height: 0.44, minX: -6.9, maxX: -2.85 },
    { y: 1.18, height: 0.42, minX: -6.9, maxX: -2.85 },
  ],
  cabinet: { y: 0.42, height: 0.84, minX: -6.95, maxX: -2.8 },
  basins: [
    { x: -6.0, z: ROOM.studio.minZ + 0.55 },
    { x: -3.8, z: ROOM.studio.minZ + 0.55 },
  ],
} as const

/* -------------------------------------------------- BACK STUDIO: NAIL BAR */

export const NAIL_BAR = {
  /** "Nail Art" shelving on the studio's east wall, north of the doorway. */
  x: ROOM.studio.maxX,
  z: 3.5,
  width: 1.6,
  height: 1.5,
  y: 1.36,
  rows: 4,
  bottlesPerRow: 11,
  /** Retail column beside it. */
  productShelf: { x: ROOM.studio.maxX - 0.02, z: 2.0, width: 0.9, height: 1.5, y: 1.12, shelves: 5 },
  /** Sheet-covered treatment bed in the middle of the studio. */
  treatmentBed: { x: -6.3, z: 1.9, rotationY: 0, length: 1.86, width: 0.7, height: 0.66 },
} as const

/* ----------------------------------------------- BACK STUDIO: MAKEUP WALL */

/** The long backlit mirror over its drawered vanity, on the studio's north wall. */
export const MAKEUP_ROOM = {
  vanity: {
    centerX: -4.9,
    z: ROOM.studio.maxZ - 0.3,
    width: 2.6,
    depth: 0.52,
    height: 0.78,
    drawers: 4,
  },
  mirror: {
    centerX: -4.9,
    z: ROOM.studio.maxZ - 0.02,
    width: 1.98,
    height: 1.16,
    y: 1.56,
    /** Warm halo bleeding out of every edge. */
    glowPadding: 0.05,
  },
  chairs: [-5.72, -4.45].map((x) => ({
    x,
    z: ROOM.studio.maxZ - 1.22,
    rotationY: 0,
  })),
  curtain: {
    x: ROOM.studio.minX + 0.09,
    minZ: ROOM.studio.minZ + 0.5,
    maxZ: ROOM.studio.maxZ - 0.25,
    height: ROOM.studioHeight - 0.05,
    folds: 24,
  },
} as const

/* -------------------------------------------------------------- CEILING */

export const CEILING = {
  /**
   * The hall's signature: a tight bundle of parallel LED runs down the centre
   * of the ceiling, recessed into a shallow tray. Their ends are stepped
   * rather than square, which is clearly visible looking up the room.
   */
  hallBand: {
    xs: [-0.52, -0.31, -0.1, 0.1, 0.31, 0.52],
    /** Each run is offset from the last, giving the staggered end. */
    stagger: 0.24,
    minZ: -4.9,
    maxZ: 1.5,
    width: 0.032,
    tray: { width: 1.5, drop: 0.1 },
  },

  /**
   * Reception: seven strips that arc off the soffit and bend down the wall
   * behind the desk. Modelled as quarter-torus segments, which is exactly the
   * geometry the fitting describes.
   */
  receptionFan: {
    count: 7,
    radius: 0.85,
    z: -5.5,
    spread: 1.85,
    centerX: -0.35,
    width: 0.026,
  },

  /** Nested-diamond figure over the back studio. */
  diamond: {
    center: { x: -4.85, z: 2.3 },
    rings: [1.72, 1.22, 0.76],
    tray: { width: 4.2, depth: 3.9, drop: 0.14 },
    stripWidth: 0.036,
  },

  downlights: [
    [-1.55, -7.1], [1.55, -7.1],
    [-1.6, -5.9], [1.6, -5.9],
    [-1.72, -4.2], [1.72, -4.2],
    [-1.72, -2.5], [1.72, -2.5],
    [-1.72, -0.8], [1.72, -0.8],
    [-1.6, 1.0], [1.6, 1.0],
    [-1.5, 2.7], [1.5, 2.7],
    [-3.2, 1.1], [-6.6, 1.1], [-3.2, 3.8], [-6.6, 3.8],
  ] as [number, number][],

  speakers: [
    [0, -6.6], [0, -3.4], [0, 0.2], [0, 3.0], [-4.9, 0.9], [-4.9, 3.8],
  ] as [number, number][],
} as const

/* --------------------------------------------------------- CAMERA BOUNDS */

/**
 * Where a cinematic camera is allowed to be.
 *
 * The room interiors inset by a camera margin, plus the doorway so a pose can
 * see between the two rooms. `cameraRange` in utils/collision marches along
 * the view ray against these and hands OrbitControls a dolly limit that stops
 * short of the plaster.
 */
export type Volume = Rect & { minY: number; maxY: number }

export const CAMERA_MARGIN = 0.34

export const CAMERA_VOLUMES: Volume[] = [
  {
    minX: ROOM.hall.minX + CAMERA_MARGIN,
    maxX: ROOM.hall.maxX - CAMERA_MARGIN,
    minZ: ROOM.hall.minZ + CAMERA_MARGIN,
    maxZ: ROOM.hall.maxZ - CAMERA_MARGIN,
    minY: 0.35,
    maxY: ROOM.height - 0.25,
  },
  {
    minX: ROOM.studio.minX + CAMERA_MARGIN,
    maxX: ROOM.studio.maxX - CAMERA_MARGIN,
    minZ: ROOM.studio.minZ + CAMERA_MARGIN,
    maxZ: ROOM.studio.maxZ - CAMERA_MARGIN,
    minY: 0.35,
    maxY: ROOM.studioHeight - 0.25,
  },
  {
    minX: ROOM.doorway.x - 0.35,
    maxX: ROOM.doorway.x + 0.35,
    minZ: ROOM.doorway.minZ + 0.15,
    maxZ: ROOM.doorway.maxZ - 0.15,
    minY: 0.35,
    maxY: ROOM.doorway.height - 0.2,
  },
]

/* ----------------------------------------------------------- GLB PIPELINE */

/**
 * MODEL SOURCE SWITCH
 * ---------------------------------------------------------------------------
 * The salon currently renders as a fully procedural build from the components
 * in `src/components/3d/`. Nothing here loads a .glb, and no placeholder file
 * is referenced, so the build is never broken by a missing asset.
 *
 * When a photogrammetry / Blender export is ready:
 *   1. Drop the optimised file at `public/models/salon.glb`.
 *   2. Flip `useGltf` to true below.
 * `SalonModel` probes for the file at runtime and silently falls back to the
 * procedural build if it is absent. See README → "Swapping in the real GLB".
 */
export const MODEL = {
  useGltf: false,
  url: '/models/salon.glb',
  dracoPath: '/draco/',
  scale: 1,
  position: [0, 0, 0] as [number, number, number],
  rotationY: 0,
} as const
