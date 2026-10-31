import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { MeshReflectorMaterial } from '@react-three/drei'
import { MATERIALS, PALETTE } from '@/config/materials.config'
import {
  MAKEUP_ROOM,
  MIRROR_ARCH,
  ROOM,
  STYLING_STATIONS,
  type StationSide,
} from '@/config/room.config'
import { LIGHTING } from '@/config/lighting.config'
import { LED_HALO } from '@/materials/emissive'
import type { DeviceTier } from '@/utils/perf'

/**
 * Points around a capsule outline — semicircular top and bottom, straight
 * sides — traversed counter-clockwise.
 *
 * Built analytically rather than with `Shape.absarc`: arc winding is easy to
 * get subtly wrong, and an inverted arch would punch the wall inside out.
 */
function capsulePoints(width: number, height: number, cx = 0, cy = 0, segments = 22): THREE.Vector2[] {
  const r = width / 2
  const half = Math.max(0, height - width) / 2
  const pts: THREE.Vector2[] = []

  pts.push(new THREE.Vector2(cx + r, cy - half))
  pts.push(new THREE.Vector2(cx + r, cy + half))
  for (let i = 1; i <= segments; i++) {
    const a = (i / segments) * Math.PI
    pts.push(new THREE.Vector2(cx + Math.cos(a) * r, cy + half + Math.sin(a) * r))
  }
  pts.push(new THREE.Vector2(cx - r, cy - half))
  for (let i = 1; i <= segments; i++) {
    const a = Math.PI + (i / segments) * Math.PI
    pts.push(new THREE.Vector2(cx + Math.cos(a) * r, cy - half + Math.sin(a) * r))
  }
  return pts
}

const capsuleShape = (w: number, h: number, cx = 0, cy = 0) =>
  new THREE.Shape(capsulePoints(w, h, cx, cy))

/**
 * The arched mirror wall.
 *
 * This is the salon's signature and the thing the previous model got most
 * wrong: the mirrors are not ovals hung on flat plaster, they are set into
 * ARCHED RECESSES, and the warm light comes from behind the glass and washes
 * the inside of the recess.
 *
 * Built as a real hole rather than a decal. A lining panel the depth of the
 * recess is extruded from a rectangle with capsule-shaped holes punched
 * through it; `ExtrudeGeometry` gives the holes their own side walls, so the
 * reveal around each arch comes out of the geometry rather than being faked
 * with shading. The structural wall behind shows through the opening and
 * becomes the back of the recess.
 *
 * All the capsules on one wall are merged into a single mesh, so the whole
 * bank is one draw call — and, more usefully, one reflection pass.
 */
function ArchWall({ side, tier }: { side: StationSide; tier: DeviceTier }) {
  const stations = useMemo(() => STYLING_STATIONS.filter((s) => s.side === side), [side])
  const wallX = side === 'west' ? ROOM.hall.minX : ROOM.hall.maxX
  /** Local +X runs along the wall; its sign flips between the two sides. */
  const dir = side === 'west' ? -1 : 1
  const rotationY = side === 'west' ? Math.PI / 2 : -Math.PI / 2

  const centerZ = useMemo(
    () => (ROOM.hall.minZ + ROOM.hall.maxZ) / 2,
    [],
  )
  const spanZ = ROOM.hall.maxZ - ROOM.hall.minZ

  const { niche, glass, glassOffset } = MIRROR_ARCH
  const nicheCy = niche.bottom + niche.height / 2
  const glassCy = glass.bottom + glass.height / 2

  /** Where each arch sits in the panel's local X. */
  const offsets = useMemo(() => stations.map((s) => dir * (s.z - centerZ)), [stations, dir, centerZ])

  /** The lining: a wall panel with the arches punched clean through it. */
  const liningGeometry = useMemo(() => {
    const shape = new THREE.Shape([
      new THREE.Vector2(-spanZ / 2, 0),
      new THREE.Vector2(spanZ / 2, 0),
      new THREE.Vector2(spanZ / 2, ROOM.height),
      new THREE.Vector2(-spanZ / 2, ROOM.height),
    ])
    shape.holes = offsets.map(
      (o) => new THREE.Path(capsulePoints(niche.width, niche.height, o, nicheCy).reverse()),
    )
    const geo = new THREE.ExtrudeGeometry(shape, { depth: niche.depth, bevelEnabled: false })
    geo.computeVertexNormals()
    return geo
  }, [offsets, spanZ, niche.width, niche.height, niche.depth, nicheCy])

  /** Warm emitter at the back of each recess, larger than the glass. */
  const haloGeometry = useMemo(
    () =>
      new THREE.ShapeGeometry(
        offsets.map((o) => capsuleShape(niche.width - 0.055, niche.height - 0.055, o, nicheCy)),
      ),
    [offsets, niche.width, niche.height, nicheCy],
  )

  const glassGeometry = useMemo(
    () => new THREE.ShapeGeometry(offsets.map((o) => capsuleShape(glass.width, glass.height, o, glassCy))),
    [offsets, glass.width, glass.height, glassCy],
  )

  useEffect(
    () => () => {
      liningGeometry.dispose()
      haloGeometry.dispose()
      glassGeometry.dispose()
    },
    [liningGeometry, haloGeometry, glassGeometry],
  )

  // The lining is extruded along local +Z, which the rotation maps onto the
  // wall normal — so the panel grows from the wall plane into the room.
  const intoRoom = side === 'west' ? 1 : -1
  const faceX = wallX + intoRoom * niche.depth

  return (
    <group>
      {/* Lining panel, arches punched through. */}
      <mesh
        geometry={liningGeometry}
        position={[wallX, 0, centerZ]}
        rotation={[0, rotationY, 0]}
        receiveShadow
      >
        <meshStandardMaterial {...MATERIALS.wall} />
      </mesh>

      {/* Halo: sits against the back of the recess and rings the glass. */}
      <mesh
        geometry={haloGeometry}
        position={[wallX + intoRoom * 0.006, 0, centerZ]}
        rotation={[0, rotationY, 0]}
      >
        <meshBasicMaterial color={LED_HALO} toneMapped={false} />
      </mesh>

      {/* Glass, standing proud of the halo so the light escapes around it. */}
      <mesh
        geometry={glassGeometry}
        position={[wallX + intoRoom * glassOffset, 0, centerZ]}
        rotation={[0, rotationY, 0]}
      >
        {/*
          A true reflection re-renders the whole room into its own buffer every
          frame; three of them made each phone frame four scene passes, which
          is what saturated a Samsung's GPU during camera flights. Phones get
          the environment-mapped metal — the same rule the marble floor has
          always used — and only the top tier pays for real reflections.
        */}
        {tier !== 'high' ? (
          <meshStandardMaterial color="#DCDDDE" metalness={0.72} roughness={0.16} envMapIntensity={2.4} />
        ) : (
          <MeshReflectorMaterial
            color={MATERIALS.mirror.color}
            metalness={0.96}
            roughness={0.05}
            envMapIntensity={1.1}
            resolution={tier === 'high' ? 512 : 256}
            mirror={0.88}
            blur={[110, 40]}
            mixBlur={0.28}
            mixStrength={1.05}
            depthScale={0.2}
            minDepthThreshold={0.9}
            maxDepthThreshold={1.1}
          />
        )}
      </mesh>

      {/* Halo bounce onto the plaster. Top tier only — each is a real light. */}
      {tier === 'high' &&
        stations.map((s) => (
          <pointLight
            key={s.id}
            position={[faceX + intoRoom * 0.3, nicheCy, s.z]}
            color={PALETTE.led}
            intensity={LIGHTING.emissive.mirrorHalo}
            distance={2.4}
            decay={2}
          />
        ))}
    </group>
  )
}

/** Both walls of arches. */
export function ArchMirrorWalls({ tier }: { tier: DeviceTier }) {
  return (
    <>
      <ArchWall side="west" tier={tier} />
      <ArchWall side="east" tier={tier} />
    </>
  )
}

/**
 * The long backlit mirror over the makeup vanity.
 *
 * Frameless, floating a little off the plaster, with the LED concealed behind
 * every edge — the reference shows an even halo all the way round rather than
 * a lit border on the glass itself.
 */
export function RectMirror({ tier }: { tier: DeviceTier }) {
  const m = MAKEUP_ROOM.mirror
  const reflective = tier === 'high'

  return (
    <group>
      {/* Backlit halo panel. */}
      <mesh position={[m.centerX, m.y, m.z - 0.03]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[m.width + m.glowPadding * 2, m.height + m.glowPadding * 2]} />
        <meshBasicMaterial color={LED_HALO} toneMapped={false} />
      </mesh>

      {/* Glass. */}
      <mesh position={[m.centerX, m.y, m.z - 0.062]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[m.width, m.height]} />
        {reflective ? (
          <MeshReflectorMaterial
            color={MATERIALS.mirror.color}
            metalness={0.97}
            roughness={0.045}
            envMapIntensity={1.1}
            resolution={tier === 'high' ? 512 : 256}
            mirror={0.9}
            blur={[90, 34]}
            mixBlur={0.22}
            mixStrength={1.1}
            depthScale={0.2}
            minDepthThreshold={0.9}
            maxDepthThreshold={1.1}
          />
        ) : (
          <meshStandardMaterial color="#DCDDDE" metalness={0.72} roughness={0.16} envMapIntensity={2.4} />
        )}
      </mesh>

      {tier !== 'low' && (
        <pointLight
          position={[m.centerX, m.y, m.z - 0.75]}
          color={PALETTE.led}
          intensity={3.4}
          distance={3.2}
          decay={2}
        />
      )}
    </group>
  )
}
