import { useEffect, useState } from 'react'
import { CONTACT, NAV_LINKS, type SectionId } from '@/config/site.config'
import { setExperience, useExperience } from '@/hooks/useExperienceStore'
import Logo from '@/components/ui/Logo'
import Button from '@/components/ui/Button'
import { lockScroll } from '@/utils/scrollLock'

/**
 * Floating navigation.
 *
 * Over the film it is transparent with ivory type and a soft shadow, sitting
 * in the film's own top gradient; once the visitor has scrolled most of the
 * hero away it settles onto the glass bar. The opening frame of the salon is
 * never boxed in by chrome. The active link tracks the section in view.
 */
export default function Navbar() {
  const activeSection = useExperience((s) => s.activeSection)
  const navOpen = useExperience((s) => s.navOpen)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // Light type over the film, then the glass bar once the film is mostly gone.
    const onScroll = () => setScrolled(window.scrollY > window.innerHeight * 0.6)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the mobile drawer on Escape, and lock the page behind it.
  useEffect(() => {
    if (!navOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExperience({ navOpen: false })
    }
    const unlock = lockScroll()
    window.addEventListener('keydown', onKey)
    return () => {
      unlock()
      window.removeEventListener('keydown', onKey)
    }
  }, [navOpen])

  const go = (id: SectionId) => (e: React.MouseEvent) => {
    e.preventDefault()
    setExperience({ navOpen: false })
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <header
      className={`nav${scrolled ? ' is-scrolled' : ' is-over-hero'}${navOpen ? ' is-open' : ''}${
        scrolled && activeSection === 'gallery' ? ' is-dark' : ''
      }`}
    >
      <a className="nav__brand" href="#hero" onClick={go('hero')} aria-label="Cut N Curl — home">
        <Logo size="sm" badge />
      </a>

      <nav className="nav__links" aria-label="Primary">
        {NAV_LINKS.map((l) => (
          <a
            key={l.id}
            href={`#${l.id}`}
            onClick={go(l.id)}
            className={`nav__link${activeSection === l.id ? ' is-active' : ''}`}
            aria-current={activeSection === l.id ? 'true' : undefined}
          >
            {l.label}
          </a>
        ))}
      </nav>

      <div className="nav__actions">
        <Button variant="outline" onClick={() => document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' })}>
          Book
        </Button>
        <button
          type="button"
          className="nav__toggle"
          aria-expanded={navOpen}
          aria-controls="nav-drawer"
          onClick={() => setExperience({ navOpen: !navOpen })}
        >
          <span className="visually-hidden">{navOpen ? 'Close menu' : 'Open menu'}</span>
          <span className="nav__bars" aria-hidden="true">
            <i />
            <i />
          </span>
        </button>
      </div>

      {/*
        Mobile drawer.

        Tapping the panel itself closes it — the links stop the event by
        navigating, so only the empty surface around them acts as a backdrop.
      */}
      <div
        className="nav__drawer"
        id="nav-drawer"
        hidden={!navOpen}
        onClick={(e) => {
          if (e.target === e.currentTarget) setExperience({ navOpen: false })
        }}
      >
        <nav aria-label="Primary, mobile" data-scroll-ok>
          {NAV_LINKS.map((l, i) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={go(l.id)}
              className={`nav__drawer-link${activeSection === l.id ? ' is-active' : ''}`}
              aria-current={activeSection === l.id ? 'true' : undefined}
              /* Drives the staggered entrance; see `nav-item-in`. */
              style={{ ['--i' as string]: i }}
            >
              {l.label}
            </a>
          ))}

          {/* The desktop Book button is hidden at this width, so the CTA lives
              here instead. Same section, no new route. */}
          <a className="nav__drawer-cta" href="#booking" onClick={go('booking')}>
            Book an appointment
          </a>

          <p className="nav__drawer-foot">
            <a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>{CONTACT.phone}</a>
            <br />
            {CONTACT.hoursSummary}
          </p>
        </nav>
      </div>
    </header>
  )
}
