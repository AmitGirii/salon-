import { useEffect, useMemo } from 'react'
import { MATERIALS, PALETTE } from '@/config/materials.config'
import { ROOM, WALL_PANELS } from '@/config/room.config'
import { getWallRoughnessMap } from '@/materials/salonMaterials'

type BoxProps = {
  position: [number, number, number]
  size: [number, number, number]
}

const T = ROOM.wallThickness
const H = ROOM.height
const SH = ROOM.studioHeight

/**
 * Recessed panel moulding.
 *
 * The walls in the walkthrough carry plain rectangular reveals cut into the
 * plaster — no gold, no applied frame, just a shadow line.
 *
 * Drawn as flat planes barely off the wall rather than as boxes standing proud
 * of it. Solid bars protruded 12 mm and caught the light on their edges, so
 * from down the room they read as dark sticks planted on the floor rather than
 * as lines scored into a wall. The tone sits only a little under the plaster,
 * which is all a real 6 mm reveal does.
 */
function PanelReveal({
  position,
  rotationY,
  width,
  height,
  nested = false,
}: {
  position: [number, number, number]
  rotationY: number
  width: number
  height: number
  nested?: boolean
}) {
  const groove = 0.011

  const rect = (w: number, h: number, key: string) => (
    <group key={key}>
      {[
        { p: [0, h / 2, 0], s: [w, groove] },
        { p: [0, -h / 2, 0], s: [w, groove] },
        { p: [-w / 2, 0, 0], s: [groove, h] },
        { p: [w / 2, 0, 0], s: [groove, h] },
      ].map((b, i) => (
        <mesh key={i} position={b.p as [number, number, number]}>
          <planeGeometry args={b.s as [number, number]} />
          <meshStandardMaterial color="#E4DACB" roughness={0.96} metalness={0} />
        </mesh>
      ))}
    </group>
  )

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {rect(width, height, 'outer')}
      {nested && rect(width - 0.32, height - 0.32, 'inner')}
    </group>
  )
}

/**
 * Every wall in the salon, built as solid segments so that openings are real
 * holes rather than transparent patches.
 *
 * The styling hall's side walls are deliberately left plain here: the arched
 * niches are cut into a lining panel that `SalonMirror` lays over them, and
 * these walls form the back of each recess.
 */
export default function SalonWalls() {
  const roughnessMap = useMemo(() => getWallRoughnessMap(6), [])
  useEffect(() => () => roughnessMap.dispose(), [roughnessMap])

  const { hall, studio, doorway, entrance } = ROOM

  const walls = useMemo<BoxProps[]>(() => {
    const w: BoxProps[] = []
    const hallW = hall.maxX - hall.minX
    const hallD = hall.maxZ - hall.minZ

    /* ---- Hall: south wall with the shopfront opening ---- */
    const leftW = entrance.minX - hall.minX
    w.push({ position: [hall.minX + leftW / 2, H / 2, hall.minZ - T / 2], size: [leftW, H, T] })
    const rightW = hall.maxX - entrance.maxX
    w.push({ position: [entrance.maxX + rightW / 2, H / 2, hall.minZ - T / 2], size: [rightW, H, T] })
    w.push({
      position: [
        (entrance.minX + entrance.maxX) / 2,
        entrance.height + (H - entrance.height) / 2,
        hall.minZ - T / 2,
      ],
      size: [entrance.maxX - entrance.minX, H - entrance.height, T],
    })

    /* ---- Hall: north end wall, behind the bench ---- */
    w.push({ position: [(hall.minX + hall.maxX) / 2, H / 2, hall.maxZ + T / 2], size: [hallW, H, T] })

    /* ---- Hall: east wall (solid) ---- */
    w.push({ position: [hall.maxX + T / 2, H / 2, (hall.minZ + hall.maxZ) / 2], size: [T, H, hallD] })

    /* ---- Hall: west wall, split around the studio doorway ---- */
    const southRun = doorway.minZ - hall.minZ
    w.push({ position: [hall.minX - T / 2, H / 2, hall.minZ + southRun / 2], size: [T, H, southRun] })
    const northRun = hall.maxZ - doorway.maxZ
    w.push({ position: [hall.minX - T / 2, H / 2, doorway.maxZ + northRun / 2], size: [T, H, northRun] })
    w.push({
      position: [hall.minX - T / 2, doorway.height + (H - doorway.height) / 2, (doorway.minZ + doorway.maxZ) / 2],
      size: [T, H - doorway.height, doorway.maxZ - doorway.minZ],
    })

    /* ---- Studio: west, north and south walls ---- */
    const stD = studio.maxZ - studio.minZ
    const stW = studio.maxX - studio.minX
    w.push({ position: [studio.minX - T / 2, SH / 2, (studio.minZ + studio.maxZ) / 2], size: [T, SH, stD] })
    w.push({ position: [(studio.minX + studio.maxX) / 2, SH / 2, studio.maxZ + T / 2], size: [stW, SH, T] })
    w.push({ position: [(studio.minX + studio.maxX) / 2, SH / 2, studio.minZ - T / 2], size: [stW, SH, T] })

    return w
  }, [hall, studio, doorway, entrance])

  return (
    <group>
      {walls.map((b, i) => (
        <mesh key={i} position={b.position} receiveShadow>
          <boxGeometry args={b.size} />
          <meshStandardMaterial
            color={MATERIALS.wall.color}
            roughness={MATERIALS.wall.roughness}
            metalness={0}
            envMapIntensity={MATERIALS.wall.envMapIntensity}
            roughnessMap={roughnessMap}
          />
        </mesh>
      ))}

      {/*
        Shopfront glazing. A bright, slightly translucent panel rather than
        refractive glass: from inside a warmly lit salon the street outside
        blows out to near-white, and transmission would cost a render pass for
        an effect nobody can see.

        Emission kept below clipping. Driven harder it stopped reading as a
        window and became a flat white hole punched in the wall behind the
        reception — the single largest blown region in that view.
      */}
      <mesh position={[(entrance.minX + entrance.maxX) / 2, entrance.height / 2, hall.minZ - 0.01]}>
        <planeGeometry args={[entrance.maxX - entrance.minX, entrance.height]} />
        <meshStandardMaterial
          color={PALETTE.daylight}
          emissive={PALETTE.daylight}
          emissiveIntensity={0.4}
          roughness={0.1}
          metalness={0}
          transparent
          opacity={0.92}
        />
      </mesh>
      {[-0.5, 0.5].map((f) => (
        <mesh
          key={f}
          position={[
            (entrance.minX + entrance.maxX) / 2 + f * (entrance.maxX - entrance.minX) * 0.34,
            entrance.height / 2,
            hall.minZ + 0.02,
          ]}
        >
          <boxGeometry args={[0.045, entrance.height, 0.055]} />
          <meshStandardMaterial {...MATERIALS.gold} />
        </mesh>
      ))}

      {/* Recessed panel moulding. */}
      {WALL_PANELS.map((p, i) => {
        if (p.wall === 'north') {
          return (
            <PanelReveal
              key={i}
              position={[p.along, p.y, hall.maxZ - 0.004]}
              rotationY={Math.PI}
              width={p.width}
              height={p.height}
              nested={p.nested}
            />
          )
        }
        const onWest = p.wall === 'west'
        return (
          <PanelReveal
            key={i}
            position={[onWest ? hall.minX + 0.104 : hall.maxX - 0.104, p.y, p.along]}
            rotationY={onWest ? Math.PI / 2 : -Math.PI / 2}
            width={p.width}
            height={p.height}
            nested={p.nested}
          />
        )
      })}

      {/* Doorway reveal into the studio. */}
      {[doorway.minZ, doorway.maxZ].map((z) => (
        <mesh key={z} position={[doorway.x - T / 2, doorway.height / 2, z]}>
          <boxGeometry args={[T + 0.02, doorway.height, 0.02]} />
          <meshStandardMaterial color={PALETTE.wall} roughness={0.86} metalness={0} />
        </mesh>
      ))}
      <mesh
        position={[doorway.x - T / 2, doorway.height, (doorway.minZ + doorway.maxZ) / 2]}
      >
        <boxGeometry args={[T + 0.02, 0.02, doorway.maxZ - doorway.minZ]} />
        <meshStandardMaterial color={PALETTE.wall} roughness={0.86} metalness={0} />
      </mesh>
    </group>
  )
}
