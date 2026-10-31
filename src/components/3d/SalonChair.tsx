import { Detailed } from '@react-three/drei'
import { CHAIR, chairGeometries } from '@/models/geometries'
import { goldMaterial, leatherMaterial, leatherShellMaterial } from '@/materials/sharedMaterials'

/**
 * A styling chair.
 *
 * Rebuilt from the walkthrough. The real chair is a shield-backed tub: a
 * gently curved upholstered panel standing behind a visible seat cushion,
 * capped with a thin champagne band along its top edge, on a champagne column
 * and a heavy round disc, with a bracket footrest reaching forward. The first
 * model was a squared box with slab armrests bolted either side, which read as
 * generic salon furniture rather than as these.
 *
 * The back is a section of a LARGE cylinder — radius 0.42 with a 1.5 rad
 * sweep — which gives a shield about 0.57 m across. A small radius wrapped
 * right around the seat and read as a drum.
 *
 * Rotation note: `CylinderGeometry` starts its sweep at +Z, so centring the
 * arc on PI puts the panel behind the seat with no extra rotation. The rim
 * torus is built in the XY plane, so it is laid flat with a -90° X rotation
 * and then yawed by its own half-arc to line the two up — done with a nested
 * group, because composing both angles in one Euler is easy to get wrong.
 */

const SEAT_TOP = CHAIR.seatY + CHAIR.seatThickness / 2
const BACK_Y = SEAT_TOP + CHAIR.backHeight / 2 - 0.04
const RIM_YAW = Math.PI / 2 - CHAIR.backArc / 2

function Back({ castShadow }: { castShadow: boolean }) {
  return (
    <>
      <mesh
        geometry={chairGeometries.back()}
        material={leatherShellMaterial()}
        position={[0, BACK_Y, CHAIR.backAxisZ]}
        castShadow={castShadow}
      />
      <group position={[0, BACK_Y + CHAIR.backHeight / 2, CHAIR.backAxisZ]} rotation={[0, RIM_YAW, 0]}>
        <mesh geometry={chairGeometries.rim()} material={goldMaterial()} rotation={[-Math.PI / 2, 0, 0]} />
      </group>
    </>
  )
}

function ChairFull({ castShadow }: { castShadow: boolean }) {
  const leather = leatherMaterial()
  const gold = goldMaterial()

  return (
    <group>
      {/* Champagne floor disc, column and hydraulic collar. */}
      <mesh
        geometry={chairGeometries.base()}
        material={gold}
        position={[0, CHAIR.baseHeight / 2, 0]}
        castShadow={castShadow}
        receiveShadow
      />
      <mesh
        geometry={chairGeometries.column()}
        material={gold}
        position={[0, CHAIR.baseHeight + CHAIR.columnHeight / 2, 0]}
        castShadow={castShadow}
      />
      <mesh
        geometry={chairGeometries.hydraulic()}
        material={gold}
        position={[0, CHAIR.baseHeight + CHAIR.columnHeight + CHAIR.hydraulicHeight / 2 - 0.03, 0]}
      />

      {/* Seat cushion. */}
      <mesh
        geometry={chairGeometries.seat()}
        material={leather}
        position={[0, CHAIR.seatY, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow={castShadow}
        receiveShadow
      />

      <Back castShadow={castShadow} />

      {/* Low arms, running forward from the shield. */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          geometry={chairGeometries.arm()}
          material={leather}
          position={[side * (CHAIR.seatWidth / 2 - 0.015), CHAIR.armY, -0.02]}
          rotation={[0, Math.PI / 2, 0]}
          castShadow={castShadow}
        />
      ))}

      {/* Footrest: a bracket reaching forward from the column to a flat pad. */}
      <mesh
        geometry={chairGeometries.footrestArm()}
        material={gold}
        position={[0, CHAIR.footrestY + 0.05, CHAIR.footrestReach / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      />
      <mesh
        geometry={chairGeometries.footrestPad()}
        material={gold}
        position={[0, CHAIR.footrestY, CHAIR.footrestReach]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </group>
  )
}

/** Mid-distance: the silhouette, without arms or footrest. */
function ChairMedium() {
  const leather = leatherMaterial()
  const gold = goldMaterial()
  return (
    <group>
      <mesh geometry={chairGeometries.base()} material={gold} position={[0, CHAIR.baseHeight / 2, 0]} />
      <mesh
        geometry={chairGeometries.column()}
        material={gold}
        position={[0, CHAIR.baseHeight + CHAIR.columnHeight / 2, 0]}
      />
      <mesh
        geometry={chairGeometries.seat()}
        material={leather}
        position={[0, CHAIR.seatY, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
      <Back castShadow={false} />
    </group>
  )
}

/** Far: four primitives, enough to hold the silhouette. */
function ChairLow() {
  const leather = leatherMaterial()
  const gold = goldMaterial()
  return (
    <group>
      <mesh geometry={chairGeometries.base()} material={gold} position={[0, CHAIR.baseHeight / 2, 0]} />
      <mesh
        geometry={chairGeometries.column()}
        material={gold}
        position={[0, CHAIR.baseHeight + CHAIR.columnHeight / 2, 0]}
      />
      <mesh geometry={chairGeometries.lodSeat()} material={leather} position={[0, CHAIR.seatY, 0]} />
      <mesh geometry={chairGeometries.lodBack()} material={leather} position={[0, BACK_Y, -0.24]} />
    </group>
  )
}

export type SalonChairProps = {
  position: [number, number, number]
  rotationY?: number
  castShadow?: boolean
  /** Disable LOD when a chair is the subject of a close cinematic pose. */
  lod?: boolean
}

export default function SalonChair({
  position,
  rotationY = 0,
  castShadow = false,
  lod = true,
}: SalonChairProps) {
  if (!lod) {
    return (
      <group position={position} rotation={[0, rotationY, 0]}>
        <ChairFull castShadow={castShadow} />
      </group>
    )
  }

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Detailed distances={[0, 7, 14]}>
        <ChairFull castShadow={castShadow} />
        <ChairMedium />
        <ChairLow />
      </Detailed>
    </group>
  )
}
