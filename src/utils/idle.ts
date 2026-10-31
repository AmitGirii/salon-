/**
 * Runs work in the browser's next idle moment — and never mid-scroll.
 *
 * `requestIdleCallback` where it exists (everything but Safari), with a
 * timeout so the work is never postponed indefinitely on a busy page; a short
 * timer elsewhere. Returns a cancel function, so it can be the body of a
 * `useEffect`.
 *
 * Scrolling is handled by the compositor, so the main thread is often "idle"
 * while the visitor is actively flicking through the page — exactly the
 * moment a burst of work would be felt, as reveals and the header stalling.
 * So the callback waits until the page has been still for a moment.
 */
let lastScroll = 0
if (typeof window !== 'undefined') {
  window.addEventListener('scroll', () => (lastScroll = performance.now()), { passive: true })
}

const QUIET_MS = 350
/** The longest a single piece of work will wait for the page to go still. */
const MAX_WAIT_MS = 5000

/** True while the page is being scrolled (or was, a moment ago). */
export const scrolledRecently = () => performance.now() - lastScroll < QUIET_MS

export function idle(fn: () => void, timeout = 4000): () => void {
  const w = window as Window & { requestIdleCallback?: typeof requestIdleCallback }
  let cancel = () => {}
  const started = performance.now()

  const schedule = () => {
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(attempt, { timeout })
      cancel = () => w.cancelIdleCallback(id)
    } else {
      const id = w.setTimeout(attempt, 250)
      cancel = () => w.clearTimeout(id)
    }
  }
  const attempt = () => {
    const scrolling = performance.now() - lastScroll < QUIET_MS
    // Prefer a still page — but not for ever. A visitor who never stops
    // scrolling must not starve the work: on a phone that left the 3D room
    // waiting behind its photograph indefinitely. After MAX_WAIT_MS it runs.
    if (scrolling && performance.now() - started < MAX_WAIT_MS) {
      const id = w.setTimeout(schedule, QUIET_MS)
      cancel = () => w.clearTimeout(id)
      return
    }
    fn()
  }

  schedule()
  return () => cancel()
}
