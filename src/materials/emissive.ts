import * as THREE from 'three'
import { LIGHTING } from '@/config/lighting.config'
import { PALETTE } from '@/config/materials.config'

/**
 * HDR colours for the light-emitting surfaces.
 *
 * Why these exist: bloom has to separate real light sources from an interior
 * that is almost entirely ivory. Tone-mapped plaster lands around 0.9
 * luminance, and a warm LED at #FFE9C9 with `toneMapped={false}` lands at
 * about 0.95 — too close to threshold apart. Setting the bloom threshold low
 * enough to catch the LEDs then blooms every wall in the salon, which is
 * exactly what it looked like before this.
 *
 * The fix is to push the emissive surfaces genuinely above 1.0 — three.js
 * Colors are not clamped — and set the bloom threshold at 1.0. Now only things
 * that are actually glowing glow, and the walls stay walls.
 *
 * Multipliers come from `LIGHTING.emissive`, so relative glow strengths are
 * still tuned from the lighting config.
 */

const hdr = (hex: string, intensity: number) => new THREE.Color(hex).multiplyScalar(intensity)

/**
 * Recessed ceiling strips — the brightest thing in the room.
 *
 * Warm white (`led`), not the cool white they used to be. These are 3000K
 * architectural LEDs in the reference; driving them from `ledCool` tone-mapped
 * to something indistinguishable from paper and they read as white bars
 * painted on the ceiling rather than as warm light sources.
 */
export const LED_STRIP = hdr(PALETTE.led, LIGHTING.emissive.strip)

/** Halo behind the mirrors. */
export const LED_HALO = hdr(PALETTE.led, LIGHTING.emissive.mirrorHalo)

/** Backlit product niches and the display recess. */
export const LED_NICHE = hdr(PALETTE.led, LIGHTING.emissive.niche)

/** Downlight lenses. */
export const LED_DOWNLIGHT = hdr(PALETTE.led, LIGHTING.emissive.downlight)

/** Soft spill painted onto plaster — deliberately below the bloom threshold. */
export const LED_SPILL = new THREE.Color(PALETTE.led)
