import { useRef, type ReactNode } from 'react'
import type { SectionId } from '@/config/site.config'
import { useReveal, useSectionTrigger } from '@/animations/useScrollTimeline'

/**
 * A page section, wired to the camera timeline.
 *
 * `showcase` marks the sections whose job is to show the 3D salon rather than
 * hold copy — they let pointer events through to the canvas so the visitor can
 * grab and orbit the room directly.
 */
export default function Section({
  id,
  children,
  showcase = false,
  className = '',
  label,
}: {
  id: SectionId
  children: ReactNode
  showcase?: boolean
  className?: string
  /** Accessible name for the landmark. */
  label: string
}) {
  const ref = useRef<HTMLElement>(null)
  useSectionTrigger(ref, id)
  useReveal(ref)

  return (
    <section
      id={id}
      ref={ref}
      aria-label={label}
      className={`section${showcase ? ' section--showcase' : ''} ${className}`.trim()}
    >
      <div className="section__inner">{children}</div>
    </section>
  )
}
