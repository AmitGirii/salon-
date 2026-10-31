import { Instance, Instances } from '@react-three/drei'
import { STATION_CONSOLE, STYLING_STATIONS } from '@/config/room.config'
import { box, cylinder, roundedSlab } from '@/models/geometries'
import { chromeMaterial, goldMaterial, lacquerMaterial } from '@/materials/sharedMaterials'
import SalonChair from './SalonChair'

/**
 * The styling stations.
 *
 * Each is a slim lacquered console standing against the wall below its arched
 * mirror, with a chair in front of it. Seven in all — four down the west wall,
 * three down the east — facing each other across the walkway.
 *
 * The arches themselves are drawn by `ArchMirrorWalls`, which merges every
 * capsule on a wall into a single mesh; see SalonMirror.tsx for why.
 */
export default function SalonStation({ castShadow }: { castShadow: boolean }) {
  const lacquer = lacquerMaterial()
  const gold = goldMaterial()
  const chrome = chromeMaterial()

  const c = STATION_CONSOLE

  return (
    <group>
      {STYLING_STATIONS.map((s) => {
        const facing = s.side === 'west' ? 1 : -1
        return (
          <group key={s.id}>
            {/* Console carcass and slab top. */}
            <mesh
              geometry={box(c.depth, c.height - c.topThickness, c.width)}
              material={lacquer}
              position={[s.console.x, (c.height - c.topThickness) / 2, s.z]}
              castShadow={castShadow}
              receiveShadow
            />
            <mesh
              geometry={roundedSlab(c.width, c.depth + 0.03, c.topThickness, 0.008)}
              material={lacquer}
              position={[s.console.x + facing * 0.015, c.height, s.z]}
              rotation={[-Math.PI / 2, 0, Math.PI / 2]}
              castShadow={castShadow}
            />
            {/* Drawer front, with a shadow gap above it. */}
            <mesh
              geometry={box(0.02, 0.16, c.width - 0.05)}
              material={lacquer}
              position={[s.console.x + (facing * c.depth) / 2, c.height - 0.17, s.z]}
            />
            {/* Champagne pull. */}
            <mesh
              geometry={cylinder(0.008, 0.008, 0.14, 8)}
              material={gold}
              position={[s.console.x + facing * (c.depth / 2 + 0.02), c.height - 0.17, s.z]}
              rotation={[Math.PI / 2, 0, 0]}
            />
          </group>
        )
      })}

      {/* Chairs. */}
      {STYLING_STATIONS.map((s) => (
        <SalonChair
          key={`chair-${s.id}`}
          position={[s.chair.x, 0, s.chair.z]}
          rotationY={s.chair.rotationY}
          castShadow={castShadow}
        />
      ))}

      {/* Socket plates between the arches, as in the reference. */}
      <Instances frustumCulled={false} limit={8} range={6}>
        <boxGeometry args={[0.016, 0.085, 0.13]} />
        <meshStandardMaterial color="#F5F1EA" roughness={0.55} metalness={0} />
        {STYLING_STATIONS.slice(0, 6).map((s, i) => (
          <Instance
            key={i}
            position={[
              s.wallX + (s.side === 'west' ? 1 : -1) * 0.108,
              1.03,
              s.z + (s.side === 'west' ? 0.52 : -0.52),
            ]}
          />
        ))}
      </Instances>

      {/* A brush cup on a couple of consoles, so they are not bare. */}
      {STYLING_STATIONS.filter((_, i) => i % 3 === 0).map((s) => {
        const facing = s.side === 'west' ? 1 : -1
        return (
          <group key={`tools-${s.id}`} position={[s.console.x + facing * 0.04, c.height + 0.02, s.z + 0.16]}>
            <mesh geometry={cylinder(0.038, 0.034, 0.115, 14)} material={chrome} position={[0, 0.058, 0]} />
            {[0, 1, 2].map((b) => (
              <mesh
                key={b}
                geometry={cylinder(0.006, 0.005, 0.15, 6)}
                material={lacquer}
                position={[(b - 1) * 0.014, 0.14, 0.004 * b]}
                rotation={[0.05 * (b - 1), 0, 0.05 * (b - 1)]}
              />
            ))}
          </group>
        )
      })}
    </group>
  )
}
