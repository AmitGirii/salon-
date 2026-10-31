import { useEffect, useMemo } from 'react'
import { BRAND } from '@/config/site.config'
import { ROOM, WASH_BAY } from '@/config/room.config'
import { box, cylinder, plane } from '@/models/geometries'
import { createTextTexture } from '@/materials/salonMaterials'
import { goldMaterial, lacquerMaterial } from '@/materials/sharedMaterials'

/**
 * Loose objects.
 *
 * Deliberately short. The 1080p walkthrough shows a restrained room — plaster,
 * marble, mirrors and chairs — so the earlier planter, framed print and
 * peacock feather have gone: they came from a single older clip, and half of
 * them ended up buried in a wall once the plan was corrected. What is left is
 * what the current footage actually shows.
 */
export default function Decorations() {
  const gold = goldMaterial()
  const lacquer = lacquerMaterial()

  const signTexture = useMemo(
    () =>
      createTextTexture(BRAND.name, {
        width: 1024,
        height: 260,
        font: '300 116px "Cormorant Garamond", Georgia, serif',
        color: '#C8A263',
        letterSpacing: 6,
      }),
    [],
  )

  const descriptorTexture = useMemo(
    () =>
      createTextTexture(BRAND.descriptor.toUpperCase(), {
        width: 1024,
        height: 150,
        font: '500 52px Manrope, "Helvetica Neue", Arial, sans-serif',
        color: '#9A9EA6',
        letterSpacing: 10,
      }),
    [],
  )

  useEffect(
    () => () => {
      signTexture.dispose()
      descriptorTexture.dispose()
    },
    [signTexture, descriptorTexture],
  )

  return (
    <group>
      {/*
        Gold wordmark above the entrance, matching the in-salon signage.
        Emissive-free: it is lit by the ceiling wash, like the real thing.
      */}
      <group position={[0, 2.62, ROOM.hall.minZ + 0.06]}>
        <mesh geometry={plane(1.7, 0.4)}>
          <meshStandardMaterial
            map={signTexture}
            transparent
            metalness={0.9}
            roughness={0.28}
            envMapIntensity={1.4}
            depthWrite={false}
          />
        </mesh>
        <mesh geometry={plane(1.45, 0.18)} position={[0, -0.22, 0]}>
          <meshStandardMaterial map={descriptorTexture} transparent metalness={0.4} roughness={0.5} depthWrite={false} />
        </mesh>
        {[0.26, -0.33].map((y) => (
          <mesh key={y} geometry={box(1.6, 0.005, 0.005)} material={gold} position={[0, y, 0.01]} />
        ))}
      </group>

      {/* Rolled towels stacked on the wash-bay counter. */}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh
          key={i}
          geometry={cylinder(0.05, 0.05, 0.24, 12)}
          material={lacquer}
          position={[
            WASH_BAY.cabinet.minX + 0.55 + (i % 3) * 0.12,
            WASH_BAY.cabinet.y + WASH_BAY.cabinet.height / 2 + 0.06 + Math.floor(i / 3) * 0.11,
            WASH_BAY.z + 0.34,
          ]}
          rotation={[0, 0, Math.PI / 2]}
        />
      ))}
    </group>
  )
}
