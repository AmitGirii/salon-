import { CONTACT } from '@/config/site.config'

/**
 * The Instagram link.
 *
 * A salon's feed is its portfolio, so this is given a real invitation and the
 * handle rather than being buried as the word "Instagram" in a list. The glyph
 * is inline SVG — one more network request for a 2 kB icon font would be a
 * poor trade for a single mark.
 */
export default function SocialLink({ variant = 'card' }: { variant?: 'card' | 'inline' }) {
  if (!/instagram\.com\/.+/.test(CONTACT.instagram)) return null

  const icon = (
    <svg className="social__glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  )

  if (variant === 'inline') {
    return (
      <a className="social social--inline" href={CONTACT.instagram} target="_blank" rel="noopener noreferrer">
        {icon}
        <span>{CONTACT.instagramHandle}</span>
      </a>
    )
  }

  return (
    <a className="social social--card" href={CONTACT.instagram} target="_blank" rel="noopener noreferrer">
      {icon}
      <span className="social__body">
        <span className="social__label label">See our work</span>
        <span className="social__handle">{CONTACT.instagramHandle}</span>
      </span>
      <span className="social__arrow" aria-hidden="true">
        →
      </span>
    </a>
  )
}
