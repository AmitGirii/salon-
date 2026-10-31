import { useMemo } from 'react'
import { Instance, Instances } from '@react-three/drei'
import { PALETTE } from '@/config/materials.config'
import { CEILING, ROOM } from '@/config/room.config'
import { torusArc } from '@/models/geometries'
import { LED_DOWNLIGHT, LED_STRIP } from '@/materials/emissive'

const H = ROOM.height
const SH = ROOM.studioHeight

/** Ceiling height at a point — the back studio sits under a lower slab. */
const ceilingAt = (x: number, z: number) =>
  x < ROOM.hall.minX && z > ROOM.studio.minZ ? SH : H

type Strip = {
  position: [number, number, number]
  rotationY: number
  length: number
}

/**
 * A recessed LED run: a bright core sunk into a shallow channel, so the strip
 * reads as a slot cut into plasterboard rather than a glowing stick stuck to
 * the surface.
 */
function LedStrip({ position, rotationY, length, width }: Strip & { width: number }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.014, 0]}>
        <boxGeometry args={[length, 0.03, width * 2.1]} />
        <meshStandardMaterial color="#D6CDBF" roughness={0.88} metalness={0} />
      </mesh>
      <mesh>
        <boxGeometry args={[length, 0.006, width]} />
        <meshBasicMaterial color={LED_STRIP} toneMapped={false} />
      </mesh>
    </group>
  )
}

/**
 * Every luminaire in the salon.
 *
 * Three figures, all taken from the walkthrough:
 *
 *   • The hall carries a tight bundle of parallel runs down the centre of its
 *     ceiling, with STEPPED ends — each run starts a little further along than
 *     the last, which is very visible looking up the room and is what stops
 *     the bundle reading as one slab of light.
 *   • Reception carries seven strips that arc off the soffit and bend down the
 *     wall behind the desk. They are modelled as quarter-torus segments, which
 *     is exactly the geometry the fitting describes; a straight strip with a
 *     painted curve would not catch the light the same way.
 *   • The back studio carries the nested-diamond figure.
 *
 * Downlights and speakers are instanced: identical, repeated, and therefore
 * two draw calls between them.
 */
export default function CeilingLights({ detailed = true }: { detailed?: boolean }) {
  const { hallBand, receptionFan, diamond, downlights, speakers } = CEILING

  /** The parallel bundle, each run stepped back from the last. */
  const hallStrips = useMemo<Strip[]>(() => {
    const mid = (hallBand.xs.length - 1) / 2
    return hallBand.xs.map((x, i) => {
      // Step outward from the middle, so the bundle ends in a shallow V.
      const step = Math.abs(i - mid) * hallBand.stagger
      const minZ = hallBand.minZ + step
      const maxZ = hallBand.maxZ - step
      return {
        position: [x, H - 0.006, (minZ + maxZ) / 2] as [number, number, number],
        rotationY: Math.PI / 2,
        length: maxZ - minZ,
      }
    })
  }, [hallBand])

  /** The nested diamonds: each ring is a square rotated 45°. */
  const diamondStrips = useMemo<Strip[]>(() => {
    const out: Strip[] = []
    const rings = detailed ? diamond.rings : diamond.rings.slice(0, 2)
    for (const r of rings) {
      for (let i = 0; i < 4; i++) {
        const a = Math.PI / 4 + (i * Math.PI) / 2
        out.push({
          position: [
            diamond.center.x + (Math.cos(a) * r) / Math.SQRT2,
            SH - 0.006,
            diamond.center.z + (Math.sin(a) * r) / Math.SQRT2,
          ],
          rotationY: -(a + Math.PI / 2),
          length: r * Math.SQRT2,
        })
      }
    }
    return out
  }, [diamond, detailed])

  /**
   * The reception fan.
   *
   * Each strip is a quarter torus standing in a vertical plane: it starts flat
   * against the ceiling and curves through 90° to run down the wall. Spread
   * across the soffit, and given slightly different radii, they read as the
   * swept comb in the reference rather than as a flat rank.
   */
  const fanStrips = useMemo(() => {
    const { count, radius, z, spread, centerX } = receptionFan
    return Array.from({ length: count }, (_, i) => {
      const t = count > 1 ? i / (count - 1) : 0.5
      return {
        x: centerX + (t - 0.5) * spread,
        z: z + (t - 0.5) * 0.2,
        radius: radius * (0.86 + 0.26 * (1 - Math.abs(t - 0.5) * 2)),
      }
    })
  }, [receptionFan])

  return (
    <group>
      {hallStrips.map((s, i) => (
        <LedStrip key={`h-${i}`} {...s} width={hallBand.width} />
      ))}
      {diamondStrips.map((s, i) => (
        <LedStrip key={`d-${i}`} {...s} width={diamond.stripWidth} />
      ))}

      {/* Reception: curved strips arcing off the soffit onto the wall. */}
      {fanStrips.map((f, i) => (
        <mesh
          key={`fan-${i}`}
          geometry={torusArc(f.radius, receptionFan.width, Math.PI / 2, 30, 6)}
          position={[f.x, H - f.radius, f.z + f.radius]}
          rotation={[0, -Math.PI / 2, 0]}
        >
          <meshBasicMaterial color={LED_STRIP} toneMapped={false} />
        </mesh>
      ))}

      {/* Recessed downlight bezels. */}
      <Instances frustumCulled={false} limit={downlights.length} range={downlights.length}>
        <cylinderGeometry args={[0.068, 0.068, 0.026, 16]} />
        <meshStandardMaterial color="#F3EDE3" roughness={0.62} metalness={0} />
        {downlights.map(([x, z], i) => (
          <Instance key={`dl-${i}`} position={[x, ceilingAt(x, z) - 0.11, z]} />
        ))}
      </Instances>

      {/* Downlight lenses. */}
      <Instances frustumCulled={false} limit={downlights.length} range={downlights.length}>
        <cylinderGeometry args={[0.05, 0.05, 0.004, 16]} />
        <meshBasicMaterial color={LED_DOWNLIGHT} toneMapped={false} />
        {downlights.map(([x, z], i) => (
          <Instance key={`dlens-${i}`} position={[x, ceilingAt(x, z) - 0.125, z]} />
        ))}
      </Instances>

      {/* Flush ceiling speakers. */}
      <Instances frustumCulled={false} limit={speakers.length} range={speakers.length}>
        <cylinderGeometry args={[0.078, 0.078, 0.014, 18]} />
        <meshStandardMaterial color="#D6D0C6" roughness={0.8} metalness={0} />
        {speakers.map(([x, z], i) => (
          <Instance key={`sp-${i}`} position={[x, ceilingAt(x, z) - 0.107, z]} />
        ))}
      </Instances>

      {/* Soft pool beneath each downlight, so the light lands on the plaster. */}
      {detailed &&
        downlights.map(([x, z], i) => (
          <mesh key={`glow-${i}`} position={[x, ceilingAt(x, z) - 0.129, z]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.15, 18]} />
            <meshBasicMaterial color={PALETTE.led} transparent opacity={0.2} toneMapped={false} depthWrite={false} />
          </mesh>
        ))}
    </group>
  )
}
