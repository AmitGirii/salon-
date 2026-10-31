/**
 * Date helpers for booking.
 *
 * Everything here works in LOCAL time on purpose.
 *
 * The obvious way to get today's date — `new Date().toISOString().slice(0, 10)`
 * — converts to UTC first. India is UTC+5:30, so between midnight and 05:30
 * IST that returns *yesterday*, and a late-night visitor would be shown a
 * "date is in the past" error for today, or offered a slot that has gone. The
 * same trap applies to `new Date('2026-09-12')`, which parses as UTC midnight
 * and can land on the previous day once rendered locally.
 *
 * So: build ISO strings from local date parts, and parse them back with the
 * numeric `Date(y, m, d)` constructor, which is local by definition.
 */

export const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const

/** `2026-09-12` from a Date, using its local calendar day. */
export function toISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** Parses `2026-09-12` as local midnight, not UTC midnight. */
export function fromISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export const todayISO = (): string => toISO(new Date())

export function addDays(d: Date, n: number): Date {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  out.setDate(out.getDate() + n)
  return out
}

export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export const weekdayName = (iso: string) => WEEKDAY_NAMES[fromISO(iso).getDay()]

export const monthLabel = (d: Date) => `${MONTHS[d.getMonth()]} ${d.getFullYear()}`

/** "Thu, 12 Sep 2026" — the day-first order Indian visitors expect. */
export function formatShort(iso: string): string {
  if (!iso) return ''
  const d = fromISO(iso)
  return `${WEEKDAY_NAMES[d.getDay()].slice(0, 3)}, ${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`
}

/** "Thursday, 12 September 2026" — used in the booking message. */
export function formatLong(iso: string): string {
  if (!iso) return ''
  const d = fromISO(iso)
  return `${WEEKDAY_NAMES[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

/** Friendly relative label for the next couple of days. */
export function relativeLabel(iso: string): string | null {
  if (!iso) return null
  const today = new Date()
  const d = fromISO(iso)
  if (isSameDay(d, today)) return 'Today'
  if (isSameDay(d, addDays(today, 1))) return 'Tomorrow'
  return null
}

/**
 * The six-week grid a month calendar renders, Monday-first.
 * Always 42 cells so the calendar never changes height between months.
 */
export function monthGrid(month: Date): Date[] {
  const first = startOfMonth(month)
  // getDay() is Sunday-based; shift so Monday is column 0.
  const lead = (first.getDay() + 6) % 7
  const start = addDays(first, -lead)
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

/** Minutes since midnight from "09:00". */
export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/** "9:00 AM" from minutes since midnight. */
export function formatSlot(minutes: number): string {
  const h24 = Math.floor(minutes / 60)
  const mm = String(minutes % 60).padStart(2, '0')
  const suffix = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${mm} ${suffix}`
}

/** Minutes since midnight, right now, in local time. */
export function nowMinutes(): number {
  const n = new Date()
  return n.getHours() * 60 + n.getMinutes()
}
