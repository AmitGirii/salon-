/**
 * Procedural texture generation for the salon.
 *
 * Everything here is drawn to a canvas at runtime rather than downloaded.
 * That keeps the payload at zero bytes for textures, which matters far more
 * than the couple of milliseconds the drawing costs — and it means the marble
 * can be re-tuned from `materials.config.ts` without re-exporting art.
 */

import * as THREE from 'three'
import { MARBLE_TEXTURE, PALETTE } from '@/config/materials.config'

type Ctx = CanvasRenderingContext2D

function makeCanvas(size: number): { canvas: HTMLCanvasElement; ctx: Ctx } {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable — cannot build textures')
  return { canvas, ctx }
}

/** Deterministic PRNG so the marble looks identical on every reload. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Draws one branching vein as a chain of quadratic curves that wanders across
 * the tile, tapering as it goes. Real Calacatta veins are directional and
 * mostly parallel, so the walk is biased along a shared axis.
 */
function drawVein(
  ctx: Ctx,
  rand: () => number,
  size: number,
  angle: number,
  width: number,
  color: string,
  alpha: number,
  depth = 0,
) {
  let x = rand() * size
  let y = rand() * size
  // Start most veins off-canvas so they read as continuous across the tile.
  if (rand() > 0.4) {
    if (rand() > 0.5) x = rand() > 0.5 ? -size * 0.1 : size * 1.1
    else y = rand() > 0.5 ? -size * 0.1 : size * 1.1
  }

  const steps = 7 + Math.floor(rand() * 6)
  const stepLen = size / (steps * 0.72)

  ctx.beginPath()
  ctx.moveTo(x, y)
  let a = angle
  for (let i = 0; i < steps; i++) {
    a += (rand() - 0.5) * 0.85
    const nx = x + Math.cos(a) * stepLen
    const ny = y + Math.sin(a) * stepLen
    const cx = x + Math.cos(a + (rand() - 0.5) * 1.2) * stepLen * 0.55
    const cy = y + Math.sin(a + (rand() - 0.5) * 1.2) * stepLen * 0.55
    ctx.quadraticCurveTo(cx, cy, nx, ny)

    // Occasional hairline branch, which is what sells it as stone.
    if (depth < 2 && rand() > 0.72) {
      const saved = ctx.lineWidth
      ctx.stroke()
      drawVein(ctx, rand, size, a + (rand() - 0.5) * 1.6, width * 0.45, color, alpha * 0.7, depth + 1)
      ctx.lineWidth = saved
      ctx.beginPath()
      ctx.moveTo(nx, ny)
    }
    x = nx
    y = ny
  }

  ctx.strokeStyle = color
  ctx.globalAlpha = alpha
  ctx.lineWidth = width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.stroke()
  ctx.globalAlpha = 1
}

function paintMarble(ctx: Ctx, size: number, seed: number) {
  const rand = mulberry32(seed)

  // Base stone with a very soft warm gradient so it is never flat white.
  const g = ctx.createLinearGradient(0, 0, size, size)
  g.addColorStop(0, '#FBFAF8')
  g.addColorStop(0.5, PALETTE.marble)
  g.addColorStop(1, '#F0EDE8')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)

  // Broad cloudy patches under the veining.
  for (let i = 0; i < 22; i++) {
    const r = size * (0.08 + rand() * 0.22)
    const cx = rand() * size
    const cy = rand() * size
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    rg.addColorStop(0, 'rgba(188,178,164,0.16)')
    rg.addColorStop(1, 'rgba(196,188,176,0)')
    ctx.fillStyle = rg
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2)
  }

  // Veins run along a dominant diagonal, as in the reference floor.
  const dominant = -0.62
  ctx.save()
  ctx.filter = 'blur(1.2px)'
  for (let i = 0; i < MARBLE_TEXTURE.veins; i++) {
    const angle = dominant + (rand() - 0.5) * 0.5
    const width = size * (0.0018 + rand() * 0.0075)
    const warm = rand() > 0.7
    drawVein(
      ctx,
      rand,
      size,
      angle,
      width,
      warm ? PALETTE.marbleVeinWarm : PALETTE.marbleVein,
      0.2 + rand() * 0.3,
    )
  }
  ctx.restore()

  ctx.save()
  ctx.filter = 'blur(0.5px)'
  for (let i = 0; i < MARBLE_TEXTURE.hairlines; i++) {
    const angle = dominant + (rand() - 0.5) * 0.9
    drawVein(ctx, rand, size, angle, size * 0.0009, PALETTE.marbleVein, 0.09 + rand() * 0.13)
  }
  ctx.restore()

  // Faint tile grout at the canvas edge — one canvas covers one tile.
  if (MARBLE_TEXTURE.groutStrength > 0) {
    ctx.strokeStyle = `rgba(150,144,136,${MARBLE_TEXTURE.groutStrength})`
    ctx.lineWidth = Math.max(1, size * 0.0022)
    ctx.strokeRect(0, 0, size, size)
  }
}

let marbleColorCache: THREE.CanvasTexture | null = null
let marbleRoughCache: THREE.CanvasTexture | null = null

/** Colour map for the marble floor, tiled across the room. */
export function getMarbleColorMap(repeat: number): THREE.CanvasTexture {
  if (!marbleColorCache) {
    const { canvas, ctx } = makeCanvas(MARBLE_TEXTURE.size)
    paintMarble(ctx, MARBLE_TEXTURE.size, 20160421)
    marbleColorCache = new THREE.CanvasTexture(canvas)
    marbleColorCache.colorSpace = THREE.SRGBColorSpace
    marbleColorCache.wrapS = marbleColorCache.wrapT = THREE.RepeatWrapping
    marbleColorCache.anisotropy = 8
  }
  const t = marbleColorCache.clone()
  t.needsUpdate = true
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat, repeat)
  return t
}

/**
 * Roughness map derived from the same drawing: veins polish slightly
 * differently to the base stone, which is what stops the floor reading as one
 * uniform sheet of gloss.
 */
export function getMarbleRoughnessMap(repeat: number): THREE.CanvasTexture {
  if (!marbleRoughCache) {
    const size = MARBLE_TEXTURE.size / 2
    const { canvas, ctx } = makeCanvas(size)
    ctx.fillStyle = '#2b2b2b'
    ctx.fillRect(0, 0, size, size)
    const rand = mulberry32(99114)
    ctx.save()
    ctx.filter = 'blur(2px)'
    for (let i = 0; i < 26; i++) {
      drawVein(ctx, rand, size, -0.62 + (rand() - 0.5) * 0.6, size * 0.004, '#6e6e6e', 0.5)
    }
    ctx.restore()
    marbleRoughCache = new THREE.CanvasTexture(canvas)
    marbleRoughCache.wrapS = marbleRoughCache.wrapT = THREE.RepeatWrapping
  }
  const t = marbleRoughCache.clone()
  t.needsUpdate = true
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat, repeat)
  return t
}

let wallCache: THREE.CanvasTexture | null = null

/**
 * Barely-there roughness break-up for the painted walls. Perfectly uniform
 * paint is the fastest way to make an interior look computer-generated.
 */
export function getWallRoughnessMap(repeat = 4): THREE.CanvasTexture {
  if (!wallCache) {
    const size = 256
    const { canvas, ctx } = makeCanvas(size)
    const img = ctx.createImageData(size, size)
    const rand = mulberry32(7788)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 190 + rand() * 40
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = 255
    }
    ctx.putImageData(img, 0, 0)
    // Soften it so it reads as surface, not noise.
    ctx.filter = 'blur(1.4px)'
    ctx.drawImage(canvas, 0, 0)
    wallCache = new THREE.CanvasTexture(canvas)
    wallCache.wrapS = wallCache.wrapT = THREE.RepeatWrapping
  }
  const t = wallCache.clone()
  t.needsUpdate = true
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat, repeat)
  return t
}

/** Vertical rib pattern used as a normal-ish break-up on the curtain. */
export function getFabricRoughnessMap(): THREE.CanvasTexture {
  const size = 128
  const { canvas, ctx } = makeCanvas(size)
  ctx.fillStyle = '#d0d0d0'
  ctx.fillRect(0, 0, size, size)
  const rand = mulberry32(4242)
  for (let x = 0; x < size; x += 2) {
    ctx.fillStyle = `rgba(90,90,90,${0.12 + rand() * 0.16})`
    ctx.fillRect(x, 0, 1, size)
  }
  const t = new THREE.CanvasTexture(canvas)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

/**
 * Transparent lettering, drawn to a canvas.
 *
 * The salon has mirrored script signage on the reception desk and above the
 * nail wall. Rendering it as an alpha texture on a thin plane keeps it crisp
 * at any distance without shipping a font atlas or a text-geometry loader.
 */
export function createTextTexture(
  text: string,
  {
    width = 1024,
    height = 256,
    font = 'italic 300 120px "Cormorant Garamond", Georgia, serif',
    color = '#CFCFCF',
    letterSpacing = 2,
  }: { width?: number; height?: number; font?: string; color?: string; letterSpacing?: number } = {},
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable — cannot build signage')

  ctx.clearRect(0, 0, width, height)
  ctx.font = font
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  // Faint drop shadow so the "metal" letters lift off the surface behind them.
  ctx.shadowColor = 'rgba(0,0,0,0.35)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetY = 3

  if (letterSpacing > 0 && 'letterSpacing' in ctx) {
    ;(ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${letterSpacing}px`
  }
  ctx.fillText(text, width / 2, height / 2)

  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

/** Frees the cached canvases — called when the 3D scene unmounts. */
export function disposeGeneratedTextures() {
  marbleColorCache?.dispose()
  marbleRoughCache?.dispose()
  wallCache?.dispose()
  marbleColorCache = marbleRoughCache = wallCache = null
}
