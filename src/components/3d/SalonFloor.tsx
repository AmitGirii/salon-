import { useEffect, useMemo } from 'react'
import { MeshReflectorMaterial } from '@react-three/drei'
import { MARBLE_TEXTURE, MATERIALS, PALETTE } from '@/config/materials.config'
import { ROOM } from '@/config/room.config'
import { getMarbleColorMap, getMarbleRoughnessMap } from '@/materials/salonMaterials'
import type { DeviceTier } from '@/utils/perf'

/**
 * The polished marble floor.
 *
 * One plane spans both rooms, so the expensive real-reflection pass runs once
 * rather than per-room. The overhang outside the building envelope is never
 * visible because the walls enclose every camera position.
 *
 * On `high` the floor gets a true reflection pass — the single biggest reason
 * the room reads as polished stone rather than a grey plane. Lower tiers fall
 * back to the environment map alone, which still catches the ceiling strips.
 */
export default function SalonFloor({ tier }: { tier: DeviceTier }) {
  const width = ROOM.hall.maxX - ROOM.studio.minX
  const depth = ROOM.hall.maxZ - ROOM.hall.minZ
  const centerX = (ROOM.studio.minX + ROOM.hall.maxX) / 2
  const centerZ = (ROOM.hall.minZ + ROOM.hall.maxZ) / 2

  const repeat = Math.round(Math.max(width, depth) / MARBLE_TEXTURE.tileMetres)

  const colorMap = useMemo(() => getMarbleColorMap(repeat), [repeat])
  const roughnessMap = useMemo(() => getMarbleRoughnessMap(repeat), [repeat])

  useEffect(
    () => () => {
      colorMap.dispose()
      roughnessMap.dispose()
    },
    [colorMap, roughnessMap],
  )

  const reflective = tier === 'high'

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, 0, centerZ]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      {reflective ? (
        <MeshReflectorMaterial
          map={colorMap}
          roughnessMap={roughnessMap}
          color={PALETTE.marble}
          metalness={0}
          roughness={MATERIALS.marble.roughness}
          envMapIntensity={MATERIALS.marble.envMapIntensity}
          resolution={1024}
          mirror={0.42}
          blur={MATERIALS.marble.reflect.blur}
          mixBlur={MATERIALS.marble.reflect.mixBlur}
          mixStrength={MATERIALS.marble.reflect.mixStrength}
          depthScale={MATERIALS.marble.reflect.depthScale}
          minDepthThreshold={MATERIALS.marble.reflect.minDepthThreshold}
          maxDepthThreshold={MATERIALS.marble.reflect.maxDepthThreshold}
          depthToBlurRatioBias={0.25}
        />
      ) : (
        <meshStandardMaterial
          map={colorMap}
          roughnessMap={roughnessMap}
          color={PALETTE.marble}
          metalness={0}
          roughness={MATERIALS.marble.roughness + 0.05}
          envMapIntensity={MATERIALS.marble.envMapIntensity}
        />
      )}
    </mesh>
  )
}
