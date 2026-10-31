import type { DeviceTier } from '@/utils/perf'

import SalonFloor from './SalonFloor'
import SalonWalls from './SalonWalls'
import SalonCeiling from './SalonCeiling'
import CeilingLights from './CeilingLights'
import SalonStation from './SalonStation'
import SalonVanity from './SalonVanity'
import Reception from './Reception'
import WashStation from './WashStation'
import NailBar from './NailBar'
import Curtains from './Curtains'
import Decorations from './Decorations'
import { ArchMirrorWalls, RectMirror } from './SalonMirror'

/**
 * The procedural salon.
 *
 * A reconstruction of the real Cut N Curl interior, assembled from the modular
 * components in this folder and driven entirely by `room.config.ts`. Every
 * element here is something actually visible in the reference material —
 * nothing is invented to fill space.
 *
 * Two rooms:
 *   • The main hall — reception, then the symmetric styling floor with its
 *     arched mirror niches down both walls, closing on the panelled end wall
 *     and its bench.
 *   • The back studio — the L'Oréal wash wall, the long backlit makeup mirror
 *     over its drawered vanity, the "Nail Art" shelving and the treatment bed,
 *     under the nested-diamond ceiling figure.
 *
 * PHOTOGRAMMETRY SWAP POINT
 * -------------------------
 * When a scanned/Blender `salon.glb` is ready, this whole component is what
 * gets replaced — see `SalonModel.tsx`, which chooses between the two. Keeping
 * the swap at this boundary means the cameras, bounds, lighting and UI all
 * carry over untouched.
 */
export default function SalonRoom({ tier }: { tier: DeviceTier }) {
  const castShadow = tier === 'high'
  const detailed = tier !== 'low'

  return (
    <group name="salon-room">
      <SalonFloor tier={tier} />
      <SalonWalls />
      <SalonCeiling />
      <CeilingLights detailed={detailed} />

      {/* The styling hall: arches down both walls, chairs facing them. */}
      <ArchMirrorWalls tier={tier} />
      <SalonStation castShadow={castShadow} />

      {/* Reception, the end bench and the display shelving. */}
      <Reception />

      {/* Back studio. */}
      <RectMirror tier={tier} />
      <SalonVanity castShadow={castShadow} />
      <Curtains />
      <WashStation castShadow={castShadow} />
      <NailBar castShadow={castShadow} />

      {detailed && <Decorations />}
    </group>
  )
}
