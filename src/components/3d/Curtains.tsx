import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { MATERIALS } from '@/config/materials.config'
import { MAKEUP_ROOM } from '@/config/room.config'
import { cylinder } from '@/models/geometries'
import { getFabricRoughnessMap } from '@/materials/salonMaterials'
import { goldMaterial } from '@/materials/sharedMaterials'

/**
 * The floor-length beige curtain on the makeup room's west wall.
 *
 * Built by displacing a subdivided plane along its normal with a sine wave, so
 * the fabric has real folds that catch the LED light — a flat plane with a
 * fabric texture reads as wallpaper, not as a curtain.
 *
 * The folds taper slightly toward the rail, which is how gathered fabric
 * actually hangs.
 */
function foldedCurtainGeometry(length: number, height: number, folds: number, amplitude: number) {
  const segments = folds * 4
  const geo = new THREE.PlaneGeometry(length, height, segments, 12)
  const pos = geo.attributes.position as THREE.BufferAttribute

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    // 0 at the rail, 1 at the hem — folds open up as the fabric falls.
    const drop = 1 - (y + height / 2) / height
    const taper = 0.45 + drop * 0.55
    const wave = Math.sin((x / length) * Math.PI * 2 * folds)
    // A second, slower wave stops the folds looking machine-perfect.
    const drift = Math.sin((x / length) * Math.PI * 2 * (folds / 3) + 1.1) * 0.35
    pos.setZ(i, (wave + drift) * amplitude * taper)
  }

  pos.needsUpdate = true
  geo.computeVertexNormals()
  return geo
}

export default function Curtains() {
  const c = MAKEUP_ROOM.curtain
  const length = c.maxZ - c.minZ
  const gold = goldMaterial()

  const geometry = useMemo(
    () => foldedCurtainGeometry(length, c.height, c.folds, 0.055),
    [length, c.height, c.folds],
  )

  const roughnessMap = useMemo(() => {
    const t = getFabricRoughnessMap()
    t.repeat.set(28, 1)
    return t
  }, [])

  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(MATERIALS.fabric.color),
        roughness: MATERIALS.fabric.roughness,
        metalness: 0,
        envMapIntensity: MATERIALS.fabric.envMapIntensity,
        sheen: MATERIALS.fabric.sheen,
        sheenColor: new THREE.Color(MATERIALS.fabric.sheenColor),
        sheenRoughness: 0.75,
        roughnessMap,
        side: THREE.DoubleSide,
      }),
    [roughnessMap],
  )

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
      roughnessMap.dispose()
    },
    [geometry, material, roughnessMap],
  )

  return (
    <group>
      <mesh
        geometry={geometry}
        material={material}
        position={[c.x, c.height / 2, (c.minZ + c.maxZ) / 2]}
        rotation={[0, Math.PI / 2, 0]}
        castShadow
        receiveShadow
      />
      {/* Curtain rail. */}
      <mesh
        geometry={cylinder(0.016, 0.016, length + 0.16, 10)}
        material={gold}
        position={[c.x - 0.05, c.height + 0.04, (c.minZ + c.maxZ) / 2]}
        rotation={[Math.PI / 2, 0, 0]}
      />
    </group>
  )
}
