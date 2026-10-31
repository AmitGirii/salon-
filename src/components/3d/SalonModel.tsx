import { Component, Suspense, lazy, useEffect, useState, type ReactNode } from 'react'
import { MODEL } from '@/config/room.config'
import type { DeviceTier } from '@/utils/perf'
import SalonRoom from './SalonRoom'

const GltfSalon = lazy(() => import('./GltfSalon'))

/**
 * Falls back to the procedural room if the GLB fails to parse.
 *
 * A corrupt or half-uploaded model should degrade to a working salon, never to
 * an empty canvas.
 */
class ModelBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.warn('[Cut N Curl] salon.glb failed to load — using the procedural salon.', error)
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/**
 * MODEL SOURCE SWITCH
 * ---------------------------------------------------------------------------
 * Chooses between the procedural blockout and a real photogrammetry/Blender
 * export, without ever importing a file that may not exist:
 *
 *   • `MODEL.useGltf` is false  → procedural salon, no network request.
 *   • `MODEL.useGltf` is true   → HEAD-probe `MODEL.url` first. Only if the
 *                                 file is really there does the loader chunk
 *                                 get imported and the model mounted.
 *
 * That ordering is deliberate: flipping the flag before the artist has
 * delivered the file leaves the site working rather than suspended on a 404.
 */
export default function SalonModel({ tier }: { tier: DeviceTier }) {
  const [glbReady, setGlbReady] = useState(false)

  useEffect(() => {
    if (!MODEL.useGltf) return
    let alive = true

    fetch(MODEL.url, { method: 'HEAD' })
      .then((res) => {
        const type = res.headers.get('content-type') ?? ''
        // A dev server that rewrites unknown paths to index.html will answer
        // 200 with HTML — treat that as "no model here".
        if (alive && res.ok && !type.includes('text/html')) setGlbReady(true)
        else if (alive) {
          console.info('[Cut N Curl] No salon.glb found at %s — using the procedural salon.', MODEL.url)
        }
      })
      .catch(() => {
        if (alive) console.info('[Cut N Curl] salon.glb unreachable — using the procedural salon.')
      })

    return () => {
      alive = false
    }
  }, [])

  if (!glbReady) return <SalonRoom tier={tier} />

  return (
    <ModelBoundary fallback={<SalonRoom tier={tier} />}>
      <Suspense fallback={<SalonRoom tier={tier} />}>
        <GltfSalon tier={tier} />
      </Suspense>
    </ModelBoundary>
  )
}
