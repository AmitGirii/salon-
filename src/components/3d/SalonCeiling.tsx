import { useMemo } from 'react'
import { MATERIALS } from '@/config/materials.config'
import { CEILING, ROOM } from '@/config/room.config'

const H = ROOM.height
const SH = ROOM.studioHeight

type Slab = { position: [number, number, number]; size: [number, number] }

/**
 * The ceiling.
 *
 * Two recessed trays, matching the walkthrough: a long narrow one down the
 * centre of the hall carrying the parallel LED runs, and a wide one over the
 * back studio carrying the nested-diamond figure. Modelling the step rather
 * than painting a flat plane is what gives the hall its depth when you look up
 * the room.
 */
export default function SalonCeiling() {
  const { hall, studio } = ROOM
  const { hallBand, diamond } = CEILING

  /* ---------------------------------------------------- hall: centre tray */

  const bandMinX = -hallBand.tray.width / 2
  const bandMaxX = hallBand.tray.width / 2
  const bandMinZ = hallBand.minZ - 0.25
  const bandMaxZ = hallBand.maxZ + 0.25
  const soffitY = H - hallBand.tray.drop

  const hallSoffits = useMemo<Slab[]>(() => {
    const south = bandMinZ - hall.minZ
    const north = hall.maxZ - bandMaxZ
    const west = bandMinX - hall.minX
    const east = hall.maxX - bandMaxX
    return [
      { position: [(hall.minX + hall.maxX) / 2, soffitY, hall.minZ + south / 2], size: [hall.maxX - hall.minX, south] },
      { position: [(hall.minX + hall.maxX) / 2, soffitY, bandMaxZ + north / 2], size: [hall.maxX - hall.minX, north] },
      { position: [hall.minX + west / 2, soffitY, (bandMinZ + bandMaxZ) / 2], size: [west, bandMaxZ - bandMinZ] },
      { position: [bandMaxX + east / 2, soffitY, (bandMinZ + bandMaxZ) / 2], size: [east, bandMaxZ - bandMinZ] },
    ]
  }, [hall, soffitY, bandMinX, bandMaxX, bandMinZ, bandMaxZ])

  /* ------------------------------------------------- studio: diamond tray */

  const dMinX = diamond.center.x - diamond.tray.width / 2
  const dMaxX = diamond.center.x + diamond.tray.width / 2
  const dMinZ = diamond.center.z - diamond.tray.depth / 2
  const dMaxZ = diamond.center.z + diamond.tray.depth / 2
  const studioSoffitY = SH - diamond.tray.drop

  const studioSoffits = useMemo<Slab[]>(() => {
    const south = Math.max(0, dMinZ - studio.minZ)
    const north = Math.max(0, studio.maxZ - dMaxZ)
    const west = Math.max(0, dMinX - studio.minX)
    const east = Math.max(0, studio.maxX - dMaxX)
    const out: Slab[] = []
    if (south > 0)
      out.push({ position: [(studio.minX + studio.maxX) / 2, studioSoffitY, studio.minZ + south / 2], size: [studio.maxX - studio.minX, south] })
    if (north > 0)
      out.push({ position: [(studio.minX + studio.maxX) / 2, studioSoffitY, dMaxZ + north / 2], size: [studio.maxX - studio.minX, north] })
    if (west > 0)
      out.push({ position: [studio.minX + west / 2, studioSoffitY, (dMinZ + dMaxZ) / 2], size: [west, dMaxZ - dMinZ] })
    if (east > 0)
      out.push({ position: [dMaxX + east / 2, studioSoffitY, (dMinZ + dMaxZ) / 2], size: [east, dMaxZ - dMinZ] })
    return out
  }, [studio, studioSoffitY, dMinX, dMaxX, dMinZ, dMaxZ])

  const reveal = (
    p: [number, number, number],
    s: [number, number, number],
    key: string,
  ) => (
    <mesh key={key} position={p}>
      <boxGeometry args={s} />
      <meshStandardMaterial {...MATERIALS.ceiling} />
    </mesh>
  )

  return (
    <group>
      {/* Hall soffit and the raised centre tray. */}
      {hallSoffits.map((s, i) => (
        <mesh key={`hs-${i}`} position={s.position} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={s.size} />
          <meshStandardMaterial {...MATERIALS.ceiling} />
        </mesh>
      ))}
      <mesh position={[0, H, (bandMinZ + bandMaxZ) / 2]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[hallBand.tray.width, bandMaxZ - bandMinZ]} />
        <meshStandardMaterial {...MATERIALS.ceiling} />
      </mesh>
      {[
        reveal([0, H - hallBand.tray.drop / 2, bandMinZ], [hallBand.tray.width, hallBand.tray.drop, 0.02], 'hr-s'),
        reveal([0, H - hallBand.tray.drop / 2, bandMaxZ], [hallBand.tray.width, hallBand.tray.drop, 0.02], 'hr-n'),
        reveal([bandMinX, H - hallBand.tray.drop / 2, (bandMinZ + bandMaxZ) / 2], [0.02, hallBand.tray.drop, bandMaxZ - bandMinZ], 'hr-w'),
        reveal([bandMaxX, H - hallBand.tray.drop / 2, (bandMinZ + bandMaxZ) / 2], [0.02, hallBand.tray.drop, bandMaxZ - bandMinZ], 'hr-e'),
      ]}

      {/* Studio soffit and the raised diamond tray. */}
      {studioSoffits.map((s, i) => (
        <mesh key={`ss-${i}`} position={s.position} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={s.size} />
          <meshStandardMaterial {...MATERIALS.ceiling} />
        </mesh>
      ))}
      <mesh position={[diamond.center.x, SH, diamond.center.z]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[diamond.tray.width, diamond.tray.depth]} />
        <meshStandardMaterial {...MATERIALS.ceiling} />
      </mesh>
      {[
        reveal([diamond.center.x, SH - diamond.tray.drop / 2, dMinZ], [diamond.tray.width, diamond.tray.drop, 0.02], 'dr-s'),
        reveal([diamond.center.x, SH - diamond.tray.drop / 2, dMaxZ], [diamond.tray.width, diamond.tray.drop, 0.02], 'dr-n'),
        reveal([dMinX, SH - diamond.tray.drop / 2, diamond.center.z], [0.02, diamond.tray.drop, diamond.tray.depth], 'dr-w'),
        reveal([dMaxX, SH - diamond.tray.drop / 2, diamond.center.z], [0.02, diamond.tray.drop, diamond.tray.depth], 'dr-e'),
      ]}
    </group>
  )
}
