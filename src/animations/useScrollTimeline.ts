import { useEffect, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { SectionId } from '@/config/site.config'
import { followScroll, getExperience, setActiveSection, useExperience } from '@/hooks/useExperienceStore'

gsap.registerPlugin(ScrollTrigger)

/*
 * A phone's address bar collapses and expands as the page scrolls, and each
 * time it does the viewport height changes and a `resize` event fires. Left
 * to itself ScrollTrigger treats that as a layout change and re-measures every
 * trigger — a forced layout of the whole page, in the middle of a scroll
 * gesture, over and over. `ignoreMobileResize` makes it ignore height-only
 * changes on touch devices; a rotation still refreshes.
 */
ScrollTrigger.config({ ignoreMobileResize: true })

/**
 * Ties a page section to the 3D camera.
 *
 * Each section owns a camera pose (see `SECTION_CAMERA`). As it scrolls into
 * view it becomes the active section, and the camera flies to that pose.
 *
 * Reaching a genuinely NEW section also hands the camera back to the story,
 * ending any view the visitor had picked from the switcher. Same-section
 * re-fires are ignored, so nudging the scroll around a trigger boundary can
 * never snatch a chosen view away.
 */
export function useSectionTrigger(ref: RefObject<HTMLElement>, id: SectionId) {
  // Held back while the title card is up — see `introDone`.
  const ready = useExperience((s) => s.introDone)

  useEffect(() => {
    const el = ref.current
    if (!el || !ready) return

    const activate = () => {
      if (getExperience().activeSection === id) return
      setActiveSection(id)
      followScroll()
    }

    /*
     * Created in a microtask, not inline. Every section's effects run in the
     * same commit, and each one writes styles (the reveal arming) — so a
     * trigger created inline here measures the page, the next section
     * dirties it, the next trigger measures it again: eight layouts for eight
     * sections. A microtask runs after the whole commit, so all eight are
     * measured against one settled layout.
     */
    let trigger: ScrollTrigger | null = null
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      trigger = ScrollTrigger.create({
        trigger: el,
        start: 'top 55%',
        end: 'bottom 45%',
        onEnter: activate,
        onEnterBack: activate,
      })
    })

    return () => {
      cancelled = true
      trigger?.kill()
    }
  }, [ref, id, ready])
}

/**
 * Reveals a section's content as it enters the viewport.
 *
 * Elements opt in with `data-reveal`; they stagger in document order. The
 * resting state is defined in CSS so content is visible even if this never
 * runs — nothing here is load-bearing for readability.
 *
 * DELIBERATELY NOT A SCROLLTRIGGER TWEEN. It used to be one, and that cost
 * more than it looked: every ScrollTrigger refresh (on load, after the title
 * card, on every resize) reverts each `from()` tween to measure the page
 * without its transforms, then re-applies it — a style write between every
 * pair of measurements, so each of the sixteen triggers forced its own full
 * layout. On a phone that was over a second of blocked main thread at load
 * and again whenever the address bar moved. Now the browser's own
 * IntersectionObserver fires once per section and the motion is a CSS
 * transition on opacity and transform, which the compositor runs without
 * touching layout at all. ScrollTrigger is left with the eight section
 * triggers that drive the camera, which write nothing and are cheap to
 * refresh.
 */
export function useReveal(ref: RefObject<HTMLElement>, enabled = true) {
  const ready = useExperience((s) => s.introDone)

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled || !ready) return

    const targets = Array.from(el.querySelectorAll<HTMLElement>('[data-reveal]'))
    if (!targets.length) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // Arm: hidden, each with its place in the stagger (see `.reveal-pending`).
    targets.forEach((t, i) => {
      t.style.setProperty('--reveal-i', String(i))
      t.classList.add('reveal-pending')
    })

    // `ANIM.scroll.start` is "top 72%": the section's top crossing 72% of the
    // viewport. Shrinking the root by 28% at the bottom is the same line.
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        targets.forEach((t) => t.classList.add('is-revealed'))
      },
      { rootMargin: '0px 0px -28% 0px' },
    )
    io.observe(el)

    return () => {
      io.disconnect()
      targets.forEach((t) => {
        t.classList.remove('reveal-pending', 'is-revealed')
        t.style.removeProperty('--reveal-i')
      })
    }
  }, [ref, enabled, ready])
}

/** Recomputes trigger positions — call after layout-changing events. */
export function refreshScrollTriggers() {
  ScrollTrigger.refresh()
}
