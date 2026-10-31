import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { Instance, Instances } from '@react-three/drei'
import { PALETTE } from '@/config/materials.config'
import { BENCH, DISPLAY_SHELF, RECEPTION, ROOM } from '@/config/room.config'
import { box, roundedSlab } from '@/models/geometries'
import { getMarbleColorMap } from '@/materials/salonMaterials'
import { LED_NICHE } from '@/materials/emissive'
import { goldMaterial, lacquerMaterial, velvetMaterial } from '@/materials/sharedMaterials'

/**
 * The reception.
 *
 * A single Calacatta block, not a joinery desk — one solid marble volume with
 * a warm reveal glowing along the base of its front face, which is what makes
 * it appear to float in the reference. Beside it, an arched niche of floating
 * shelves over a two-door cabinet.
 *
 * The curved comb of light overhead belongs to `CeilingLights`.
 */
function ReceptionDesk() {
  const { desk, baseReveal } = RECEPTION
  const marbleMap = useMemo(() => getMarbleColorMap(1.1), [])
  const marble = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: marbleMap,
        color: PALETTE.marble,
        roughness: 0.22,
        metalness: 0,
        envMapIntensity: 0.8,
      }),
    [marbleMap],
  )
  useEffect(
    () => () => {
      marble.dispose()
      marbleMap.dispose()
    },
    [marble, marbleMap],
  )

  const bodyH = desk.height - baseReveal.height

  return (
    <group>
      {/* The block, lifted just clear of the floor. */}
      <mesh
        geometry={box(desk.width, bodyH, desk.depth)}
        material={marble}
        position={[desk.x, baseReveal.height + bodyH / 2, desk.z]}
        castShadow
        receiveShadow
      />
      {/* Recessed plinth, so the block reads as floating. */}
      <mesh
        geometry={box(desk.width - baseReveal.inset * 2, baseReveal.height, desk.depth - baseReveal.inset * 2)}
        material={lacquerMaterial()}
        position={[desk.x, baseReveal.height / 2, desk.z]}
      />
      {/* Warm slot washing the floor under the front face. */}
      <mesh
        position={[desk.x, baseReveal.height / 2, desk.z - desk.depth / 2 + 0.012]}
        rotation={[0, Math.PI, 0]}
      >
        <planeGeometry args={[desk.width - 0.16, baseReveal.height * 0.6]} />
        <meshBasicMaterial color={LED_NICHE} toneMapped={false} />
      </mesh>
      <pointLight
        position={[desk.x, 0.14, desk.z - desk.depth / 2 - 0.2]}
        color={PALETTE.led}
        intensity={1.5}
        distance={1.8}
        decay={2}
      />

      {/* Working shelf on the staff side. */}
      <mesh
        geometry={box(desk.width - 0.12, 0.03, 0.34)}
        material={lacquerMaterial()}
        position={[desk.x, desk.height - 0.3, desk.z + desk.depth / 2 - 0.2]}
      />
    </group>
  )
}

/** Arched niche of floating shelves, with a cabinet below. */
function ProductNiche() {
  const n = RECEPTION.productNiche
  const cab = RECEPTION.cabinet
  const lacquer = lacquerMaterial()
  const gold = goldMaterial()

  const shelfYs = useMemo(
    () => Array.from({ length: n.shelves }, (_, i) => n.bottom + (n.height / (n.shelves + 0.6)) * (i + 0.7)),
    [n],
  )

  const bottles = useMemo(() => {
    const palette = ['#E8853F', '#F2F0EC', '#D94F86', '#2E3A2C', '#E8C23F', '#B8956A']
    return shelfYs.flatMap((y, si) =>
      [-1, 1].map((side, bi) => ({
        position: [n.x - 0.13, y + 0.075, n.z + side * 0.17] as [number, number, number],
        color: palette[(si * 2 + bi) % palette.length],
      })),
    )
  }, [shelfYs, n])

  return (
    <group>
      {/* Recess back, set into the wall. */}
      <mesh geometry={box(0.02, n.height, n.width)} position={[n.x - 0.005, n.bottom + n.height / 2, n.z]}>
        <meshStandardMaterial color={PALETTE.wallShadow} roughness={0.95} metalness={0} />
      </mesh>
      {/* Floating shelves. */}
      {shelfYs.map((y, i) => (
        <mesh
          key={i}
          geometry={box(n.depth, 0.024, n.width - 0.06)}
          material={lacquer}
          position={[n.x - n.depth / 2, y, n.z]}
          castShadow
        />
      ))}
      <Instances frustumCulled={false} limit={bottles.length} range={bottles.length}>
        <cylinderGeometry args={[0.026, 0.028, 0.15, 12]} />
        <meshStandardMaterial roughness={0.32} metalness={0} envMapIntensity={0.7} />
        {bottles.map((b, i) => (
          <Instance key={i} position={b.position} color={b.color} />
        ))}
      </Instances>

      {/* Cabinet below. */}
      <mesh
        geometry={box(cab.depth, cab.height, cab.width)}
        material={lacquer}
        position={[cab.x, cab.height / 2, cab.z]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={box(0.008, cab.height - 0.1, 0.008)}
        material={gold}
        position={[cab.x - cab.depth / 2 - 0.004, cab.height / 2, cab.z]}
      />
    </group>
  )
}

/**
 * The armless upholstered bench against the panelled end wall.
 *
 * Channel-seamed rather than button-tufted — the reference shows straight
 * vertical seams across a plain cushion, and no arms at all.
 */
function EndBench() {
  const b = BENCH
  const velvet = velvetMaterial()
  const gold = goldMaterial()

  const seams = useMemo(
    () =>
      Array.from({ length: b.channels - 1 }, (_, i) => b.x - b.width / 2 + (b.width * (i + 1)) / b.channels),
    [b],
  )

  return (
    <group>
      <mesh
        geometry={roundedSlab(b.width, b.depth, 0.16, 0.045)}
        material={velvet}
        position={[b.x, b.seatHeight, b.z]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      />
      <mesh
        geometry={roundedSlab(b.width, b.backHeight, 0.14, 0.045)}
        material={velvet}
        position={[b.x, b.seatHeight + b.backHeight / 2 + 0.04, b.z + b.depth / 2 - 0.07]}
      />
      {/*
        Channel seams. Kept barely-there: a strongly contrasting seam sitting
        proud of the cushion projects as a hard dark stroke from any camera
        looking down the room, which read as debris on the floor rather than as
        upholstery.
      */}
      {seams.map((x) => (
        <mesh key={x} geometry={box(0.006, 0.005, b.depth - 0.12)} position={[x, b.seatHeight + 0.077, b.z]}>
          <meshStandardMaterial color="#CDBEA8" roughness={0.96} metalness={0} />
        </mesh>
      ))}
      {/* Recessed plinth, so the bench sits solidly rather than on legs. */}
      <mesh
        geometry={box(b.width - 0.24, b.seatHeight - 0.09, b.depth - 0.18)}
        material={lacquerMaterial()}
        position={[b.x, (b.seatHeight - 0.09) / 2, b.z]}
      />
      <mesh
        geometry={box(b.width - 0.3, 0.01, b.depth - 0.24)}
        material={gold}
        position={[b.x, b.seatHeight - 0.1, b.z]}
      />
    </group>
  )
}

/** Tall open cubby shelving on the east wall past the last mirror. */
function DisplayShelf() {
  const d = DISPLAY_SHELF
  const lacquer = lacquerMaterial()

  const shelfYs = Array.from({ length: d.rows + 1 }, (_, i) => (d.height / d.rows) * i)
  const dividerZs = Array.from({ length: d.columns + 1 }, (_, i) => d.z - d.width / 2 + (d.width / d.columns) * i)

  const props = useMemo(() => {
    const palette = ['#E8E4DE', '#D8CFC2', '#B8956A', '#E8853F', '#8A7A66']
    const out: { position: [number, number, number]; color: string }[] = []
    for (let r = 0; r < d.rows; r++) {
      for (let c = 0; c < d.columns; c++) {
        if ((r + c) % 2 === 1) continue
        out.push({
          position: [
            d.x - d.depth / 2,
            (d.height / d.rows) * r + 0.09,
            d.z - d.width / 2 + (d.width / d.columns) * (c + 0.5),
          ],
          color: palette[(r * d.columns + c) % palette.length],
        })
      }
    }
    return out
  }, [d])

  return (
    <group>
      <mesh
        geometry={box(0.03, d.height, d.width)}
        material={lacquer}
        position={[d.x - 0.015, d.height / 2, d.z]}
        receiveShadow
      />
      {shelfYs.map((y, i) => (
        <mesh
          key={`s${i}`}
          geometry={box(d.depth, 0.026, d.width)}
          material={lacquer}
          position={[d.x - d.depth / 2, y, d.z]}
          castShadow
        />
      ))}
      {dividerZs.map((z, i) => (
        <mesh
          key={`d${i}`}
          geometry={box(d.depth, d.height, 0.026)}
          material={lacquer}
          position={[d.x - d.depth / 2, d.height / 2, z]}
        />
      ))}
      <Instances frustumCulled={false} limit={props.length} range={props.length}>
        <cylinderGeometry args={[0.03, 0.032, 0.16, 12]} />
        <meshStandardMaterial roughness={0.34} metalness={0} envMapIntensity={0.65} />
        {props.map((p, i) => (
          <Instance key={i} position={p.position} color={p.color} />
        ))}
      </Instances>
    </group>
  )
}

/** Reception, the end bench and the display shelving. */
export default function Reception() {
  return (
    <group>
      <ReceptionDesk />
      <ProductNiche />
      <EndBench />
      <DisplayShelf />

      {/* Soffit the curved comb springs from, behind the desk. */}
      <mesh position={[0, ROOM.height - 0.16, RECEPTION.backWall.z]}>
        <boxGeometry args={[ROOM.hall.maxX - ROOM.hall.minX, 0.32, 0.1]} />
        <meshStandardMaterial color={PALETTE.ceiling} roughness={0.92} metalness={0} />
      </mesh>
    </group>
  )
}
