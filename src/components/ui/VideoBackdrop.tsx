import { useEffect, useRef, useState } from 'react'
import { HERO } from '@/config/site.config'
import { usePrefersReducedMotion } from '@/hooks/useMediaQuery'

/**
 * The salon film as the site's environment.
 *
 * ONE video element, mounted once in App, fixed behind everything, for the
 * whole session. The page scrolls over it; nothing about scrolling reaches it.
 * There is deliberately no IntersectionObserver, no scroll listener, no
 * scroll-linked opacity or scale, and no state that changes with playback —
 * the element is created on first render and never touched again except to
 * ask it to play.
 *
 * Two edits are shipped — a 16:9 desktop master and a 9:16 mobile crop — and
 * the choice is made once at mount from the viewport width. It is never
 * swapped on resize: swapping the source restarts playback mid-shot, which is
 * exactly the kind of interruption this layer exists to avoid.
 *
 * Autoplay is muted and inline, which every browser permits. If a policy
 * still refuses it (Low Power Mode, a data-saver setting), the film does not
 * stop being a film: the same edit is shown as an ANIMATED IMAGE instead —
 * an animated AVIF, or WebP on older iOS — which every browser animates
 * regardless of its video policy. It is fetched only at that moment, so
 * nobody else pays for it. Underneath, the poster; the video itself stays
 * invisible so no browser can draw a play glyph over it; and a retry is armed
 * on the first tap, click or key press, kept armed until playback actually
 * starts — at which point the real video fades in over the animation and the
 * animation is dropped. Same element, no second copy, never a play button.
 *
 * `prefers-reduced-motion`: no video element at all; the poster is the
 * environment.
 *
 * The only pause is for a hidden tab, which has nothing to do with scrolling
 * and is simply not wasting a 1080p decode on a page nobody is looking at.
 *
 * THE KEEPER. Nothing on this page ever pauses the film except that hidden
 * tab — so a pause from anywhere else (a browser's power policy, a decoder
 * dropped under memory pressure, a stall at the loop point on a slow
 * connection, a media error) is an interruption to undo, not a state to
 * respect. A `pause` event while the tab is visible is answered with
 * `play()`; `ended` (a browser that ignores `loop`) restarts it; a media
 * error, or a clip that has not advanced for eight seconds, reloads the
 * element and plays again, with the animated stand-in showing until the film
 * is back. A two-second check backs all of that up. Same element, always.
 */
export default function VideoBackdrop() {
  const video = useRef<HTMLVideoElement>(null)
  /** Set by the effect; the <video>'s onError calls it. */
  const recoverRef = useRef<() => void>(() => {})
  const [ready, setReady] = useState(false)
  /** The browser has refused to play the video (policy, or no playable source). */
  const [refused, setRefused] = useState(false)
  const reduced = usePrefersReducedMotion()

  /** Chosen once — see the header note on why this must not track resizes. */
  const [source] = useState(() =>
    typeof window !== 'undefined' &&
    window.matchMedia(`(max-width: ${HERO.video.mobileMaxWidth}px)`).matches
      ? HERO.video.mobile
      : HERO.video.desktop,
  )

  useEffect(() => {
    const el = video.current
    if (!el || reduced) return

    // Muted must be true on the element ITSELF before play(). React sets the
    // `muted` property but never writes the attribute, and Safari's autoplay
    // policy reads the attribute — `defaultMuted` is what writes it.
    el.muted = true
    el.defaultMuted = true
    el.setAttribute('muted', '')
    // Inline playback for the old Android WebViews (UC, WeChat, QQ) and
    // iOS 9 that predate the standard attribute. Harmless everywhere else.
    el.setAttribute('webkit-playsinline', '')
    el.setAttribute('x5-playsinline', '')

    const tryPlay = () => el.play()
    // A refusal here is the browser's policy talking (NotAllowedError), or a
    // source it cannot play (NotSupportedError). Either way: the animation.
    tryPlay().catch(() => setRefused(true))

    /*
     * If autoplay was refused, the first real gesture is permission enough.
     * Only events that count as user activation are listened for — a
     * `touchstart` or a touch's `pointerdown` does NOT count, and a retry on
     * one of those would be refused again. Stays armed until playback has
     * actually started, so a refused retry is not the last word.
     */
    const retry = () => {
      if (!el.paused) return remove()
      tryPlay().then(remove).catch(() => {})
    }
    const remove = () => {
      window.removeEventListener('pointerup', retry)
      window.removeEventListener('touchend', retry)
      window.removeEventListener('click', retry)
      window.removeEventListener('keydown', retry)
    }
    window.addEventListener('pointerup', retry, { passive: true })
    window.addEventListener('touchend', retry, { passive: true })
    window.addEventListener('click', retry, { passive: true })
    window.addEventListener('keydown', retry)

    // A hidden tab pauses; coming back resumes. Not scroll-related.
    const onVisibility = () => {
      if (document.visibilityState === 'visible') tryPlay().catch(() => {})
      else el.pause()
    }
    document.addEventListener('visibilitychange', onVisibility)

    // ---- the keeper ----
    const visible = () => document.visibilityState === 'visible'
    let recoveries = 0
    let lastTime = -1
    let stuckFor = 0
    const recover = () => {
      if (!visible() || recoveries >= 8) return
      recoveries++
      // Hide the frozen frame; the animated stand-in shows until `playing`.
      setReady(false)
      setRefused(true)
      try {
        el.load()
      } catch {
        /* a load() that throws is a browser without media at all */
      }
      tryPlay().catch(() => {})
    }
    recoverRef.current = recover
    // Paused by anything but a hidden tab: carry on.
    const onPause = () => {
      if (visible() && !el.ended) tryPlay().catch(() => {})
    }
    // A browser that ignores `loop`: start again.
    const onEnded = () => {
      el.currentTime = 0
      tryPlay().catch(() => {})
    }
    el.addEventListener('pause', onPause)
    el.addEventListener('ended', onEnded)
    // Every two seconds: paused → play; not advancing for eight → reload.
    const tick = window.setInterval(() => {
      if (!visible()) return
      if (el.paused) {
        tryPlay().catch(() => {})
        return
      }
      if (el.currentTime === lastTime) {
        stuckFor += 2
        if (stuckFor >= 8) {
          stuckFor = 0
          recover()
        }
      } else {
        stuckFor = 0
      }
      lastTime = el.currentTime
    }, 2000)

    return () => {
      remove()
      document.removeEventListener('visibilitychange', onVisibility)
      el.removeEventListener('pause', onPause)
      el.removeEventListener('ended', onEnded)
      window.clearInterval(tick)
    }
  }, [reduced])

  return (
    <div className="backdrop" aria-hidden="true">
      <img
        className="backdrop__poster"
        src={source.poster}
        alt=""
        decoding="async"
        // @ts-expect-error — valid HTML attribute, not yet in React's typings.
        fetchpriority="high"
      />

      {/*
        Only when the browser has refused the video. An animated image plays
        under any policy, and it is the same film. Removed the moment the
        real video reports `playing`.
      */}
      {refused && !ready && (
        <picture className="backdrop__anim">
          <source type="image/avif" srcSet={source.anim.avif} />
          <img src={source.anim.webp} alt="" decoding="async" />
        </picture>
      )}

      {!reduced && (
        <video
          className={`backdrop__video${ready ? ' is-ready' : ''}`}
          ref={video}
          poster={source.poster}
          muted
          playsInline
          autoPlay
          loop
          preload="auto"
          disablePictureInPicture
          disableRemotePlayback
          tabIndex={-1}
          controls={false}
          // `ready` flips exactly once — the fade from the poster — and never
          // again. Only on `playing`: a video that has loaded but was refused
          // autoplay must stay invisible, or the browser paints a play glyph.
          onPlaying={() => {
            setReady(true)
            setRefused(false)
          }}
          // A media error at any point: the animation stands in, and the
          // keeper reloads the element and plays again.
          onError={() => recoverRef.current()}
        >
          {/*
            H.264 FIRST. Every laptop and phone made in the last decade decodes
            H.264 in hardware; VP9 hardware decoding only arrived on Intel in
            2017 (Kaby Lake) and is still missing on many machines, where the
            WebM is decoded on the CPU — a 1080p30 stream that takes a core to
            itself and makes the whole page stutter. The MP4 is 2 MB larger;
            the decode is free. The WebM stays as the fallback for a browser
            without H.264 (some Linux builds), with its codec named so nothing
            tries it by mistake.
          */}
          <source src={source.mp4} type="video/mp4" />
          {'webm' in source && <source src={source.webm} type='video/webm; codecs="vp9"' />}
        </video>
      )}

      {/*
        The global grade: a band at the top for the navigation, a wide vignette,
        and a very light overall veil. Enough to give the page something to sit
        on; never enough to hide the room.
      */}
      <div className="backdrop__grade" />
    </div>
  )
}
