import { BRAND, HERO } from '@/config/site.config'
import Button from '@/components/ui/Button'
import Logo from '@/components/ui/Logo'

/**
 * The opening frame: one screen of nothing but the film (which lives behind
 * the whole page — see VideoBackdrop) and as little type as a landing page
 * can get away with.
 *
 * The name, a label beneath it, one headline, one line, one call to action. Everything
 * sits low and left so the room — the mirrors, the ceiling, the marble — keeps
 * the centre of the frame to itself. The section owns a local scrim for its
 * type; the film itself is untouched.
 */
export default function HeroSection() {
  const [line1, line2] = HERO.headline

  return (
    <>
      <div className="hero__type">
        <h1 className="hero__name" data-reveal>
          <Logo size="md" />
          <span className="visually-hidden"> — {BRAND.tagline}</span>
        </h1>

        {/* Where and what, set small beneath the name like a letterhead. */}
        <p className="hero__label" data-reveal>
          {HERO.label}
        </p>

        <p className="hero__headline display" data-reveal>
          {line1}
          <br />
          <em>{line2}</em>
        </p>

        <p className="hero__sub" data-reveal>
          {HERO.sub}
        </p>

        <div className="hero__cta" data-reveal>
          <Button href="#booking">{HERO.cta}</Button>
        </div>
      </div>

      <a className="hero__scroll" href="#story" aria-label="Scroll to our story">
        <span>Scroll</span>
        <span className="hero__scroll-line" aria-hidden="true" />
      </a>
    </>
  )
}
