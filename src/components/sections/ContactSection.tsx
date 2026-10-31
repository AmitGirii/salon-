import { BRAND, CONTACT } from '@/config/site.config'
import { formatSlot, nowMinutes, toMinutes, WEEKDAY_NAMES } from '@/utils/dates'
import Logo from '@/components/ui/Logo'
import SocialLink from '@/components/ui/SocialLink'

/** Live open/closed state, from the hours in site.config. */
function openState() {
  const today = WEEKDAY_NAMES[new Date().getDay()]
  const hours = CONTACT.hours.find((h) => h.day === today)
  if (!hours?.open || !hours.close) return { open: false, today, label: `Closed on ${today}` }

  const now = nowMinutes()
  const from = toMinutes(hours.open)
  const to = toMinutes(hours.close)

  if (now < from) return { open: false, today, label: `Opens at ${formatSlot(from)}` }
  if (now >= to) return { open: false, today, label: `Opens ${formatSlot(from)} tomorrow` }
  return { open: true, today, label: `Open now until ${formatSlot(to)}` }
}

/**
 * Contact, hours and the map.
 *
 * The salon keeps the same hours every day, so a seven-row table would repeat
 * one line seven times. Instead this states the schedule once and shows what a
 * visitor actually wants to know — whether the doors are open right now. The
 * per-day table only appears if the hours ever stop being uniform.
 *
 * The map is Google's keyless embed — no API key to leak or expire.
 */
export default function ContactSection() {
  const status = openState()
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(CONTACT.mapQuery)}&z=15&output=embed`

  const openDays = CONTACT.hours.filter((h) => h.open && h.close)
  const uniform =
    openDays.length === CONTACT.hours.length &&
    openDays.every((h) => h.open === openDays[0].open && h.close === openDays[0].close)
  const span = uniform ? `${formatSlot(toMinutes(openDays[0].open!))} – ${formatSlot(toMinutes(openDays[0].close!))}` : ''

  const telHref = `tel:+${CONTACT.whatsapp}`
  const waHref = `https://wa.me/${CONTACT.whatsapp}`

  return (
    <div className="contact">
      <div className="panel contact__panel">
        <p className="label" data-reveal>
          Visit
        </p>
        <h2 className="display contact__title" data-reveal>
          Come and see it
          <em> in person</em>
        </h2>

        <p className={`contact__status${status.open ? ' is-open' : ''}`} data-reveal>
          <span className="contact__dot" aria-hidden="true" />
          {status.label}
        </p>

        <address className="contact__address" data-reveal>
          {CONTACT.addressLines.map((line) => (
            <span key={line}>{line}</span>
          ))}
        </address>

        <ul className="contact__links" data-reveal>
          <li>
            <a href={telHref}>{CONTACT.phone}</a>
          </li>
          <li>
            <a href={waHref} target="_blank" rel="noopener noreferrer">
              WhatsApp us
            </a>
          </li>
          <li>
            <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          </li>
        </ul>

        <div data-reveal>
          <SocialLink />
        </div>

        {uniform ? (
          <div className="contact__hours-block" data-reveal>
            <p className="label">Opening hours</p>
            <p className="contact__hours-span">{span}</p>
            <p className="contact__hours-days">Every day, all seven days of the week</p>
          </div>
        ) : (
          <table className="contact__hours" data-reveal>
            <caption className="label">Opening hours</caption>
            <tbody>
              {CONTACT.hours.map((h) => (
                <tr key={h.day} className={h.day === status.today ? 'is-today' : undefined}>
                  <th scope="row">{h.day}</th>
                  <td>{h.open && h.close ? `${h.open} – ${h.close}` : 'Closed'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="contact__map" data-reveal>
        <iframe
          title={`Map to ${BRAND.name}, Model Town, Rewari`}
          src={mapSrc}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <footer className="panel panel--sheet contact__footer" data-reveal>
        <Logo size="md" badge withTagline />
        <SocialLink variant="inline" />
        <p className="contact__colophon">
          {BRAND.descriptor} · Est. {BRAND.established} · Rewari, Haryana
        </p>
        <p className="contact__fine">
          © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
