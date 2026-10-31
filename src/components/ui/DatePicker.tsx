import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  addDays,
  formatShort,
  fromISO,
  isSameDay,
  monthGrid,
  monthLabel,
  relativeLabel,
  startOfMonth,
  toISO,
  todayISO,
} from '@/utils/dates'

const WEEK_HEADS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export type DatePickerProps = {
  value: string
  onChange: (iso: string) => void
  /** How far ahead bookings are accepted. */
  maxDaysAhead?: number
  /** Return a reason to block a day, or null to allow it. */
  dayBlockedReason?: (iso: string) => string | null
  invalid?: boolean
  describedBy?: string
  label?: string
}

/**
 * Calendar date picker.
 *
 * Replaces `<input type="date">`, which renders as an American `mm/dd/yyyy`
 * box in most browsers regardless of the page language — confusing for a
 * salon whose clients read day-first — and which cannot grey out days the
 * salon is closed.
 *
 * The popover is a real grid with roving focus: arrow keys move by day and
 * week, Page Up/Down by month, Home/End to the ends of the week, Enter or
 * Space selects, Escape closes and returns focus to the trigger.
 */
export default function DatePicker({
  value,
  onChange,
  maxDaysAhead = 90,
  dayBlockedReason,
  invalid,
  describedBy,
  label = 'Choose a date',
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  /** Flips the popover above the trigger when there is no room below it. */
  const [above, setAbove] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const gridId = useId()

  const today = useMemo(() => new Date(), [])
  const minDate = useMemo(() => new Date(today.getFullYear(), today.getMonth(), today.getDate()), [today])
  const maxDate = useMemo(() => addDays(minDate, maxDaysAhead), [minDate, maxDaysAhead])

  /** The day the keyboard is on — not necessarily the selected one. */
  const [cursor, setCursor] = useState<Date>(() => (value ? fromISO(value) : minDate))
  const [month, setMonth] = useState<Date>(() => startOfMonth(value ? fromISO(value) : minDate))

  const isDisabled = useCallback(
    (d: Date) => {
      if (d < minDate || d > maxDate) return true
      return Boolean(dayBlockedReason?.(toISO(d)))
    },
    [minDate, maxDate, dayBlockedReason],
  )

  /* ------------------------------------------------- open / close plumbing */

  const close = useCallback(
    (refocus = true) => {
      setOpen(false)
      if (refocus) triggerRef.current?.focus()
    },
    [],
  )

  useEffect(() => {
    if (!open) return

    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        close()
      }
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])

  // Decide placement before paint, so the calendar never opens off-screen —
  // the date field sits low in the form on a phone.
  useLayoutEffect(() => {
    if (!open) return
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) return
    const popHeight = 380
    const roomBelow = window.innerHeight - rect.bottom
    setAbove(roomBelow < popHeight && rect.top > roomBelow)
  }, [open])

  // Move real focus onto the cursor day whenever it moves while open.
  // `preventScroll` matters: without it the browser scrolls the focused day
  // into view, which drags the page — and the popover with it — out from under
  // the placement that was just calculated.
  useEffect(() => {
    if (!open) return
    const el = gridRef.current?.querySelector<HTMLButtonElement>('[data-cursor="true"]')
    el?.focus({ preventScroll: true })
  }, [open, cursor])

  // Keep the visible month in step with the cursor.
  useEffect(() => {
    setMonth((m) => (m.getMonth() === cursor.getMonth() && m.getFullYear() === cursor.getFullYear() ? m : startOfMonth(cursor)))
  }, [cursor])

  const openAt = () => {
    const start = value ? fromISO(value) : minDate
    setCursor(start)
    setMonth(startOfMonth(start))
    setOpen(true)
  }

  /* -------------------------------------------------------------- keyboard */

  const clampToRange = (d: Date) => (d < minDate ? minDate : d > maxDate ? maxDate : d)

  const onGridKeyDown = (e: React.KeyboardEvent) => {
    const moves: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    }
    if (e.key in moves) {
      e.preventDefault()
      setCursor((c) => clampToRange(addDays(c, moves[e.key])))
      return
    }
    if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault()
      const delta = e.key === 'PageUp' ? -1 : 1
      setCursor((c) => clampToRange(new Date(c.getFullYear(), c.getMonth() + delta, c.getDate())))
      return
    }
    if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      setCursor((c) => {
        const weekday = (c.getDay() + 6) % 7
        return clampToRange(addDays(c, e.key === 'Home' ? -weekday : 6 - weekday))
      })
      return
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (!isDisabled(cursor)) {
        onChange(toISO(cursor))
        close()
      }
    }
  }

  /* ------------------------------------------------------------------ view */

  const days = useMemo(() => monthGrid(month), [month])
  const selected = value ? fromISO(value) : null
  const canGoBack = startOfMonth(month) > startOfMonth(minDate)
  const canGoForward = startOfMonth(month) < startOfMonth(maxDate)
  const relative = relativeLabel(value)

  return (
    <div className="datepicker" ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className={`datepicker__trigger${value ? ' has-value' : ''}`}
        onClick={() => (open ? close(false) : openAt())}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-invalid={invalid ? true : undefined}
        aria-describedby={describedBy}
      >
        <span className="datepicker__value">
          {value ? formatShort(value) : label}
          {relative && <span className="datepicker__relative">{relative}</span>}
        </span>
        <svg className="datepicker__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <rect x="3.5" y="5" width="17" height="16" rx="2" />
          <path d="M3.5 9.5h17M8 3v4M16 3v4" />
        </svg>
      </button>

      {open && (
        <div
          className={`datepicker__pop${above ? ' is-above' : ''}`}
          role="dialog"
          aria-modal="false"
          aria-label="Choose a date"
        >
          <div className="datepicker__head">
            <button
              type="button"
              className="datepicker__nav"
              onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              disabled={!canGoBack}
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="datepicker__month" aria-live="polite">
              {monthLabel(month)}
            </span>
            <button
              type="button"
              className="datepicker__nav"
              onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              disabled={!canGoForward}
              aria-label="Next month"
            >
              ›
            </button>
          </div>

          <div className="datepicker__weekdays" aria-hidden="true">
            {WEEK_HEADS.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>

          <div
            className="datepicker__grid"
            role="grid"
            id={gridId}
            ref={gridRef}
            onKeyDown={onGridKeyDown}
          >
            {days.map((d) => {
              const iso = toISO(d)
              const outside = d.getMonth() !== month.getMonth()
              const disabled = isDisabled(d)
              const isCursor = isSameDay(d, cursor)
              const isSelected = selected ? isSameDay(d, selected) : false
              const isToday = isSameDay(d, today)
              const blocked = dayBlockedReason?.(iso) ?? null

              return (
                <button
                  key={iso}
                  type="button"
                  role="gridcell"
                  data-cursor={isCursor || undefined}
                  tabIndex={isCursor ? 0 : -1}
                  className={[
                    'datepicker__day',
                    outside ? 'is-outside' : '',
                    isSelected ? 'is-selected' : '',
                    isToday ? 'is-today' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  disabled={disabled}
                  title={blocked ?? undefined}
                  aria-label={formatShort(iso)}
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(iso)
                    close()
                  }}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>

          <div className="datepicker__foot">
            <button
              type="button"
              className="datepicker__quick"
              onClick={() => {
                onChange(todayISO())
                close()
              }}
              disabled={isDisabled(minDate)}
            >
              Today
            </button>
            <button
              type="button"
              className="datepicker__quick"
              onClick={() => {
                onChange(toISO(addDays(minDate, 1)))
                close()
              }}
              disabled={isDisabled(addDays(minDate, 1))}
            >
              Tomorrow
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
