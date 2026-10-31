import { useMemo, useRef, useState } from 'react'
import { CONTACT, SERVICE_CATEGORIES, TEAM } from '@/config/site.config'
import { leadPrice } from '@/utils/format'
import { formatLong, formatSlot, nowMinutes, toMinutes, todayISO, weekdayName } from '@/utils/dates'
import Button from '@/components/ui/Button'
import DatePicker from '@/components/ui/DatePicker'

type FieldName = 'name' | 'phone' | 'service' | 'date' | 'time'
type Errors = Partial<Record<FieldName, string>>

/** Nobody can be in the chair in ten minutes — ask for an hour's notice. */
const LEAD_TIME_MINUTES = 60
/** Shortest sensible appointment, so the last slot of the day can finish. */
const MIN_APPOINTMENT_MINUTES = 45

/** Bookable half-hour slots for a date, respecting opening hours and lead time. */
function slotsFor(iso: string): string[] {
  if (!iso) return []
  const hours = CONTACT.hours.find((h) => h.day === weekdayName(iso))
  if (!hours?.open || !hours.close) return []

  const last = toMinutes(hours.close) - MIN_APPOINTMENT_MINUTES
  // Today's slots that have already gone — or are about to — are not offers.
  const earliest =
    iso === todayISO()
      ? Math.max(toMinutes(hours.open), nowMinutes() + LEAD_TIME_MINUTES)
      : toMinutes(hours.open)
  const first = Math.ceil(earliest / 30) * 30 // round up to the next half hour

  const out: string[] = []
  for (let m = first; m <= last; m += 30) out.push(formatSlot(m))
  return out
}

/** Why this date cannot be booked, or null if it can. */
function dayBlockedReason(iso: string): string | null {
  const day = weekdayName(iso)
  const hours = CONTACT.hours.find((h) => h.day === day)
  if (!hours?.open || !hours.close) return `Closed on ${day}`
  if (iso === todayISO() && slotsFor(iso).length === 0) return 'No slots left today'
  return null
}

/**
 * Booking.
 *
 * There is no backend behind this site, and inventing one would be worse than
 * useless — so the form does what the salon actually uses: it validates the
 * request, then hands a fully-composed message to WhatsApp, with an email
 * fallback for anyone without it.
 *
 * Three things the browser's own controls got wrong, and this fixes:
 *   • `<input type="date">` renders as `mm/dd/yyyy` in most browsers whatever
 *     the page language, and cannot grey out days the salon is shut. Replaced
 *     by `DatePicker`.
 *   • A dropdown of 135 services is unusable. Choosing a category first cuts
 *     it to a readable list.
 *   • Times are tappable slots generated from the real opening hours, and
 *     today's already-passed slots are removed rather than accepted and then
 *     quietly declined by the salon.
 */
export default function BookingSection() {
  const [form, setForm] = useState({
    category: SERVICE_CATEGORIES[0].id,
    name: '',
    phone: '',
    service: '',
    stylist: '',
    date: '',
    time: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Errors>({})
  const [sent, setSent] = useState<'whatsapp' | 'email' | null>(null)

  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const serviceRef = useRef<HTMLSelectElement>(null)
  const dateRef = useRef<HTMLDivElement>(null)
  const timeRef = useRef<HTMLDivElement>(null)

  const category = SERVICE_CATEGORIES.find((c) => c.id === form.category) ?? SERVICE_CATEGORIES[0]
  const slots = useMemo(() => slotsFor(form.date), [form.date])
  const dateBlocked = form.date ? dayBlockedReason(form.date) : null

  const contactReady = /^\d{10,15}$/.test(CONTACT.whatsapp) && !/^0+$/.test(CONTACT.whatsapp.slice(2))
  // Bookable people only: not the front of house, and not the founder.
  const stylists = TEAM.filter((t) => t.role !== 'Management' && t.role !== 'Founder')

  const update = (patch: Partial<typeof form>, clear: FieldName[] = []) => {
    setForm((f) => ({ ...f, ...patch }))
    if (clear.length) {
      setErrors((e) =>
        Object.fromEntries(Object.entries(e).filter(([k]) => !clear.includes(k as FieldName))),
      )
    }
  }

  /** Phone: digits only, capped at ten — the country code is fixed. */
  const onPhone = (e: React.ChangeEvent<HTMLInputElement>) =>
    update({ phone: e.target.value.replace(/\D/g, '').slice(0, 10) }, ['phone'])

  const validate = (): Errors => {
    const e: Errors = {}
    if (form.name.trim().length < 2) e.name = 'Please tell us your name.'
    if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone = 'Enter a 10-digit mobile number starting 6–9.'
    if (!form.service) e.service = 'Choose a service.'
    if (!form.date) e.date = 'Pick a date.'
    else if (form.date < todayISO()) e.date = 'Please choose today or a later date.'
    else if (dateBlocked) e.date = dateBlocked
    if (!form.time) e.time = 'Choose a time.'
    else if (!slots.includes(form.time)) e.time = 'That time is no longer available.'
    return e
  }

  const message = () =>
    [
      'Hi Cut N Curl, I’d like to book an appointment.',
      '',
      `Name: ${form.name.trim()}`,
      `Phone: +91 ${form.phone}`,
      `Service: ${form.service}`,
      form.stylist ? `Preferred stylist: ${form.stylist}` : '',
      `Date: ${formatLong(form.date)}`,
      `Time: ${form.time}`,
      form.notes.trim() ? `Notes: ${form.notes.trim()}` : '',
    ]
      .filter(Boolean)
      .join('\n')

  const submit = (channel: 'whatsapp' | 'email') => (e: React.FormEvent) => {
    e.preventDefault()
    const found = validate()
    setErrors(found)

    if (Object.keys(found).length) {
      // Focus the first problem directly. Querying the DOM for [aria-invalid]
      // here would read it before React has committed the new state.
      const nodes: Record<FieldName, HTMLElement | null> = {
        name: nameRef.current,
        phone: phoneRef.current,
        service: serviceRef.current,
        date: dateRef.current,
        time: timeRef.current,
      }
      const order: FieldName[] = ['name', 'phone', 'service', 'date', 'time']
      const first = order.find((k) => found[k])
      const node = first ? nodes[first] : null
      if (node) {
        const focusable = node.matches('input, select')
          ? node
          : node.querySelector<HTMLElement>('button, input, select')
        focusable?.focus({ preventScroll: true })
        node.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    const body = message()
    if (channel === 'whatsapp') {
      window.open(
        `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(body)}`,
        '_blank',
        'noopener,noreferrer',
      )
    } else {
      window.location.href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(
        'Appointment request — Cut N Curl',
      )}&body=${encodeURIComponent(body)}`
    }
    setSent(channel)
  }

  const errorId = (k: FieldName) => (errors[k] ? `${k}-error` : undefined)

  /* ------------------------------------------------------------------ done */

  if (sent) {
    return (
      <div className="panel panel--wide booking">
        <div className="booking__done" role="status">
          <span className="booking__tick" aria-hidden="true">
            ✓
          </span>
          <h2 className="display booking__title">Your request is ready</h2>
          <p className="booking__intro">
            {sent === 'whatsapp'
              ? 'We’ve handed your details to WhatsApp — send the message and we’ll confirm your slot.'
              : 'We’ve opened your email app with the details — send it and we’ll confirm your slot.'}
          </p>

          <dl className="booking__summary">
            <div>
              <dt>Service</dt>
              <dd>{form.service}</dd>
            </div>
            <div>
              <dt>When</dt>
              <dd>
                {formatLong(form.date)} · {form.time}
              </dd>
            </div>
            {form.stylist && (
              <div>
                <dt>Stylist</dt>
                <dd>{form.stylist}</dd>
              </div>
            )}
          </dl>

          <p className="booking__note">
            Nothing opened? Call us on <a href={`tel:+${CONTACT.whatsapp}`}>{CONTACT.phone}</a>.
          </p>
          <Button variant="outline" onClick={() => setSent(null)}>
            Make another request
          </Button>
        </div>
      </div>
    )
  }

  /* ------------------------------------------------------------------ form */

  return (
    <div className="panel panel--wide booking">
      <header className="booking__head">
        <p className="label" data-reveal>
          Booking
        </p>
        <h2 className="display booking__title" data-reveal>
          Reserve your chair
        </h2>
        <p className="booking__intro" data-reveal>
          {CONTACT.hoursSummary}. Tell us what you need and when — we’ll confirm on WhatsApp.
        </p>
      </header>

      <form className="booking__form" onSubmit={submit('whatsapp')} noValidate data-reveal>
        <div className="booking__row">
          <label className="field">
            <span className="field__label label">Your name</span>
            <input
              ref={nameRef}
              type="text"
              value={form.name}
              onChange={(e) => update({ name: e.target.value }, ['name'])}
              autoComplete="name"
              placeholder="Your full name"
              aria-invalid={errors.name ? true : undefined}
              aria-describedby={errorId('name')}
            />
            {errors.name && (
              <span className="field__error" id="name-error">
                {errors.name}
              </span>
            )}
          </label>

          <label className="field">
            <span className="field__label label">Mobile</span>
            <span className={`field__phone${errors.phone ? ' is-invalid' : ''}`}>
              <span className="field__prefix">+91</span>
              <input
                ref={phoneRef}
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={onPhone}
                autoComplete="tel-national"
                placeholder="10-digit number"
                maxLength={10}
                aria-invalid={errors.phone ? true : undefined}
                aria-describedby={errorId('phone')}
              />
            </span>
            {errors.phone && (
              <span className="field__error" id="phone-error">
                {errors.phone}
              </span>
            )}
          </label>
        </div>

        {/* Service: choose a category first, so the list stays readable. */}
        <div className="field">
          <span className="field__label label">Service</span>
          <div className="chips" role="group" aria-label="Service category">
            {SERVICE_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`chip${c.id === form.category ? ' is-active' : ''}`}
                aria-pressed={c.id === form.category}
                onClick={() => update({ category: c.id, service: '' }, ['service'])}
              >
                {c.title}
              </button>
            ))}
          </div>
          <select
            ref={serviceRef}
            className="field__select"
            value={form.service}
            onChange={(e) => update({ service: e.target.value }, ['service'])}
            aria-label="Service"
            aria-invalid={errors.service ? true : undefined}
            aria-describedby={errorId('service')}
          >
            <option value="">Choose from {category.title}…</option>
            {category.groups.map((g) => (
              <optgroup key={g.title} label={g.title}>
                {g.services.map((s, i) => {
                  const label = s.note ? `${s.name} (${s.note})` : s.name
                  return (
                    <option key={`${s.name}-${i}`} value={`${category.title} — ${g.title} — ${label}`}>
                      {label} · {leadPrice(s)}
                    </option>
                  )
                })}
              </optgroup>
            ))}
          </select>
          {errors.service && (
            <span className="field__error" id="service-error">
              {errors.service}
            </span>
          )}
        </div>

        <div className="booking__row">
          <div className="field" ref={dateRef}>
            <span className="field__label label">Date</span>
            <DatePicker
              value={form.date}
              onChange={(iso) => update({ date: iso, time: '' }, ['date', 'time'])}
              dayBlockedReason={dayBlockedReason}
              invalid={Boolean(errors.date)}
              describedBy={errorId('date')}
            />
            {errors.date && (
              <span className="field__error" id="date-error">
                {errors.date}
              </span>
            )}
          </div>

          <label className="field">
            <span className="field__label label">
              Stylist <span className="field__optional">optional</span>
            </span>
            <select
              className="field__select"
              value={form.stylist}
              onChange={(e) => update({ stylist: e.target.value })}
            >
              <option value="">No preference</option>
              {stylists.map((t) => (
                <option key={`${t.name}-${t.role}`} value={`${t.name} (${t.role})`}>
                  {t.name} — {t.role}
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* Time: real slots, not a dropdown of hours the salon may be shut. */}
        <div className="field" ref={timeRef}>
          <span className="field__label label">Time</span>
          {!form.date ? (
            <p className="booking__hint">Pick a date first and we’ll show you what’s free.</p>
          ) : slots.length === 0 ? (
            <p className="booking__hint">
              {dateBlocked ?? 'No slots available on this date.'} Please choose another day.
            </p>
          ) : (
            <div className="slots" role="radiogroup" aria-label="Appointment time">
              {slots.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="radio"
                  aria-checked={form.time === t}
                  className={`slot${form.time === t ? ' is-active' : ''}`}
                  onClick={() => update({ time: t }, ['time'])}
                >
                  {t}
                </button>
              ))}
            </div>
          )}
          {errors.time && (
            <span className="field__error" id="time-error">
              {errors.time}
            </span>
          )}
        </div>

        <label className="field">
          <span className="field__label label">
            Anything we should know <span className="field__optional">optional</span>
          </span>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => update({ notes: e.target.value })}
            placeholder="Hair length, occasion, allergies…"
          />
        </label>

        <div className="booking__actions">
          <Button type="submit" disabled={!contactReady}>
            Request on WhatsApp
          </Button>
          <Button type="button" variant="outline" onClick={submit('email')}>
            Email instead
          </Button>
        </div>

        {!contactReady && (
          <p className="booking__warning">
            Add the salon’s WhatsApp number to <code>CONTACT.whatsapp</code> in{' '}
            <code>src/config/site.config.ts</code> to enable this button.
          </p>
        )}

        <p className="booking__note">
          Requests are confirmed by the salon — a slot is not held until we reply. We ask for
          an hour’s notice on same-day bookings.
        </p>
      </form>
    </div>
  )
}
