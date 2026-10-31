import { BRAND } from '@/config/site.config'

/**
 * The brand lockup.
 *
 * Two marks exist and both are the salon's own: the circular badge
 * ("Cut 'N' Curl · Makeup | Nails | Hair") and the typographic wordmark from
 * the salon's brand film. The badge carries the identity at a glance; the
 * wordmark carries it at a distance. `badge` chooses whether to show both.
 *
 * The wordmark sets the middle "N" smaller and lighter, matching the
 * proportions of the salon's own lockup rather than shipping a raster of it.
 */
export default function Logo({
  size = 'md',
  badge = false,
  withTagline = false,
  wordmark = true,
}: {
  size?: 'sm' | 'md' | 'lg'
  /** Show the circular badge alongside (or instead of) the wordmark. */
  badge?: boolean
  withTagline?: boolean
  wordmark?: boolean
}) {
  const [first, middle, last] = BRAND.wordmark

  return (
    <span className={`logo logo--${size}${badge ? ' logo--badged' : ''}`}>
      {badge && (
        <img
          className="logo__badge"
          src={size === 'lg' ? BRAND.logo.badge : BRAND.logo.badgeSmall}
          alt={size === 'lg' || !wordmark ? `${BRAND.name} — ${BRAND.descriptor}` : ''}
          aria-hidden={wordmark && size !== 'lg' ? true : undefined}
          width={size === 'lg' ? 512 : 160}
          height={size === 'lg' ? 512 : 160}
          decoding="async"
        />
      )}

      {wordmark && (
        <span className="logo__text">
          <span className="logo__mark display">
            <span>{first}</span>
            <span className="logo__n">{middle}</span>
            <span>{last}</span>
          </span>
          {withTagline && <span className="logo__tagline">{BRAND.tagline}</span>}
        </span>
      )}
    </span>
  )
}
