import { useEffect } from 'react'
import Navbar from '@/components/navigation/Navbar'
import VideoBackdrop from '@/components/ui/VideoBackdrop'
import IntroTheatre from '@/components/ui/IntroTheatre'
import HomePage from '@/pages/HomePage'
import { setExperience } from '@/hooks/useExperienceStore'
import { refreshScrollTriggers } from '@/animations/useScrollTimeline'
import { introWillPlay } from '@/utils/intro'

/**
 * The shell.
 *
 * Deliberately thin. The salon's own film is the ENVIRONMENT: one fixed video
 * element, mounted here once and never again, behind the whole page. Every
 * section scrolls over it; nothing about scrolling reaches it. The 3D room is
 * a viewer inside "The Salon" and mounts itself when it is needed. Nothing
 * plays in front of the page on the way in — the first thing on screen is the
 * salon.
 *
 * The opening title card plays on every arrival (`?intro=0` skips it; a hash
 * deep link goes straight to its section) — see `utils/intro.ts`. The film
 * underneath starts at the same moment, so the card dissolves onto a room
 * that is already moving.
 */
export default function App() {
  const intro = introWillPlay()

  // No curtain, no warm-up gate: the poster is the loading state and the
  // scroll wiring can be built immediately against real layout.
  useEffect(() => {
    if (!intro) setExperience({ phase: 'intro', progress: 1, introDone: true })
  }, [intro])

  // Section heights depend on fonts and images; re-measure once both settle.
  useEffect(() => {
    const refresh = () => {
      if (document.body.classList.contains('is-theatre')) return
      refreshScrollTriggers()
    }
    window.addEventListener('load', refresh)
    // The fonts are self-hosted and preloaded, so this normally resolves
    // before the first layout and costs nothing; it is here for the visit
    // where a font file is slow. (There used to be two fixed timers as well.
    // Each refresh is a measurement of every trigger, and on a phone the two
    // of them showed up as the longest tasks after load — gone.)
    document.fonts?.ready.then(refresh).catch(() => {})
    return () => {
      window.removeEventListener('load', refresh)
    }
  }, [])

  return (
    <div className="app">
      <a className="skip-link" href="#story">
        Skip to content
      </a>

      {/* Layer 0+1: the film and its grade. Mounted once, for the session. */}
      <VideoBackdrop />

      <Navbar />
      <HomePage />

      {intro && (
        <IntroTheatre onFinished={() => setExperience({ phase: 'intro', progress: 1, introDone: true })} />
      )}
    </div>
  )
}
