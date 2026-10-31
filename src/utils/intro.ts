/**
 * Whether the opening title sequence runs on this load.
 *
 * It plays on every arrival — the salon wants its logo film in front of
 * everyone, refresh included — with two exceptions:
 *
 * - `?intro=0` turns it off (what the test suites use), and `?intro=1` forces
 *   it on regardless of anything below.
 * - A deep link with a hash (`/#booking`) goes straight to that section.
 *   Arriving at a section is a request for the section, not for a film.
 *
 * Under it, the salon film (VideoBackdrop) is already playing, so when the
 * card dissolves the room is simply there — no second load, no black gap.
 *
 * Memoised so every caller gets one stable answer per page load: the card
 * itself, App (which mounts it), and the experience store (whose `introDone`
 * seeds the scroll wiring) must never disagree.
 */
function decide(): boolean {
  if (typeof window === 'undefined') return false
  const flag = new URLSearchParams(window.location.search).get('intro')
  if (flag === '1') return true
  if (flag === '0') return false
  return window.location.hash.length < 2
}

let decision: boolean | null = null

export function introWillPlay(): boolean {
  if (decision === null) decision = decide()
  return decision
}
