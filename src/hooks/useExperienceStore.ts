/**
 * Experience state shared between the DOM overlay and the WebGL scene.
 *
 * Deliberately a tiny external store rather than context: the 3D scene reads
 * this every frame and must never be the reason React re-renders the whole
 * marketing shell.
 */

import { useSyncExternalStore } from 'react'
import { SECTION_CAMERA, type CameraPoseId } from '@/config/camera.config'
import type { SectionId } from '@/config/site.config'
import { introWillPlay } from '@/utils/intro'

export type Phase = 'loading' | 'intro' | 'exploring'

export type ExperienceState = {
  phase: Phase
  /** Progress of the 3D scene warm-up, 0–1. */
  progress: number
  /** The view picked from the switcher, used only while `scrollDriven` is off. */
  cameraMode: CameraPoseId
  /** True while the page's scroll position drives the camera. */
  scrollDriven: boolean
  activeSection: SectionId
  /** Set when the scene degrades itself after sustained frame drops. */
  degraded: boolean
  /** Set when WebGL is unavailable or the device cannot cope. */
  fallback: boolean
  /**
   * False only while the opening title card is on screen.
   *
   * The scroll wiring waits on it. Building a ScrollTrigger costs a forced
   * layout, and while the card is up the page underneath is collapsed out of
   * the render pipeline — so a trigger built then is both expensive and
   * measured against nothing. Waiting means each one is built once, against
   * real geometry.
   */
  introDone: boolean
  navOpen: boolean
  /**
   * The 3D room has every shader compiled and one frame drawn off screen.
   * A phone shows and draws the room only from this point (see
   * StationsSection), so the handover is a fade, never a freeze.
   */
  salonWarm: boolean
  /**
   * The visitor is looking at the 3D box on a phone and the room is not warm
   * yet: the warm-up stops yielding to idle time and finishes at once.
   */
  salonHurry: boolean
}

let state: ExperienceState = {
  phase: 'loading',
  progress: 0,
  cameraMode: 'hero',
  scrollDriven: true,
  activeSection: 'hero',
  degraded: false,
  fallback: false,
  introDone: !introWillPlay(),
  navOpen: false,
  salonWarm: false,
  salonHurry: false,
}

const listeners = new Set<() => void>()

const emit = () => listeners.forEach((l) => l())

export function setExperience(patch: Partial<ExperienceState>) {
  let changed = false
  for (const k of Object.keys(patch) as (keyof ExperienceState)[]) {
    if (state[k] !== patch[k]) {
      changed = true
      break
    }
  }
  if (!changed) return
  state = { ...state, ...patch }
  emit()
}

/** Read the current state without subscribing — for use inside the frame loop. */
export const getExperience = () => state

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function useExperience<T>(selector: (s: ExperienceState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => selector(state),
    () => selector(state),
  )
}

/* ------------------------------------------------------------ pose model */

/**
 * Which camera pose is live right now.
 *
 * Two ways in, and only two:
 *
 *   1. SCROLLING the page. Each section owns a pose, so reading the story
 *      moves the camera through the salon as a backdrop. This is the default.
 *   2. PICKING A VIEW. The visitor asked to see a particular part of the room,
 *      so the camera goes there and the page stays exactly where it is.
 *
 * There is no separate walkthrough mode. One salon, one set of views — a
 * second way of showing the same room only ever competed with the first.
 *
 * The second exists because the page must not move underneath someone who
 * only wanted to look at the salon. Scrolling to a genuinely different section
 * hands control back to the story — see `useSectionTrigger`.
 *
 * One formula, one source of truth: the controller and every button that
 * highlights the live view all read this, so they cannot drift apart.
 */
export function resolvePoseId(s: ExperienceState): CameraPoseId {
  return s.scrollDriven ? SECTION_CAMERA[s.activeSection] : s.cameraMode
}

export const useCurrentPose = (): CameraPoseId => useExperience(resolvePoseId)

/* ------------------------------------------------------------- actions */

export const setActiveSection = (id: SectionId) => setExperience({ activeSection: id })

/** Hands the camera back to the page's scroll position. */
export const followScroll = () => setExperience({ scrollDriven: true })

/**
 * Touching any 3D control means the visitor is exploring, so the floating
 * switcher should be there from then on. Promotes the phase without disturbing
 * anything else.
 */
const markExploring = () =>
  getExperience().phase === 'intro' ? { phase: 'exploring' as const } : null

/**
 * Show one part of the salon, without moving the page.
 *
 * This is the whole point of the view switcher: the visitor is reading
 * something, glances at the room behind it, and wants a different angle. The
 * article they are on should stay put.
 */
export const setCameraMode = (pose: CameraPoseId) =>
  setExperience({ cameraMode: pose, scrollDriven: false, ...markExploring() })

