import { useMemo } from 'react'
import * as THREE from 'three'
import { Environment, Lightformer } from '@react-three/drei'
import { LIGHTING } from '@/config/lighting.config'
import { PALETTE } from '@/config/materials.config'
import { CEILING, ROOM } from '@/config/room.config'
import type { DeviceTier } from '@/utils/perf'

/**
 * A spotlight that actually points somewhere.
 *
 * three.js aims a SpotLight at its `target` object, which must live in the
 * scene graph — so the target is created up front and mounted alongside.
 */
function TargetedSpot({
  position,
  target,
  color,
  intensity,
  angle,
  penumbra,
  distance,
  decay,
  castShadow,
  shadowMapSize,
}: {
  position: [number, number, number]
  target: [number, number, number]
  color: string
  intensity: number
  angle: number
  penumbra: number
  distance: number
  decay: number
  castShadow: boolean
  shadowMapSize: number
}) {
  const targetObject = useMemo(() => {
    const o = new THREE.Object3D()
    o.position.set(...target)
    return o
  }, [target])

  return (
    <>
      <primitive object={targetObject} />
      <spotLight
        position={position}
        target={targetObject}
        color={color}
        intensity={intensity}
        angle={angle}
        penumbra={penumbra}
        distance={distance}
        decay={decay}
        castShadow={castShadow}
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-bias={LIGHTING.shadows.bias}
        shadow-normalBias={LIGHTING.shadows.normalBias}
        shadow-camera-near={0.5}
        shadow-camera-far={distance}
      />
    </>
  )
}

/**
 * Hand-built environment map.
 *
 * Rather than downloading an HDRI, the reflections on the gold columns and the
 * marble floor come from a small rig of soft emitters arranged to match the
 * real room: a bright warm ceiling, two linear runs, cool daylight from the
 * shopfront behind the camera, and a dim warm bounce off the floor.
 *
 * `frames={1}` bakes it once — it never needs to update, since none of these
 * emitters move.
 */
function EnvironmentRig() {
  return (
    <Environment resolution={LIGHTING.environment.resolution} frames={1} background={false}>
      {/*
        A dim warm dome enclosing the whole rig.

        Without this the environment is emitters floating on black, so every
        smooth metal in the scene — the gold columns and, most obviously, the
        mirrors — reflects black wherever it is not pointed straight at a
        lightformer. Real mirrors in a lit ivory room read as soft warm grey,
        and this is what supplies that.
      */}
      <mesh scale={60}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial color={PALETTE.wallShadow} side={THREE.BackSide} />
      </mesh>

      {/* Broad warm ceiling plane — the dominant source in the real salon. */}
      <Lightformer
        form="rect"
        intensity={1.05 * LIGHTING.environment.intensity}
        color={PALETTE.led}
        position={[0, 5, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[12, 12, 1]}
      />
      {/*
        The central bundle of ceiling runs, which is what puts the long
        highlight down every champagne column and along the mirror edges. One
        emitter now rather than two flanking ones, because the real fitting is
        a single tight band down the middle of the hall.
      */}
      <Lightformer
        form="rect"
        intensity={2.1 * LIGHTING.environment.intensity}
        color={PALETTE.ledCool}
        position={[0, 4.2, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={[0.9, 10, 1]}
      />
      {/* Cool daylight from the shopfront. */}
      <Lightformer
        form="rect"
        intensity={1.25 * LIGHTING.environment.intensity}
        color={PALETTE.daylight}
        position={[0, 1.6, -7]}
        rotation={[0, 0, 0]}
        scale={[5, 3, 1]}
      />
      {/* Warm bounce back off the polished marble. */}
      <Lightformer
        form="rect"
        intensity={0.55 * LIGHTING.environment.intensity}
        color="#FFE3BE"
        position={[0, -3, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[10, 10, 1]}
      />
      {/* Warm ivory walls, so metals never reflect pure black. */}
      <Lightformer form="rect" intensity={0.34} color={PALETTE.wall} position={[-6, 1, 0]} rotation={[0, Math.PI / 2, 0]} scale={[9, 4, 1]} />
      <Lightformer form="rect" intensity={0.34} color={PALETTE.wall} position={[6, 1, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[9, 4, 1]} />
    </Environment>
  )
}

/**
 * The complete lighting rig.
 *
 * Real lights are kept deliberately few — the environment does most of the
 * work, and every extra shadow-casting light costs a full depth pass.
 */
export default function LightingSystem({ tier }: { tier: DeviceTier }) {
  const shadowMapSize =
    tier === 'high' ? LIGHTING.shadows.mapSize.high : tier === 'medium' ? LIGHTING.shadows.mapSize.medium : 0
  const castShadow = shadowMapSize > 0

  /**
   * Warm fill riding under each ceiling figure.
   *
   * These stand in for the light the emissive strips would cast if emission
   * lit anything, which it does not. They are placed under the runs rather
   * than scattered, so the pools on the floor line up with the fittings above.
   */
  const stripFills = useMemo(() => {
    const pts: [number, number, number][] = []
    const { hallBand, diamond, receptionFan } = CEILING
    const y = LIGHTING.ledPoints.height

    // Five down the hall's centre band — the room's main source.
    const span = hallBand.maxZ - hallBand.minZ
    for (let i = 0; i < 5; i++) {
      pts.push([0, y, hallBand.minZ + (span * (i + 0.5)) / 5])
    }
    // Reception, under the curved comb.
    pts.push([receptionFan.centerX, y, receptionFan.z + 0.5])
    // Four around the diamond over the back studio.
    const d = diamond.rings[0] * 0.66
    pts.push(
      [diamond.center.x - d, y - 0.12, diamond.center.z],
      [diamond.center.x + d, y - 0.12, diamond.center.z],
      [diamond.center.x, y - 0.12, diamond.center.z - d],
      [diamond.center.x, y - 0.12, diamond.center.z + d],
    )
    return pts
  }, [])

  // Medium and low tiers drop half the point lights — they are the cheapest
  // thing to cut and the environment map already carries the mood.
  const fills = tier === 'high' ? stripFills : stripFills.filter((_, i) => i % 2 === 0)

  return (
    <>
      <EnvironmentRig />

      <ambientLight color={LIGHTING.ambient.color} intensity={LIGHTING.ambient.intensity} />
      <hemisphereLight
        color={LIGHTING.hemisphere.sky}
        groundColor={LIGHTING.hemisphere.ground}
        intensity={LIGHTING.hemisphere.intensity}
      />

      {fills.map((p, i) => (
        <pointLight
          key={`fill-${i}`}
          position={p}
          color={LIGHTING.ledPoints.color}
          intensity={LIGHTING.ledPoints.intensity}
          distance={LIGHTING.ledPoints.distance}
          decay={LIGHTING.ledPoints.decay}
        />
      ))}

      <TargetedSpot
        position={LIGHTING.keySpot.position}
        target={LIGHTING.keySpot.target}
        color={LIGHTING.keySpot.color}
        intensity={LIGHTING.keySpot.intensity}
        angle={LIGHTING.keySpot.angle}
        penumbra={LIGHTING.keySpot.penumbra}
        distance={LIGHTING.keySpot.distance}
        decay={LIGHTING.keySpot.decay}
        castShadow={castShadow}
        shadowMapSize={shadowMapSize || 512}
      />

      <TargetedSpot
        position={LIGHTING.receptionSpot.position}
        target={LIGHTING.receptionSpot.target}
        color={LIGHTING.receptionSpot.color}
        intensity={LIGHTING.receptionSpot.intensity}
        angle={LIGHTING.receptionSpot.angle}
        penumbra={LIGHTING.receptionSpot.penumbra}
        distance={LIGHTING.receptionSpot.distance}
        decay={LIGHTING.receptionSpot.decay}
        castShadow={castShadow && tier === 'high'}
        shadowMapSize={shadowMapSize || 512}
      />

      {/* Cool daylight bleeding in through the shopfront glazing. */}
      <pointLight
        position={LIGHTING.daylight.position}
        color={LIGHTING.daylight.color}
        intensity={LIGHTING.daylight.intensity}
        distance={LIGHTING.daylight.distance}
        decay={LIGHTING.daylight.decay}
      />

      {/* Light bouncing back up off the polished marble. */}
      <pointLight
        position={LIGHTING.floorBounce.position}
        color={LIGHTING.floorBounce.color}
        intensity={LIGHTING.floorBounce.intensity}
        distance={LIGHTING.floorBounce.distance}
        decay={LIGHTING.floorBounce.decay}
      />

      <pointLight
        position={LIGHTING.makeupRoom.position}
        color={LIGHTING.makeupRoom.color}
        intensity={LIGHTING.makeupRoom.intensity}
        distance={LIGHTING.makeupRoom.distance}
        decay={LIGHTING.makeupRoom.decay}
      />

      {/*
        Keeps the far end of the hall from going muddy.

        Pulled well off the end wall and brought right down. At 1.4 m from the
        plaster with intensity 3.6 it was not filling the far end, it was
        printing a blown hotspot on the back wall that dominated the hero
        frame — the single brightest thing in the room was a lamp nobody could
        see, lighting a flat surface.
      */}
      <pointLight
        position={[0, ROOM.height - 0.62, ROOM.hall.maxZ - 3.1]}
        color={PALETTE.led}
        intensity={1.5}
        distance={6.4}
        decay={2}
      />
    </>
  )
}
