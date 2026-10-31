import { useEffect } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { MODEL } from '@/config/room.config'
import type { DeviceTier } from '@/utils/perf'

/**
 * Loads the production salon export.
 *
 * This component is only ever mounted once `SalonModel` has confirmed that the
 * file actually exists at `MODEL.url`, so it never suspends forever on a
 * missing asset. Draco and Meshopt are both enabled — the loader ignores them
 * for an uncompressed file, so a plain export works too.
 *
 * See README → "Swapping in the real GLB" for the export settings this expects.
 */
export default function GltfSalon({ tier }: { tier: DeviceTier }) {
  const { scene } = useGLTF(MODEL.url, MODEL.dracoPath, true)

  useEffect(() => {
    const castShadow = tier === 'high'
    scene.traverse((child) => {
      if (!(child as THREE.Mesh).isMesh) return
      const mesh = child as THREE.Mesh
      mesh.castShadow = castShadow
      mesh.receiveShadow = true
      // Baked exports commonly ship with frustum culling disabled; re-enable it.
      mesh.frustumCulled = true
    })
  }, [scene, tier])

  return (
    <primitive
      object={scene}
      position={MODEL.position}
      rotation={[0, MODEL.rotationY, 0]}
      scale={MODEL.scale}
    />
  )
}

useGLTF.preload(MODEL.url, MODEL.dracoPath, true)
