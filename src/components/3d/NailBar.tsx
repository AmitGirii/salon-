import { useCallback, useEffect, useMemo } from 'react'
import { Instance, Instances } from '@react-three/drei'
import { NAIL_BAR } from '@/config/room.config'
import { box, cylinder, cylinderArc, roundedSlab } from '@/models/geometries'
import { createTextTexture } from '@/materials/salonMaterials'
import { goldMaterial, lacquerMaterial, leatherMaterial, timberMaterial } from '@/materials/sharedMaterials'

/**
 * Gel-polish colours sampled from the salon's display wall — the full spectrum
 * of nudes, corals, reds and pastels, which is the only real colour anywhere
 * in this otherwise ivory-and-gold room.
 */
const POLISH_COLOURS = [
  '#F2E4DA', '#E8C9B8', '#D98C7A', '#C2564E', '#A3313A', '#8E2F4A',
  '#D96A93', '#E9A2BE', '#F0C9D6', '#B9A9CE', '#8E7BB0', '#5C6B9E',
  '#5E8FA8', '#78B3A6', '#96C4A0', '#C9D48A', '#E8D06A', '#E0A45C',
]

/**
 * The "Nail Art" wall: an arched white shelving unit stacked with gel polish,
 * plus the retail product shelf and the sheet-covered treatment bed further
 * along the same wall.
 *
 * Thirty-six polish bottles is exactly the case for instancing — they render
 * as two draw calls (glass body + cap) with per-instance colour.
 */
export default function NailBar({ castShadow }: { castShadow: boolean }) {
  const lacquer = lacquerMaterial()
  const gold = goldMaterial()
  const timber = timberMaterial()
  const leather = leatherMaterial()

  const signTexture = useMemo(
    () =>
      createTextTexture('Nail Art', {
        width: 512,
        height: 180,
        font: 'italic 300 96px "Cormorant Garamond", Georgia, serif',
        color: '#C9C6C1',
      }),
    [],
  )
  useEffect(() => () => signTexture.dispose(), [signTexture])

  const { rows, bottlesPerRow, width, height, y, z, x } = NAIL_BAR

  /*
   * Bottle and shelf heights are derived from ONE formula.
   *
   * They used to be written out separately, with the bottle a hair higher than
   * the board. Because a mesh is positioned by its centre, not its base, that
   * buried the whole 58 mm bottle inside a 22 mm shelf and left only the caps
   * showing — a row of little dark beads rather than a wall of polish.
   */
  const SHELF_THICKNESS = 0.022
  const BOTTLE_HEIGHT = 0.058
  const CAP_HEIGHT = 0.032

  const shelfY = useCallback(
    (row: number) => y - height / 2 + (height / rows) * (row + 0.28),
    [y, height, rows],
  )
  /** Sits the bottle's base on the shelf's top face. */
  const bottleY = useCallback(
    (row: number) => shelfY(row) + SHELF_THICKNESS / 2 + BOTTLE_HEIGHT / 2,
    [shelfY],
  )

  /** One bottle per grid cell, cycling through the palette. */
  const bottles = useMemo(() => {
    const out: { position: [number, number, number]; color: string }[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < bottlesPerRow; c++) {
        const t = (c + 0.5) / bottlesPerRow
        out.push({
          position: [x - 0.13, bottleY(r), z - width / 2 + width * t],
          color: POLISH_COLOURS[(r * bottlesPerRow + c) % POLISH_COLOURS.length],
        })
      }
    }
    return out
  }, [rows, bottlesPerRow, width, z, x, bottleY])

  const shelf = NAIL_BAR.productShelf
  const bed = NAIL_BAR.treatmentBed

  return (
    <group>
      {/* ---- Nail Art shelving unit ---- */}
      <group>
        {/* Back panel. */}
        <mesh
          geometry={box(0.03, height + 0.36, width)}
          material={lacquer}
          position={[x - 0.015, y + 0.1, z]}
          receiveShadow
        />
        {/* Shelves. */}
        {Array.from({ length: rows }, (_, r) => (
          <mesh
            key={r}
            geometry={box(0.22, SHELF_THICKNESS, width)}
            material={lacquer}
            position={[x - 0.12, shelfY(r), z]}
            castShadow={castShadow}
          />
        ))}
        {/* Vertical dividers. */}
        {[-0.5, -0.17, 0.17, 0.5].map((f) => (
          <mesh key={f} geometry={box(0.2, height, 0.02)} material={lacquer} position={[x - 0.11, y, z + width * f]} />
        ))}
        {/* Curved crown over the unit. */}
        <mesh
          geometry={cylinderArc(width / 2, 0.22, 26, Math.PI)}
          material={lacquer}
          position={[x - 0.11, y + height / 2 + 0.02, z]}
          rotation={[Math.PI / 2, 0, Math.PI / 2]}
          scale={[1, 1, 0.32]}
        />
        {/* Mirrored "Nail Art" script on the crown. */}
        <mesh position={[x - 0.235, y + height / 2 + 0.12, z]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[0.78, 0.27]} />
          <meshStandardMaterial map={signTexture} transparent metalness={0.8} roughness={0.25} envMapIntensity={1.3} depthWrite={false} />
        </mesh>
        {/* Curved base counter. */}
        <mesh
          geometry={roundedSlab(0.34, width, 0.04, 0.02)}
          material={lacquer}
          position={[x - 0.17, y - height / 2 - 0.05, z]}
          rotation={[-Math.PI / 2, 0, 0]}
          castShadow={castShadow}
        />
      </group>

      {/*
        Polish bottles — glass bodies.

        `frustumCulled={false}` is load-bearing here and on every other
        instanced batch in the scene. An InstancedMesh keeps the bounding
        sphere of its BASE geometry, centred on the object's own origin; it
        knows nothing about where the instances were scattered to. Three.js
        therefore culls the entire batch whenever the world origin falls
        outside the frustum — which, in a room this size, is most of the time.
        The whole polish wall disappeared the moment the camera turned to look
        at it.
      */}
      <Instances frustumCulled={false} limit={bottles.length} range={bottles.length}>
        <cylinderGeometry args={[0.017, 0.019, BOTTLE_HEIGHT, 10]} />
        <meshStandardMaterial roughness={0.18} metalness={0} envMapIntensity={1} />
        {bottles.map((b, i) => (
          <Instance key={i} position={b.position} color={b.color} />
        ))}
      </Instances>
      {/* Polish bottles — black caps. */}
      <Instances frustumCulled={false} limit={bottles.length} range={bottles.length}>
        <cylinderGeometry args={[0.011, 0.011, CAP_HEIGHT, 8]} />
        <meshStandardMaterial color="#17161A" roughness={0.35} metalness={0.1} />
        {bottles.map((b, i) => (
          <Instance
            key={i}
            position={[b.position[0], b.position[1] + (BOTTLE_HEIGHT + CAP_HEIGHT) / 2, b.position[2]]}
          />
        ))}
      </Instances>

      {/* ---- Retail product shelf ---- */}
      <mesh
        geometry={box(0.28, shelf.height, shelf.width)}
        material={lacquer}
        position={[shelf.x - 0.14, shelf.y, shelf.z]}
        castShadow={castShadow}
      />
      {Array.from({ length: shelf.shelves }, (_, i) => (
        <mesh
          key={i}
          geometry={box(0.26, 0.018, shelf.width - 0.03)}
          material={lacquer}
          position={[shelf.x - 0.15, shelf.y - shelf.height / 2 + (shelf.height / shelf.shelves) * (i + 0.35), shelf.z]}
        />
      ))}
      <Instances frustumCulled={false} limit={15} range={15}>
        <cylinderGeometry args={[0.024, 0.026, 0.11, 10]} />
        <meshStandardMaterial roughness={0.3} metalness={0} envMapIntensity={0.7} />
        {Array.from({ length: 15 }, (_, i) => {
          const row = Math.floor(i / 3)
          const col = i % 3
          return (
            <Instance
              key={i}
              position={[
                shelf.x - 0.16,
                shelf.y - shelf.height / 2 + (shelf.height / shelf.shelves) * (row + 0.35) + 0.065,
                shelf.z - 0.32 + col * 0.31,
              ]}
              color={['#E8853F', '#F2F0EC', '#D94F86', '#3FA89B', '#E8C23F'][i % 5]}
            />
          )
        })}
      </Instances>

      {/* ---- Treatment bed, draped in a white sheet ---- */}
      <group position={[bed.x, 0, bed.z]} rotation={[0, bed.rotationY, 0]}>
        <mesh
          geometry={roundedSlab(bed.length, bed.width, 0.16, 0.05)}
          material={leather}
          position={[0, bed.height, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          castShadow={castShadow}
        />
        {/* Sheet overhang. */}
        <mesh
          geometry={box(bed.length + 0.04, 0.3, bed.width + 0.05)}
          material={leather}
          position={[0, bed.height - 0.16, 0]}
        />
        {/* Raised head section. */}
        <mesh
          geometry={roundedSlab(0.44, bed.width, 0.13, 0.05)}
          material={leather}
          position={[bed.length / 2 - 0.2, bed.height + 0.09, 0]}
          rotation={[-Math.PI / 2 + 0.34, 0, 0]}
        />
        {/* Tapered timber legs. */}
        {[-1, 1].flatMap((sx) =>
          [-1, 1].map((sz) => (
            <mesh
              key={`${sx}${sz}`}
              geometry={cylinder(0.018, 0.026, bed.height - 0.28, 8)}
              material={timber}
              position={[sx * (bed.length / 2 - 0.16), (bed.height - 0.28) / 2, sz * (bed.width / 2 - 0.1)]}
              rotation={[sz * 0.05, 0, sx * -0.05]}
            />
          )),
        )}
      </group>

      {/* Brush cups on the nail counter. */}
      {[-0.42, 0.38].map((o) => (
        <group key={o} position={[x - 0.2, y - height / 2 - 0.03, z + o]}>
          <mesh geometry={cylinder(0.038, 0.034, 0.1, 12)} material={timber} position={[0, 0.05, 0]} />
          {[0, 1, 2].map((b) => (
            <mesh
              key={b}
              geometry={cylinder(0.005, 0.004, 0.13, 6)}
              material={gold}
              position={[(b - 1) * 0.014, 0.12, 0]}
              rotation={[0, 0, (b - 1) * 0.09]}
            />
          ))}
        </group>
      ))}
    </group>
  )
}
