/**
 * LIGHTING CONFIGURATION
 * ---------------------------------------------------------------------------
 * OVERALL LEVEL: exposed like an interior photograph, not like a light box.
 *
 * This rig was rebalanced against measured histograms of the render, not by
 * eye. The previous one put the mean frame luminance at 228-239 of 255 with
 * 44-60% of every frame clipped to pure white and literally no pixels in
 * shadow — walls, ceiling, chairs and marble all collapsed onto the same
 * white, and the room read as a flat glare. Targets now:
 *
 *   mean luminance   150-185   a bright room that still has a midtone
 *   clipped white    under 1%  only actual light fittings may clip
 *   deep shadow      1-4%      enough for depth; never a black hole
 *
 * With real tone mapping in the chain the top tier now measures a mean of 163
 * with NOTHING clipped at all — the highlights roll off instead of hitting the
 * ceiling, which is what the filmic curve is for.
 *
 * The fix was NOT exposure. Every emitter was brought down in proportion to
 * how much of the frame it was actually filling, and the near-white material
 * palette was spread apart in value so the surfaces can separate at all. If
 * the room needs to move as a whole, `toneMappingExposure` is the last trim,
 * not the first — turning it up re-clips the highlights immediately.
 *
 * NOTE ON EXPOSURE AND THE TOP TIER. `SalonScene` applies this to the
 * renderer, which covers the medium and low tiers. The top tier runs through
 * the effect composer, which renders into its own HDR buffer and ignores the
 * renderer's tone mapping entirely — so this value did nothing there, and the
 * top tier had no filmic rolloff at all, only clamping. `Effects` now carries
 * an explicit ACES tone-mapping pass so all three tiers share this knob and
 * land within about ten luminance levels of each other. See Effects.tsx.
 *
 * Hierarchy, brightest contribution first:
 *   1. environment rig + ambient   the base illumination everything sits in
 *   2. key spot over the floor     the only broad shadow caster
 *   3. ceiling LED runs            architectural, local, soft
 *   4. fills (bounce, daylight)    lifts the corners
 *   5. accents (halo, niches)      small, and never structural
 *
 * The reference salon is lit almost entirely by warm recessed LED: linear
 * strips in the ceiling, halos behind the mirrors, and backlit product niches.
 * There is one cool daylight source — the glazed shopfront.
 *
 * The scene therefore keys off:
 *   1. A hand-built environment rig (soft area emitters) that supplies the
 *      reflections on gold and marble without downloading an HDRI.
 *   2. A small number of real point/spot lights for shape and contact shadow.
 *   3. Emissive geometry for anything the visitor can actually see glowing.
 *
 * Intensities are tuned for `ACESFilmic` tone mapping at exposure 1.0.
 */

import { PALETTE } from './materials.config'

export const LIGHTING = {
  toneMappingExposure: 0.67,

  ambient: { color: '#FFF1DE', intensity: 0.135 },
  hemisphere: { sky: '#FFF3E2', ground: '#C9BFB2', intensity: 0.17 },

  /** Warm fill riding along the ceiling strips. */
  ledPoints: {
    color: PALETTE.led,
    intensity: 1.25,
    distance: 5.6,
    decay: 2,
    /** Positions are generated from the ceiling strip runs at build time. */
    height: 2.46,
  },

  /** Key light over the styling floor — the only broad shadow caster. */
  keySpot: {
    position: [0, 2.9, -2.2] as [number, number, number],
    target: [0, 0, -2.2] as [number, number, number],
    color: '#FFEFD8',
    intensity: 7.2,
    angle: 0.95,
    penumbra: 0.92,
    distance: 11,
    decay: 2,
  },

  /** Second shadow caster over the reception so the desk grounds properly. */
  receptionSpot: {
    position: [-1.5, 2.86, -5.9] as [number, number, number],
    target: [-1.7, 0.6, -5.6] as [number, number, number],
    color: '#FFEEDA',
    intensity: 2.8,
    angle: 1.0,
    penumbra: 0.9,
    distance: 9,
    decay: 1.7,
  },

  /** Cool daylight through the shopfront glazing. */
  daylight: {
    position: [0.2, 2.0, -8.7] as [number, number, number],
    color: PALETTE.daylight,
    intensity: 2.5,
    distance: 12,
    decay: 1.5,
  },

  /** Bounce light off the marble, faked with a low upward-facing fill. */
  floorBounce: {
    position: [0, 0.45, -2.2] as [number, number, number],
    color: '#FFE8CC',
    intensity: 1.1,
    distance: 7,
    decay: 2,
  },

  /** Warm wash inside the makeup room. */
  makeupRoom: {
    position: [-4.85, 2.5, 2.3] as [number, number, number],
    color: PALETTE.led,
    intensity: 1.75,
    distance: 7,
    decay: 2,
  },

  /**
   * HDR multipliers for emissive geometry.
   *
   * These are the values `materials/emissive.ts` scales each LED colour by.
   * Bloom's threshold is 1.0, so anything here above 1 glows and anything at
   * or below it simply reads as a bright surface. They are kept only slightly
   * over the line: the salon is full of large emitting panels, and pushing
   * them hard floods an already ivory room.
   */
  emissive: {
    strip: 1.04,
    mirrorHalo: 1.03,
    niche: 1.02,
    downlight: 1.04,
  },

  /** Point light standing in for the bounce off a backlit mirror's halo. */
  mirrorHaloLight: 0.55,

  shadows: {
    /** Shadow map resolution per device tier. */
    mapSize: { high: 1024, medium: 512, low: 0 },
    bias: -0.0012,
    normalBias: 0.022,
  },

  /** Environment rig — soft emitters that produce the reflections. */
  environment: {
    resolution: 256,
    /** Overall brightness of the generated environment map. */
    intensity: 0.4,
  },
} as const

/** Post-processing, applied only where the device can afford it. */
export const POST = {
  bloom: {
    /*
     * Threshold sits at 1.0 so ONLY the HDR emissive surfaces defined in
     * `materials/emissive.ts` bloom. Anything lower catches the ivory walls,
     * which tone-map to roughly 0.9, and washes the whole salon out.
     */
    intensity: 0.16,
    luminanceThreshold: 1.0,
    luminanceSmoothing: 0.16,
    mipmapBlur: true,
    radius: 0.62,
  },
  vignette: { offset: 0.3, darkness: 0.58 },
  /** Very slight chromatic offset — enough to feel like a lens, not a filter. */
  chromaticAberration: 0.00042,
} as const
