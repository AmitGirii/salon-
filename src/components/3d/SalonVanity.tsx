import { useMemo } from 'react'
import { Instance, Instances } from '@react-three/drei'
import { MAKEUP_ROOM } from '@/config/room.config'
import { box, cylinder, roundedSlab, sphere } from '@/models/geometries'
import { chromeMaterial, goldMaterial, lacquerMaterial } from '@/materials/sharedMaterials'
import SalonChair from './SalonChair'

/**
 * The makeup room's long white vanity: a lacquered console with a band of
 * drawers, waterfall end panels, and four chairs lined up in front of the
 * backlit mirror.
 *
 * Drawer pulls are instanced — six identical knobs is exactly the case
 * instancing exists for.
 */
export default function SalonVanity({ castShadow }: { castShadow: boolean }) {
  const v = MAKEUP_ROOM.vanity
  const lacquer = lacquerMaterial()
  const gold = goldMaterial()
  const chrome = chromeMaterial()

  const drawerWidth = (v.width - 0.08) / v.drawers

  const drawerXs = useMemo(
    () =>
      Array.from({ length: v.drawers }, (_, i) => v.centerX - v.width / 2 + 0.04 + drawerWidth * (i + 0.5)),
    [v.centerX, v.width, v.drawers, drawerWidth],
  )

  return (
    <group>
      {/* Counter top. */}
      <mesh
        geometry={roundedSlab(v.width, v.depth, 0.042, 0.01)}
        material={lacquer}
        position={[v.centerX, v.height, v.z]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow={castShadow}
        receiveShadow
      />

      {/* Drawer band below the top. */}
      <mesh
        geometry={box(v.width - 0.02, 0.17, v.depth - 0.05)}
        material={lacquer}
        position={[v.centerX, v.height - 0.115, v.z]}
      />

      {/* Individual drawer fronts, slightly proud with a shadow gap between. */}
      {drawerXs.map((x, i) => (
        <mesh
          key={i}
          geometry={roundedSlab(drawerWidth - 0.012, 0.14, 0.02, 0.006)}
          material={lacquer}
          position={[x, v.height - 0.115, v.z - v.depth / 2 + 0.026]}
        />
      ))}

      {/* Drawer pulls. */}
      <Instances frustumCulled={false} limit={v.drawers} range={v.drawers}>
        <sphereGeometry args={[0.014, 10, 8]} />
        <meshStandardMaterial color="#D9DBDD" roughness={0.14} metalness={1} envMapIntensity={1.5} />
        {drawerXs.map((x, i) => (
          <Instance key={i} position={[x, v.height - 0.115, v.z - v.depth / 2 + 0.012]} />
        ))}
      </Instances>

      {/* Waterfall end panels running to the floor. */}
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          geometry={box(0.045, v.height, v.depth)}
          material={lacquer}
          position={[v.centerX + side * (v.width / 2 - 0.022), v.height / 2, v.z]}
          castShadow={castShadow}
        />
      ))}

      {/* Slim gold reveal along the counter's front edge. */}
      <mesh
        geometry={box(v.width, 0.01, 0.01)}
        material={gold}
        position={[v.centerX, v.height - 0.024, v.z - v.depth / 2]}
      />

      {/* Brush cup and a couple of bottles, as seen on the real counter. */}
      <group position={[v.centerX + 0.95, v.height + 0.02, v.z - 0.06]}>
        <mesh geometry={cylinder(0.045, 0.04, 0.14, 14)} material={chrome} position={[0, 0.07, 0]} />
        {[0, 1, 2, 3].map((b) => (
          <mesh
            key={b}
            geometry={cylinder(0.006, 0.005, 0.19, 6)}
            material={lacquer}
            position={[(b - 1.5) * 0.015, 0.17, (b % 2) * 0.012]}
            rotation={[0.05 * (b - 1.5), 0, 0.06 * (b - 1.5)]}
          />
        ))}
      </group>
      <mesh
        geometry={cylinder(0.032, 0.032, 0.16, 14)}
        material={lacquer}
        position={[v.centerX - 1.15, v.height + 0.08, v.z - 0.08]}
      />
      <mesh
        geometry={sphere(0.026, 12)}
        material={goldMaterial()}
        position={[v.centerX - 1.15, v.height + 0.175, v.z - 0.08]}
      />

      {/* Four chairs facing the mirror. */}
      {MAKEUP_ROOM.chairs.map((c, i) => (
        <SalonChair key={i} position={[c.x, 0, c.z]} rotationY={c.rotationY} castShadow={castShadow} />
      ))}
    </group>
  )
}
