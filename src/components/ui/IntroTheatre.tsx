import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { ANIM } from '@/config/animation.config'
import { BRAND } from '@/config/site.config'
import { refreshScrollTriggers } from '@/animations/useScrollTimeline'
import { introWillPlay } from '@/utils/intro'
import { lockScroll } from '@/utils/scrollLock'

/**
 * The opening title sequence.
 *
 * The salon's own logo film blooms out of black, and the wordmark is struck in
 * one word at a time — Cut, then N, then Curl — the way a title card lands in
 * a cinema. Each word arrives soft, oversized and gold, then pulls into focus
 * and cools to ivory. The card finally pushes forward and dissolves into the
 * salon behind it.
 *
 * **Every frame of this is CSS.** No animation library, nothing running per
 * frame in JavaScript — because this is the one animation every visitor is
 * guaranteed to watch, and it plays while the browser is at its busiest:
 * parsing the app, laying out the page, fetching webfonts, booting WebGL.
 *
 * That mattered concretely. Driving the words from GSAP cost a *forced
 * synchronous layout* each time a word's tween initialised and read computed
 * style — tracing at 4x CPU throttle showed 340 ms `Layout` events firing
 * inside `FireAnimationFrame`, one per word, landing exactly on the reveals.
 * A CSS animation is handed to the compositor once and never asks the main
 * thread for anything again, so it cannot stutter no matter what else runs.
 *
 * Timings still come from `ANIM.theatre`, handed to the stylesheet as custom
 * properties, so the storyboard stays in one place.
 *
 * Two consequences worth knowing:
 *
 * - **Skipping is free.** `is-leaving` sets `animation: none`, so the card
 *   falls back to its resting CSS — which is the finished title. Dismiss it at
 *   any moment and it dissolves from a composed frame, never a half-built one.
 * - **Nothing waits on the video.** The film is decoration over a card that is
 *   already telling the story; if it 404s, fails to decode or is still
 *   buffering, the sequence runs to time and the poster stands in.
 *
 * Plays on every load. `?intro=0` skips it; see `utils/intro.ts`.
 */

/** Asked for less motion? Then no film, and no sequence. */
function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

/** The storyboard, handed to the stylesheet. */
function cueSheet(): CSSProperties {
  const t = ANIM.theatre
  return {
    '--cue-film': `${t.filmIn}s`,
    '--cue-film-dur': `${t.filmDuration}s`,
    '--cue-word-dur': `${t.wordDuration}s`,
    '--cue-w1': `${t.words[0]}s`,
    '--cue-w2': `${t.words[1]}s`,
    '--cue-w3': `${t.words[2]}s`,
    '--cue-rule': `${t.rule}s`,
    '--cue-tagline': `${t.tagline}s`,
    '--cue-exit': `${t.exit}s`,
  } as CSSProperties
}

export default function IntroTheatre({ onFinished }: { onFinished?: () => void }) {
  const [active, setActive] = useState(introWillPlay)
  const [reduced] = useState(prefersReducedMotion)
  const [leaving, setLeaving] = useState(false)
  /** True once the film is actually playing; until then the still stands in. */
  const [playing, setPlaying] = useState(false)
  /** The browser refused the film: the animated image plays in its place. */
  const [refused, setRefused] = useState(false)
  const video = useRef<HTMLVideoElement>(null)
  const done = useRef(false)
  const finished = useRef(onFinished)
  finished.current = onFinished

  /**
   * End the sequence. Idempotent: the skip button, the backdrop click, a key
   * press and the hold timer all land here.
   */
  const finish = useCallback(() => {
    if (done.current) return
    done.current = true
    video.current?.pause()
    setLeaving(true)
    /*
     * Handed over here — at the START of the dissolve, not at unmount.
     *
     * The dissolve is a compositor-driven CSS transition, so it keeps running
     * smoothly even while the main thread is blocked. That makes it the one
     * window in the whole load where expensive work is free: the 3D layer
     * mounts under the fade and gets a full second of head start that nobody
     * sees.
     */
    finished.current?.()
  }, [])

  // Hold the page still underneath, and give the sequence the keyboard.
  useEffect(() => {
    if (!active) return
    const { body } = document
    const unlock = lockScroll()
    // Lets the stylesheet take the page underneath out of the render pipeline
    // entirely while it is covered. See `is-theatre` in components.css.
    body.classList.add('is-theatre')

    const onKey = (e: KeyboardEvent) => {
      // Tab stays live so the skip button is still reachable.
      if (e.key !== 'Tab') finish()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      unlock()
      body.classList.remove('is-theatre')
      window.removeEventListener('keydown', onKey)
    }
  }, [active, finish])

  // The one timer the sequence needs. Wall-clock, so the card leaves on time
  // whatever the render loop is doing.
  useEffect(() => {
    if (!active) return
    if (!reduced) {
      // Best effort. Autoplay is muted and inline, so it is permitted
      // everywhere, but a rejected promise must never break the sequence:
      // the still (the film's own first frame) simply stays, and the film,
      // never having reached `playing`, is never shown — so no browser gets
      // the chance to draw a play glyph over the badge.
      const el = video.current
      if (el) {
        el.muted = true
        el.defaultMuted = true
        el.setAttribute('muted', '')
        el.setAttribute('webkit-playsinline', '')
        el.setAttribute('x5-playsinline', '')
        el.play().catch(() => setRefused(true))
      }
    }
    const t = window.setTimeout(
      finish,
      (reduced ? ANIM.theatre.reducedHold : ANIM.theatre.hold) * 1000,
    )
    return () => window.clearTimeout(t)
  }, [active, reduced, finish])

  // Unmount after the dissolve, so the card can never trap a pointer event or
  // a screen reader, then re-measure the scroll triggers it was covering.
  //
  // ORDER MATTERS. While the card is up the page underneath is
  // `content-visibility: hidden` — every section is a zero-height box — and
  // the section triggers were built (at `introDone`, the start of the
  // dissolve) against exactly that. The class has to come off FIRST, the
  // page has to lay out again, and only then is a measurement worth taking.
  // Refreshing in the same task as removing the class measured the collapsed
  // page a second time and left every trigger starting at scroll 0.
  useEffect(() => {
    if (!leaving) return
    let raf = 0
    const t = window.setTimeout(() => {
      document.body.classList.remove('is-theatre')
      setActive(false)
      raf = requestAnimationFrame(() => {
        raf = requestAnimationFrame(() => refreshScrollTriggers())
      })
    }, ANIM.theatre.exit * 1000 + 120)
    return () => {
      window.clearTimeout(t)
      cancelAnimationFrame(raf)
    }
  }, [leaving])

  if (!active) return null

  const [first, middle, last] = BRAND.wordmark

  return (
    <div
      className={`theatre${leaving ? ' is-leaving' : ''}${reduced ? ' is-still' : ''}`}
      style={cueSheet()}
      role="dialog"
      aria-modal="true"
      aria-label={`${BRAND.name} — ${BRAND.tagline}`}
      onClick={finish}
    >
      <div className="theatre__card">
        <div className="theatre__stage">
          <div className="theatre__glow" aria-hidden="true" />
          {/* Always present, underneath: the film's first frame. */}
          <img className="theatre__still" src={BRAND.logo.filmPoster} alt="" aria-hidden="true" />
          {/* Only if the browser refused the film: the same film as an animated image. */}
          {refused && !playing && (
            <picture className="theatre__anim">
              <source type="image/avif" srcSet={BRAND.logo.filmAnim.avif} />
              <img src={BRAND.logo.filmAnim.webp} alt="" aria-hidden="true" decoding="async" />
            </picture>
          )}
          {!reduced && (
            <video
              className={`theatre__film${playing ? ' is-playing' : ''}`}
              ref={video}
              src={BRAND.logo.film}
              muted
              playsInline
              autoPlay
              preload="auto"
              controls={false}
              disablePictureInPicture
              disableRemotePlayback
              aria-hidden="true"
              tabIndex={-1}
              onPlaying={() => setPlaying(true)}
              onError={() => setRefused(true)}
            />
          )}
        </div>

        <p className="theatre__wordmark display" aria-hidden="true">
          <span className="theatre__word">{first}</span>
          <span className="theatre__word theatre__word--n">{middle}</span>
          <span className="theatre__word">{last}</span>
        </p>

        <span className="theatre__rule" aria-hidden="true" />
        <p className="theatre__tagline">{BRAND.tagline}</p>
      </div>

      <button className="theatre__skip" type="button" onClick={finish}>
        Skip intro
      </button>

      <div className="theatre__grain" aria-hidden="true" />
    </div>
  )
}
