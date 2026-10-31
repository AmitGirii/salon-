/**
 * Locks the page behind an overlay — the title card, the menu drawer, the
 * gallery lightbox.
 *
 * `body { overflow: hidden }` is enough for every desktop browser and for
 * Chrome and Samsung Internet on Android. iOS Safari ignores it once its
 * toolbar has collapsed, and lets a finger scroll the page underneath the
 * overlay. The one thing WebKit has always honoured is a cancelled
 * `touchmove`, so while the lock is held every touch pan is cancelled unless
 * it starts inside an element marked `data-scroll-ok` — the drawer's own
 * list, which must still scroll on a short phone.
 *
 * Deliberately NOT the `position: fixed` body technique: that resets
 * `scrollY` to 0 for the duration, which fires every ScrollTrigger's
 * onLeaveBack and sends the 3D camera flying to the hero pose behind the
 * overlay, then back again when it closes.
 *
 * Refcounted, so nested overlays (the lightbox over a locked page) release
 * cleanly in any order. Returns the unlock function.
 */
let holders = 0
let previousOverflow = ''

function onTouchMove(e: TouchEvent) {
  const target = e.target as Element | null
  if (target?.closest?.('[data-scroll-ok]')) return
  if (e.cancelable) e.preventDefault()
}

export function lockScroll(): () => void {
  if (typeof document === 'undefined') return () => {}
  if (holders === 0) {
    previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    document.addEventListener('touchmove', onTouchMove, { passive: false })
  }
  holders++
  let released = false
  return () => {
    if (released) return
    released = true
    holders--
    if (holders === 0) {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('touchmove', onTouchMove)
    }
  }
}
