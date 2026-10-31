/**
 * MATERIAL CONFIGURATION
 * ---------------------------------------------------------------------------
 * Physically-plausible values sampled against the reference photography.
 * Colours are authored in linear-friendly sRGB hex; three.js converts them.
 *
 * Guiding rules from the reference:
 *   • Nothing in this salon is a mirror-finish plastic. Painted surfaces are
 *     matte-to-satin (roughness 0.55–0.85) and never metallic.
 *   • THE WHITES ARE DELIBERATELY SPREAD APART IN VALUE. Wall, ceiling,
 *     marble, leather and lacquer were all authored between 94% and 98%
 *     white, which left under two stops between the five biggest surfaces in
 *     the room — so under any exposure bright enough to see by, they all
 *     clipped to the same white and the furniture dissolved into the walls.
 *     They now step: lacquer > ceiling > wall > marble > leather. Keep that
 *     order and keep the gaps; it is what makes the room read as objects.
 *   • The gold is polished brass / champagne, not yellow chrome — it keeps a
 *     little roughness so it reads as metal rather than a highlight.
 *   • The marble is polished but not a mirror: a low roughness with a broad
 *     clearcoat-ish sheen, plus a real reflection pass on capable hardware.
 */

export const PALETTE = {
  /** Warm ivory wall paint. */
  wall: '#EFE7DA',
  wallShadow: '#E3D8C7',
  ceiling: '#F1EBE1',
  /** Marble base and vein colours. */
  marble: '#EBE7E0',
  marbleVein: '#A9A49E',
  marbleVeinWarm: '#BCAA90',
  /** Polished brass on chair columns, footrests and inlays. */
  gold: '#C9A96A',
  goldBright: '#E0C591',
  /** White leather upholstery. */
  leather: '#E6DFD2',
  leatherShadow: '#D5CCBB',
  /** Beige velvet on the waiting sofa. */
  velvet: '#D3C4AE',
  /** Floor-length curtain. */
  curtain: '#DCCFBB',
  /** Black gloss band above the wash bay. */
  gloss: '#141210',
  cabinet: '#1A1715',
  /** Warm LED emission — the whole scene keys off this. */
  led: '#FFE6C0',
  ledCool: '#FFF4E4',
  /** Daylight spilling through the shopfront. */
  daylight: '#DCE6F2',
  chrome: '#D8DADC',
  timber: '#8A6A46',
} as const

export const MATERIALS = {
  wall: { color: PALETTE.wall, roughness: 0.88, metalness: 0, envMapIntensity: 0.3 },
  ceiling: { color: PALETTE.ceiling, roughness: 0.93, metalness: 0, envMapIntensity: 0.22 },

  /** Polished marble floor. `reflect` is honoured only on capable hardware. */
  marble: {
    color: PALETTE.marble,
    /*
     * Polished, not mirrored. The reference floor returns a soft, blurred
     * image of the chairs — enough to read as stone under glaze, nowhere near
     * the hard reflection a lower roughness would give.
     */
    roughness: 0.2,
    metalness: 0,
    envMapIntensity: 0.58,
    reflect: { blur: [420, 130] as [number, number], mixBlur: 1.15, mixStrength: 0.2, depthScale: 0.85, minDepthThreshold: 0.8, maxDepthThreshold: 1.2 },
  },

  /** Marble used vertically (reception counter) — same stone, less sheen. */
  marbleCounter: { color: PALETTE.marble, roughness: 0.22, metalness: 0, envMapIntensity: 0.58 },

  /*
   * Champagne gold, not brass. The chair bases in the walkthrough are a pale,
   * warm, softly-polished metal that holds a broad highlight rather than a
   * sharp one — a mirror finish here reads as chrome dipped in yellow.
   */
  gold: { color: PALETTE.gold, roughness: 0.32, metalness: 1, envMapIntensity: 0.92 },
  goldTrim: { color: PALETTE.goldBright, roughness: 0.32, metalness: 1, envMapIntensity: 0.92 },

  leather: { color: PALETTE.leather, roughness: 0.58, metalness: 0, envMapIntensity: 0.38, sheen: 0.28, sheenColor: '#F4EDE1' },
  velvet: { color: PALETTE.velvet, roughness: 0.94, metalness: 0, envMapIntensity: 0.3, sheen: 1, sheenRoughness: 0.6, sheenColor: '#E9DCC8' },
  fabric: { color: PALETTE.curtain, roughness: 0.9, metalness: 0, envMapIntensity: 0.32, sheen: 0.55, sheenColor: '#F0E5D4' },

  lacquer: { color: '#F6F2EA', roughness: 0.36, metalness: 0, envMapIntensity: 0.45 },
  gloss: { color: PALETTE.gloss, roughness: 0.12, metalness: 0, envMapIntensity: 1.1, clearcoat: 0.9, clearcoatRoughness: 0.08 },
  cabinet: { color: PALETTE.cabinet, roughness: 0.42, metalness: 0, envMapIntensity: 0.7 },

  glass: { color: '#FFFFFF', roughness: 0.03, metalness: 0, transmission: 0.94, thickness: 0.02, ior: 1.5, envMapIntensity: 1.2 },
  chrome: { color: PALETTE.chrome, roughness: 0.12, metalness: 1, envMapIntensity: 1.1 },
  porcelain: { color: '#F4F3F1', roughness: 0.11, metalness: 0, envMapIntensity: 0.6, clearcoat: 1, clearcoatRoughness: 0.05 },

  /** Mirror glass. Falls back to an env-only metal when reflections are off. */
  mirror: { color: '#DFE3E6', roughness: 0.05, metalness: 1, envMapIntensity: 0.95 },

  timber: { color: PALETTE.timber, roughness: 0.6, metalness: 0, envMapIntensity: 0.4 },
} as const

/** Procedural marble texture generation — no image files to download. */
export const MARBLE_TEXTURE = {
  /** Canvas size per tile. 1024 is plenty once tiled across the floor. */
  size: 1024,
  /** Number of major veins drawn per tile. */
  veins: 11,
  /** Faint secondary hairline veins. */
  hairlines: 30,
  /**
   * Slab size in metres. The walkthrough shows very large-format Calacatta
   * with long sweeping veins that carry across most of the floor; the earlier
   * 1.2 m tile made the pattern repeat visibly down the hall.
   */
  tileMetres: 2.4,
  /** Grout darkening between slabs. The reference joints are near-invisible. */
  groutStrength: 0.02,
} as const
