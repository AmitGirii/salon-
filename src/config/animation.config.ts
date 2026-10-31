/**
 * ANIMATION CONFIGURATION
 * ---------------------------------------------------------------------------
 * Timings and easings for the whole experience, in one place. Durations are
 * seconds. Easings are GSAP easing strings.
 *
 * House rule: motion is slow and heavy rather than bouncy. Nothing overshoots.
 */

export const ANIM = {
  /** Opening curtain-raise once the 3D scene reports ready. */
  intro: {
    overlayFade: 0.9,
    wordmarkStagger: 0.11,
    wordmarkDuration: 1.15,
    taglineDelay: 0.55,
    ease: 'power3.out',
  },

  /**
   * The opening title sequence — the salon's own logo film, with the wordmark
   * struck in one word at a time.
   *
   * Beats are absolute seconds from the moment the card mounts, so the whole
   * sequence reads as a storyboard rather than as a chain of relative delays:
   *
   *     0.00  black — the house lights are already down
   *     0.15  the badge film blooms out of the dark
   *     0.45  CUT
   *     1.25  N
   *     2.05  CURL
   *     2.35  hairline rule draws
   *     2.55  tagline
   *     3.25  the card pushes forward and dissolves into the salon
   *     4.00  gone
   *
   * FOUR SECONDS, DOOR TO DOOR, AND IT MUST FEEL SLOW.
   *
   * Those two goals fight, and the thing that decides the fight is the STAGGER,
   * not the duration. An earlier cut ran the words 1.3s each but only 0.40s
   * apart — each word was barely a third resolved when the next began, so all
   * three arrived as one event and the sequence read as fast no matter how long
   * the individual tweens were.
   *
   * The gap is now 0.80s against a 1.05s reveal. Each word gets the stage
   * almost to itself, and you read *Cut … N … Curl* as three deliberate beats.
   * The reveal itself is slightly shorter than before; the perceived pace comes
   * from the space between the words, not from how long each one takes.
   *
   * Everything lands before `hold`: the last word settles at 3.10, the rule at
   * 2.90 and the tagline at 3.10. That matters — the exit kills the animations
   * outright (`is-leaving` sets `animation: none`), so anything still running
   * would snap rather than land.
   *
   * The source film is 6.4s and is deliberately cut off mid-turn: the badge is
   * still rotating as the card leaves, so it never sits on a frozen frame.
   */
  theatre: {
    /* Long enough to read as lights-down, short enough not to feel stalled. */
    filmIn: 0.15,
    filmDuration: 1.0,
    /**
     * Cut · N · Curl, struck one at a time.
     *
     * The 0.80s gap between them is the whole reason the sequence reads as
     * slow. Tighten it and the words merge into a single arrival, however long
     * `wordDuration` is.
     */
    words: [0.45, 1.25, 2.05] as const,
    wordDuration: 1.05,
    rule: 2.35,
    tagline: 2.55,
    /** When the exit begins, and how long it takes. Visible total: ~4.0s. */
    hold: 3.25,
    exit: 0.7,
    /** Cut short for anyone who has asked for less motion. */
    reducedHold: 1.5,
    /*
     * No easing here on purpose: the card is animated entirely in CSS so that
     * nothing runs per frame on the main thread, and its easing lives with the
     * keyframes as `--ease-cine`. These values are handed to the stylesheet as
     * custom properties by `IntroTheatre`.
     */
  },

  /** "Explore the salon" — hero overlay out, camera in. */
  explore: {
    overlayOut: 0.6,
    cameraFly: 2.6,
    ease: 'power2.inOut',
  },

  /** Scroll-driven camera moves between sections. */
  scroll: {
    /** Seconds the camera takes to settle into a new section's pose. */
    cameraSettle: 1.9,
    ease: 'power2.inOut',
    /** Content reveal. */
    revealDuration: 0.85,
    revealStagger: 0.075,
    revealDistance: 26,
    /** ScrollTrigger start position for section reveals. */
    start: 'top 72%',
  },

  /** Manual camera-mode switch from the on-screen switcher. */
  modeSwitch: { duration: 1.5, ease: 'power2.inOut' },

  /** Damping applied to the camera every frame (higher = snappier). */
  cameraDamping: 2.6,

  /** UI micro-interactions. */
  ui: {
    hover: 0.28,
    navFade: 0.45,
    panelIn: 0.7,
    ease: 'power2.out',
  },

  /** Ken Burns drift on the static fallback experience. */
  fallback: { duration: 18, scale: 1.12 },
} as const
