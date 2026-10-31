import { useEffect, useMemo } from 'react'
import { Instance, Instances } from '@react-three/drei'
import { BRAND } from '@/config/site.config'
import { WASH_BAY } from '@/config/room.config'
import { box, cylinder, roundedSlab, sphere } from '@/models/geometries'
import { createTextTexture } from '@/materials/salonMaterials'
import {
  cabinetMaterial,
  chromeMaterial,
  glossMaterial,
  leatherMaterial,
  ledMaterial,
  porcelainMaterial,
} from '@/materials/sharedMaterials'

/** Shared so the shelf boards and the bottles standing on them cannot drift. */
const SHELF_THICKNESS = 0.022
const BOTTLE_HEIGHT = 0.2

/** A shampoo basin with its tap and the reclining chair in front of it. */
function BackwashUnit({ position }: { position: [number, number, number] }) {
  const porcelain = porcelainMaterial()
  const chrome = chromeMaterial()
  const leather = leatherMaterial()

  return (
    <group position={position}>
      {/* Basin bowl and rim. */}
      <mesh geometry={cylinder(0.29, 0.17, 0.17, 24)} material={porcelain} position={[0, 0.94, 0]} castShadow />
      <mesh position={[0, 1.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.285, 0.022, 8, 28]} />
        <primitive object={porcelain} attach="material" />
      </mesh>
      {/* Neck rest at the front lip. */}
      <mesh geometry={sphere(0.09, 12)} material={porcelain} position={[0, 1.01, -0.27]} scale={[1.5, 0.4, 0.8]} />
      {/* Pedestal. */}
      <mesh geometry={cylinder(0.13, 0.16, 0.86, 16)} material={porcelain} position={[0, 0.43, 0.02]} />

      {/* Tap and spray hose. */}
      <mesh geometry={cylinder(0.022, 0.022, 0.2, 12)} material={chrome} position={[0, 1.12, 0.2]} />
      <mesh geometry={cylinder(0.016, 0.016, 0.22, 10)} material={chrome} position={[0, 1.21, 0.1]} rotation={[Math.PI / 2.4, 0, 0]} />

      {/* Reclining chair. */}
      <group position={[0, 0, -1.05]}>
        <mesh geometry={roundedSlab(0.6, 0.62, 0.16, 0.06)} material={leather} position={[0, 0.46, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow />
        <mesh geometry={roundedSlab(0.58, 0.72, 0.16, 0.07)} material={leather} position={[0, 0.78, 0.3]} rotation={[0.62, 0, 0]} />
        {[-1, 1].map((s) => (
          <mesh
            key={s}
            geometry={roundedSlab(0.5, 0.11, 0.1, 0.04)}
            material={leather}
            position={[s * 0.32, 0.66, -0.04]}
            rotation={[0, Math.PI / 2, 0]}
          />
        ))}
        <mesh geometry={box(0.42, 0.36, 0.5)} material={leather} position={[0, 0.2, -0.06]} />
      </group>
    </group>
  )
}

/**
 * The wash bay along the hall's back wall: black gloss upper band carrying the
 * professional-brand signage, two backlit product niches, black lower
 * cabinetry, and two basins.
 *
 * The brand shown on the band comes from `BRAND.partner` in site.config, so it
 * can be changed or removed without touching this file.
 */
export default function WashStation({ castShadow }: { castShadow: boolean }) {
  const gloss = glossMaterial()
  const cabinet = cabinetMaterial()
  const led = ledMaterial()

  const bandWidth = WASH_BAY.band.maxX - WASH_BAY.band.minX
  const bandCenter = (WASH_BAY.band.minX + WASH_BAY.band.maxX) / 2

  const signTexture = useMemo(
    () =>
      createTextTexture(BRAND.partner.toUpperCase(), {
        width: 1024,
        height: 190,
        font: '600 74px Manrope, "Helvetica Neue", Arial, sans-serif',
        color: '#F5F3F0',
        letterSpacing: 3,
      }),
    [],
  )
  useEffect(() => () => signTexture.dispose(), [signTexture])

  /**
   * Bottles standing in the lit niches, coloured and sized per instance.
   *
   * Each one is placed by its BASE, not its centre: they vary in height, and
   * pinning the centre to a fixed height left the tall ones sunk into the
   * shelf and the short ones hovering above it.
   */
  const nicheBottles = useMemo(() => {
    const out: { position: [number, number, number]; color: string; scale: number }[] = []
    const palette = ['#1C2431', '#8A7A66', '#E8E4DE', '#2E3A2C', '#B8956A', '#3A3F4A', '#D8CFC2']
    WASH_BAY.niches.forEach((n, ni) => {
      const count = 11
      const shelfTop = n.y - n.height / 2 + SHELF_THICKNESS / 2
      for (let i = 0; i < count; i++) {
        const t = (i + 0.5) / count
        const scale = 0.85 + ((i * 37) % 5) * 0.07
        out.push({
          position: [
            n.minX + (n.maxX - n.minX) * t,
            shelfTop + (BOTTLE_HEIGHT * scale) / 2,
            WASH_BAY.z - 0.12,
          ],
          color: palette[(i + ni * 3) % palette.length],
          scale,
        })
      }
    })
    return out
  }, [])

  return (
    <group>
      {/* Black gloss band. */}
      <mesh
        geometry={box(bandWidth, WASH_BAY.band.height, 0.06)}
        material={gloss}
        position={[bandCenter, WASH_BAY.band.y, WASH_BAY.z - 0.03]}
      />
      {/* Partner signage on the band. */}
      <mesh position={[bandCenter - bandWidth * 0.22, WASH_BAY.band.y + 0.02, WASH_BAY.z - 0.07]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[1.5, 0.28]} />
        <meshStandardMaterial map={signTexture} transparent roughness={0.4} metalness={0} depthWrite={false} />
      </mesh>

      {/* Backlit niches — the glowing white recesses behind the products. */}
      {WASH_BAY.niches.map((n, i) => (
        <group key={i}>
          <mesh position={[(n.minX + n.maxX) / 2, n.y, WASH_BAY.z - 0.05]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[n.maxX - n.minX, n.height]} />
            <primitive object={led} attach="material" />
          </mesh>
          {/* Shelf the products stand on. */}
          <mesh
            geometry={box(n.maxX - n.minX, SHELF_THICKNESS, 0.2)}
            material={glossMaterial()}
            position={[(n.minX + n.maxX) / 2, n.y - n.height / 2, WASH_BAY.z - 0.14]}
          />
        </group>
      ))}

      {/* Products in the niches. */}
      <Instances frustumCulled={false} limit={nicheBottles.length} range={nicheBottles.length}>
        <cylinderGeometry args={[0.026, 0.028, BOTTLE_HEIGHT, 10]} />
        <meshStandardMaterial roughness={0.36} metalness={0} envMapIntensity={0.6} />
        {nicheBottles.map((b, i) => (
          <Instance key={i} position={b.position} color={b.color} scale={[1, b.scale, 1]} />
        ))}
      </Instances>

      {/* Lower cabinetry. */}
      <mesh
        geometry={box(WASH_BAY.cabinet.maxX - WASH_BAY.cabinet.minX, WASH_BAY.cabinet.height, 0.5)}
        material={cabinet}
        position={[
          (WASH_BAY.cabinet.minX + WASH_BAY.cabinet.maxX) / 2,
          WASH_BAY.cabinet.y,
          WASH_BAY.z - 0.25,
        ]}
        castShadow={castShadow}
        receiveShadow
      />
      {/*
        Door shadow gaps, spaced across the run.
        These were hard-coded to the cabinet's old position; once the wash bay
        moved into the back studio they stayed put, leaving five near-black
        bars standing in the middle of the hall floor. Deriving them from the
        cabinet extent means they can never drift again.
      */}
      {Array.from({ length: 5 }, (_, i) => {
        const span = WASH_BAY.cabinet.maxX - WASH_BAY.cabinet.minX
        return WASH_BAY.cabinet.minX + (span * (i + 1)) / 6
      }).map((x) => (
        <mesh
          key={x}
          geometry={box(0.008, WASH_BAY.cabinet.height - 0.06, 0.01)}
          material={gloss}
          position={[x, WASH_BAY.cabinet.y, WASH_BAY.z + 0.5]}
        />
      ))}

      {WASH_BAY.basins.map((b, i) => (
        <BackwashUnit key={i} position={[b.x, 0, b.z]} />
      ))}
    </group>
  )
}
