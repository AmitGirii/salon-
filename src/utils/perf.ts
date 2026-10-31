/**
 * Device capability detection.
 *
 * Decides — before three.js is even imported — whether this device gets the
 * full 3D salon, a reduced one, or the static cinematic fallback. Getting this
 * wrong is worse than shipping a simpler scene, so the checks are conservative.
 */

export type DeviceTier = 'high' | 'medium' | 'low' | 'none'

export type DeviceProfile = {
  tier: DeviceTier
  webgl2: boolean
  isMobile: boolean
  isTouch: boolean
  prefersReducedMotion: boolean
  renderer: string
  /** Pixel-ratio ceiling for the canvas. */
  dpr: [number, number]
  shadows: boolean
  reflections: boolean
  postProcessing: boolean
}

/** Renderer substrings that reliably indicate a software or very weak GPU. */
const WEAK_RENDERERS = [
  'swiftshader',
  'llvmpipe',
  'software',
  'basic render driver',
  'microsoft basic',
  'mesa offscreen',
]

function readRenderer(gl: WebGLRenderingContext | WebGL2RenderingContext): string {
  try {
    const dbg = gl.getExtension('WEBGL_debug_renderer_info')
    if (dbg) return String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) ?? '')
    return String(gl.getParameter(gl.RENDERER) ?? '')
  } catch {
    return ''
  }
}

let cached: DeviceProfile | null = null

export function detectDevice(): DeviceProfile {
  if (cached) return cached

  const isTouch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
  const isMobile =
    typeof window !== 'undefined' && (window.matchMedia('(max-width: 900px)').matches || (isTouch && window.innerWidth < 1100))
  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  let webgl2 = false
  let renderer = ''
  let contextOk = false

  try {
    const canvas = document.createElement('canvas')
    const gl2 = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false })
    if (gl2) {
      webgl2 = true
      contextOk = true
      renderer = readRenderer(gl2)
    } else {
      const gl1 = (canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
      if (gl1) {
        contextOk = true
        renderer = readRenderer(gl1)
      }
    }
  } catch {
    contextOk = false
  }

  const rendererLower = renderer.toLowerCase()
  const weakGpu = WEAK_RENDERERS.some((r) => rendererLower.includes(r))
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency ?? 4 : 4
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4

  /*
   * iPhones and iPads report at most TWO cores to every website, whatever the
   * chip — WebKit caps `navigator.hardwareConcurrency` for privacy — and they
   * report no `deviceMemory` at all. A rule of "two cores means a weak
   * device" therefore sent every iPhone to the photographs and the 3D room
   * never appeared on one. The core count is not evidence on iOS.
   */
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const ios =
    /iP(hone|ad|od)/.test(ua) ||
    (typeof navigator !== 'undefined' && navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  let tier: DeviceTier
  if (!contextOk || !webgl2) {
    // three.js r163+ renders with WebGL2 only. A WebGL1-only device (iOS 14
    // and older, some old Android WebViews) gets the photography, not a
    // crash: without this the renderer throws at mount.
    tier = 'none'
  } else if (weakGpu || memory <= 1) {
    // A software renderer, or a gigabyte of memory: the photography is the
    // kinder answer.
    tier = 'none'
  } else if (!ios && cores <= 2) {
    // A genuinely two-core Android: the light room — no reflections, no
    // shadows, fewer lights — still the room.
    tier = 'low'
  } else if (isMobile || cores <= 4 || memory <= 4) {
    tier = 'medium'
  } else {
    tier = 'high'
  }

  cached = {
    tier,
    webgl2,
    isMobile,
    isTouch,
    prefersReducedMotion,
    renderer,
    dpr: tier === 'high' ? [1, 2] : tier === 'medium' ? [1, 1.5] : [1, 1],
    shadows: tier === 'high',
    reflections: tier === 'high',
    postProcessing: tier === 'high',
  }
  return cached
}

/** Test hook — lets the fallback be forced with `?fallback=1` for QA. */
export function forcedFallback(): boolean {
  if (typeof window === 'undefined') return false
  const p = new URLSearchParams(window.location.search)
  return p.get('fallback') === '1' || p.get('nowebgl') === '1'
}

/** Test hook — `?tier=low|medium|high` overrides detection for QA. */
export function forcedTier(): DeviceTier | null {
  if (typeof window === 'undefined') return null
  const t = new URLSearchParams(window.location.search).get('tier')
  return t === 'low' || t === 'medium' || t === 'high' ? t : null
}

/**
 * Watches real frame times and reports when the device is persistently below
 * target, so the scene can shed quality rather than stutter.
 */
export function createFrameWatchdog(onDrop: () => void, targetFps = 30, windowSize = 90) {
  let frames = 0
  let elapsed = 0
  let fired = false
  let strikes = 0

  return (delta: number) => {
    if (fired) return
    frames++
    elapsed += delta
    if (frames < windowSize) return
    const fps = frames / elapsed
    frames = 0
    elapsed = 0
    if (fps < targetFps) {
      strikes++
      if (strikes >= 2) {
        fired = true
        onDrop()
      }
    } else {
      strikes = 0
    }
  }
}
